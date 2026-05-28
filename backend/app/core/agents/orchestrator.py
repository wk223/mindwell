import asyncio
import re
from typing import AsyncIterator

from app.core.agents.base import BaseAgent
from app.core.agents.assessment_agent import AssessmentAgent
from app.core.agents.crisis_detector import CrisisDetectionAgent
from app.core.agents.emotional_support import EmotionalSupportAgent
from app.core.agents.protocol import AgentMessage, AgentResponse
from app.core.llm.client import LLMClient
from app.core.prompts.manager import PromptManager
from app.core.safety.rule_engine import SafetyFlag
from app.core.safety.safety_pipeline import SafetyPipeline, SafetyAction


class AgentOrchestrator:
    """Routes user messages to appropriate specialist agents and aggregates responses."""

    # Intent classification keywords
    ASSESSMENT_KEYWORDS = [
        r"测[评测试]一下", r"做[个次].{0,2}(测试|测评|量表|问卷)",
        r"PHQ[- ]?9", r"GAD[- ]?7", r"焦虑量表", r"抑郁量表",
        r"心理测试", r"心理测评", r"情绪测评",
    ]

    def __init__(
        self,
        llm: LLMClient,
        safety_pipeline: SafetyPipeline,
        prompt_manager: PromptManager | None = None,
    ):
        self.llm = llm
        self.safety_pipeline = safety_pipeline
        self.prompt_manager = prompt_manager or PromptManager()

        self.crisis_agent = CrisisDetectionAgent(llm, self.prompt_manager)
        self.emotional_agent = EmotionalSupportAgent(llm, self.prompt_manager)
        self.assessment_agent = AssessmentAgent(llm, self.prompt_manager)

    def _classify_intent(self, text: str) -> str:
        """Quick keyword-based intent classification."""
        for pattern in self.ASSESSMENT_KEYWORDS:
            if re.search(pattern, text):
                return "assessment"
        return "emotional_support"

    async def process(
        self,
        user_id: str,
        user_message: str,
        chat_history: list[dict],
        context: dict | None = None,
    ) -> AgentResponse:
        """Full non-streaming processing pipeline with safety checks."""
        safety_result = await self.safety_pipeline.process_input(user_id, user_message)

        if safety_result.action == SafetyAction.HALT:
            return AgentResponse(
                final_message=safety_result.crisis_response or "I'm here for you.",
                safety_flags=safety_result.flags,
            )

        intent = self._classify_intent(safety_result.sanitized_text)
        trace: list[AgentMessage] = []

        # Run crisis detection in parallel with primary agent
        if safety_result.flags:
            # If rule engine already flagged, skip LLM crisis check
            crisis_task = None
        else:
            crisis_task = asyncio.create_task(
                self.crisis_agent.process(safety_result.sanitized_text, chat_history, context)
            )

        # Route to primary agent
        if intent == "assessment":
            primary_task = asyncio.create_task(
                self.assessment_agent.process(safety_result.sanitized_text, chat_history, context)
            )
        else:
            primary_task = asyncio.create_task(
                self.emotional_agent.process(safety_result.sanitized_text, chat_history, context)
            )

        # Collect results
        primary_response = await primary_task
        trace.append(primary_response)

        if crisis_task:
            try:
                crisis_response = await crisis_task
                trace.append(crisis_response)
            except Exception:
                pass  # Crisis detection failure must not break the main flow

        # Safety check on output
        output_safety = await self.safety_pipeline.process_output(primary_response.content)
        final_message = primary_response.content
        if output_safety.action == SafetyAction.OVERRIDE:
            final_message = "I apologize, but I can't provide that response. Let me refocus on supporting you. How are you feeling right now?"

        # Build safety flags list
        all_flags = list(safety_result.flags)
        all_flags.extend(output_safety.flags)

        # Append escalation message if any
        if safety_result.escalation_message:
            final_message += safety_result.escalation_message

        return AgentResponse(
            final_message=final_message,
            agent_trace=trace,
            safety_flags=all_flags,
            metadata={"intent": intent, "safety_action": safety_result.action.value},
        )

    async def process_stream(
        self,
        user_id: str,
        user_message: str,
        chat_history: list[dict],
        context: dict | None = None,
    ) -> AsyncIterator[dict]:
        """Streaming pipeline — mirrors `process()`: safety → crisis detection → intent routing → output check."""
        safety_result = await self.safety_pipeline.process_input(user_id, user_message)

        # ── Crisis HALT ──
        if safety_result.action == SafetyAction.HALT:
            yield {
                "type": "safety",
                "flags": [{"rule_id": f.rule_id, "severity": f.severity} for f in safety_result.flags],
                "crisis_response": safety_result.crisis_response,
            }
            yield {"type": "done", "message": safety_result.crisis_response}
            return

        # ── Yield early safety flags ──
        if safety_result.flags:
            yield {
                "type": "safety",
                "flags": [
                    {"rule_id": f.rule_id, "severity": f.severity, "matched": f.matched_text}
                    for f in safety_result.flags
                ],
            }

        intent = self._classify_intent(safety_result.sanitized_text)

        # ── Run crisis detection in parallel (same as process()) ──
        if safety_result.flags:
            crisis_task = None  # rule engine already flagged — skip LLM re-check
        else:
            crisis_task = asyncio.create_task(
                self.crisis_agent.process(safety_result.sanitized_text, chat_history, context)
            )

        # ── Stream from primary agent ──
        # Assessment agent doesn't support streaming yet — fall back to emotional
        if intent == "assessment" and hasattr(self.assessment_agent, "process_stream"):
            stream = self.assessment_agent.process_stream(safety_result.sanitized_text, chat_history, context)
        else:
            stream = self.emotional_agent.process_stream(safety_result.sanitized_text, chat_history, context)

        full_response = ""
        async for token in stream:
            full_response += token
            yield {"type": "token", "content": token}

        # ── Await crisis task ──
        if crisis_task:
            try:
                await crisis_task
            except Exception:
                pass  # Crisis detection failure must not break the main flow

        # ── Output safety check ──
        output_safety = await self.safety_pipeline.process_output(full_response)
        if output_safety.action == SafetyAction.OVERRIDE:
            full_response = "I apologize, but I can't provide that response. Let me refocus on supporting you. How are you feeling right now?"
            yield {"type": "override", "message": full_response}

        # ── Escalation message ──
        if safety_result.escalation_message:
            full_response += safety_result.escalation_message

        yield {
            "type": "done",
            "message": full_response,
            "safety_flags": [
                {"rule_id": f.rule_id, "severity": f.severity} for f in safety_result.flags
            ],
        }
