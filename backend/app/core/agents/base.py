from abc import ABC, abstractmethod
from app.core.agents.protocol import AgentMessage
from app.core.llm.client import LLMClient


class BaseAgent(ABC):
    """Abstract base for all specialist agents."""

    def __init__(self, agent_id: str, llm: LLMClient):
        self.agent_id = agent_id
        self.llm = llm

    @property
    @abstractmethod
    def agent_type(self) -> str:
        ...

    @abstractmethod
    async def process(
        self,
        user_message: str,
        chat_history: list[dict],
        context: dict | None = None,
    ) -> AgentMessage:
        """Process user message and return agent response."""
        ...

    @abstractmethod
    def build_prompt(
        self,
        user_message: str,
        chat_history: list[dict],
        context: dict | None = None,
    ) -> list[dict]:
        """Build the messages array for LLM call."""
        ...
