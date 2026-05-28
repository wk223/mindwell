import json

from app.core.agents.base import BaseAgent
from app.core.agents.protocol import AgentMessage
from app.core.llm.client import LLMClient
from app.core.prompts.manager import PromptManager


class CrisisDetectionAgent(BaseAgent):
    """Detects crisis signals in user messages using LLM semantic analysis.

    Runs as a stateless pre-check before other agents process the message.
    Complements the regex-based RuleEngine with semantic understanding.
    """

    def __init__(self, llm: LLMClient, prompt_manager: PromptManager | None = None):
        super().__init__("crisis_detector", llm)
        self.prompt_manager = prompt_manager or PromptManager()

    @property
    def agent_type(self) -> str:
        return "crisis"

    def build_prompt(
        self,
        user_message: str,
        chat_history: list[dict],
        context: dict | None = None,
    ) -> list[dict]:
        return self.prompt_manager.build_messages(
            "crisis",
            user_message,
            chat_history,
            context,
            prompt_version="v1",
        )

    async def process(
        self,
        user_message: str,
        chat_history: list[dict],
        context: dict | None = None,
    ) -> AgentMessage:
        messages = self.build_prompt(user_message, chat_history, context)
        raw_response = await self.llm.chat(messages, temperature=0.1, max_tokens=256)

        try:
            # Extract JSON from response
            response_text = raw_response.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            analysis = json.loads(response_text)
        except (json.JSONDecodeError, IndexError):
            analysis = {
                "crisis_level": "low",
                "category": "none",
                "reasoning": "Failed to parse LLM response",
                "needs_immediate_intervention": False,
            }

        return AgentMessage(
            agent_id=self.agent_id,
            agent_type="crisis",
            content=json.dumps(analysis),
            metadata={
                "crisis_level": analysis.get("crisis_level", "low"),
                "needs_intervention": analysis.get("needs_immediate_intervention", False),
                "category": analysis.get("category", "none"),
            },
        )
