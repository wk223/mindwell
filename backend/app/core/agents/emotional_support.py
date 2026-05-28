from app.core.agents.base import BaseAgent
from app.core.agents.protocol import AgentMessage
from app.core.llm.client import LLMClient
from app.core.prompts.manager import PromptManager
from app.core.safety.rule_engine import SafetyFlag


class EmotionalSupportAgent(BaseAgent):
    """Primary dialogue agent providing empathetic emotional support."""

    def __init__(self, llm: LLMClient, prompt_manager: PromptManager | None = None):
        super().__init__("emotional_support", llm)
        self.prompt_manager = prompt_manager or PromptManager()

    @property
    def agent_type(self) -> str:
        return "emotional_support"

    def build_prompt(
        self,
        user_message: str,
        chat_history: list[dict],
        context: dict | None = None,
    ) -> list[dict]:
        ctx = context or {}
        safety_context = ctx.get("safety_context", "")
        icl_tags = ctx.get("scenario_tags", [])

        return self.prompt_manager.build_messages(
            "emotional_support",
            user_message,
            chat_history,
            ctx,
            icl_scenario_tags=icl_tags,
            prompt_version="v1",
            safety_context=safety_context,
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
            agent_type="emotional_support",
            content=response,
            metadata={"prompt_version": "v1"},
        )

    async def process_stream(
        self,
        user_message: str,
        chat_history: list[dict],
        context: dict | None = None,
    ):
        """Stream response tokens as they're generated."""
        messages = self.build_prompt(user_message, chat_history, context)

        full_response = ""
        async for token in self.llm.chat_stream(messages):
            full_response += token
            yield token
