from app.core.agents.base import BaseAgent
from app.core.agents.protocol import AgentMessage
from app.core.llm.client import LLMClient
from app.core.prompts.manager import PromptManager


class AssessmentAgent(BaseAgent):
    """Administers psychological assessments conversationally."""

    def __init__(self, llm: LLMClient, prompt_manager: PromptManager | None = None):
        super().__init__("assessment_agent", llm)
        self.prompt_manager = prompt_manager or PromptManager()

    @property
    def agent_type(self) -> str:
        return "assessment"

    def build_prompt(
        self,
        user_message: str,
        chat_history: list[dict],
        context: dict | None = None,
    ) -> list[dict]:
        ctx = context or {}
        return self.prompt_manager.build_messages(
            "assessment",
            user_message,
            chat_history,
            ctx,
            prompt_version="v1",
        )

    async def process(
        self,
        user_message: str,
        chat_history: list[dict],
        context: dict | None = None,
    ) -> AgentMessage:
        messages = self.build_prompt(user_message, chat_history, context)
        response = await self.llm.chat(messages)

        return AgentMessage(
            agent_id=self.agent_id,
            agent_type="assessment",
            content=response,
            metadata=context or {},
        )
