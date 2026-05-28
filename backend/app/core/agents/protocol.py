from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal

from app.core.safety.rule_engine import SafetyFlag


AgentType = Literal["emotional_support", "assessment", "crisis", "orchestrator"]


@dataclass
class AgentMessage:
    agent_id: str
    agent_type: AgentType
    content: str
    metadata: dict = field(default_factory=dict)
    safety_flags: list[SafetyFlag] = field(default_factory=list)
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class AgentResponse:
    final_message: str
    agent_trace: list[AgentMessage] = field(default_factory=list)
    safety_flags: list[SafetyFlag] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)
