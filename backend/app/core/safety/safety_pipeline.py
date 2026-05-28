from dataclasses import dataclass, field
from enum import Enum

from redis.asyncio import Redis

from app.core.safety.rule_engine import RuleEngine, SafetyFlag
from app.core.safety.content_filter import ContentFilter
from app.core.safety.escalation import EscalationManager


class SafetyAction(Enum):
    PROCEED = "proceed"         # Continue normally
    FLAG = "flag"               # Continue but with safety flags
    HALT = "halt"               # Stop pipeline, return crisis response
    OVERRIDE = "override"       # Replace output with safe response


@dataclass
class SafetyResult:
    action: SafetyAction
    sanitized_text: str = ""
    flags: list[SafetyFlag] = field(default_factory=list)
    crisis_response: str | None = None
    escalation_message: str | None = None
    input_flags: list[str] = field(default_factory=list)


class SafetyPipeline:
    """Orchestrates all four safety layers."""

    def __init__(self, redis: Redis, rule_engine: RuleEngine | None = None):
        self.rule_engine = rule_engine or RuleEngine()
        self.content_filter = ContentFilter()
        self.escalation = EscalationManager(redis)

    async def process_input(self, user_id: str, text: str) -> SafetyResult:
        """Run input-side safety checks (Layer 1 + Layer 2)."""
        # Layer 1: Rule engine — crisis keyword detection
        flags = self.rule_engine.detect(text)

        # Check for critical flags — halt immediately
        if self.rule_engine.has_critical(flags):
            await self.escalation.record_flag(user_id, "critical")
            crisis_response = self.rule_engine.get_crisis_response(flags)
            return SafetyResult(
                action=SafetyAction.HALT,
                flags=flags,
                crisis_response=crisis_response,
            )

        # Record high+ flags for escalation tracking
        for f in flags:
            if f.severity in ("critical", "high"):
                await self.escalation.record_flag(user_id, f.severity)

        # Layer 2: Content filter
        filter_result = await self.content_filter.filter_input(text)
        sanitized = filter_result["sanitized_text"]

        # Check escalation threshold
        escalation_msg = None
        if flags and await self.escalation.should_escalate(user_id, "high"):
            escalation_msg = await self.escalation.get_escalation_message(user_id)

        action = SafetyAction.FLAG if flags else SafetyAction.PROCEED

        return SafetyResult(
            action=action,
            sanitized_text=sanitized,
            flags=flags,
            escalation_message=escalation_msg,
            input_flags=filter_result["flags"],
        )

    async def process_output(self, text: str) -> SafetyResult:
        """Run output-side safety checks (Layer 4)."""
        result = await self.content_filter.filter_output(text)

        # Check if output contains crisis-related language
        flags = self.rule_engine.detect(text)

        if flags:
            # AI should not generate harmful content
            # If the output triggers safety rules, something is wrong — override
            return SafetyResult(
                action=SafetyAction.OVERRIDE,
                flags=flags,
                sanitized_text="",
            )

        return SafetyResult(
            action=SafetyAction.PROCEED,
            sanitized_text=result["sanitized_text"],
        )
