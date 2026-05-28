import random
from pathlib import Path

import yaml
from jinja2 import Environment, FileSystemLoader, Template


TEMPLATES_DIR = Path(__file__).parent / "templates"

# ── Module-level singleton ──
_prompt_manager: "PromptManager | None" = None


def get_prompt_manager() -> "PromptManager":
    """Return the process-wide PromptManager singleton."""
    global _prompt_manager
    if _prompt_manager is None:
        _prompt_manager = PromptManager()
    return _prompt_manager


class PromptManager:
    """Loads, versions, and renders prompt templates with ICL example injection."""

    def __init__(self, templates_dir: str | None = None):
        self._dir = Path(templates_dir) if templates_dir else TEMPLATES_DIR
        self._env = Environment(loader=FileSystemLoader(str(self._dir)), autoescape=False)
        self._icl_cache: dict[str, list[dict]] = {}

    def _load_icl_examples(self, agent_name: str) -> list[dict]:
        """Load ICL examples from YAML file for a given agent."""
        if agent_name in self._icl_cache:
            return self._icl_cache[agent_name]

        icl_path = self._dir / agent_name / "icl_examples.yaml"
        if icl_path.exists():
            with open(icl_path, encoding="utf-8") as f:
                data = yaml.safe_load(f)
                self._icl_cache[agent_name] = data.get("examples", [])
        else:
            self._icl_cache[agent_name] = []

        return self._icl_cache[agent_name]

    def get_icl_examples(
        self,
        agent_name: str,
        scenario_tags: list[str] | None = None,
        max_examples: int = 3,
    ) -> list[dict]:
        """Get ICL examples optionally filtered by scenario tags."""
        all_examples = self._load_icl_examples(agent_name)
        if not all_examples:
            return []

        if scenario_tags:
            tagged = [e for e in all_examples if set(e.get("tags", [])) & set(scenario_tags)]
            if tagged:
                return tagged[:max_examples]

        # Return random selection if no tag match or no tags specified
        k = min(max_examples, len(all_examples))
        return random.sample(all_examples, k)

    def render_system_prompt(
        self,
        agent_name: str,
        version: str = "v1",
        variables: dict | None = None,
    ) -> str:
        """Render a system prompt template with variables."""
        template_path = f"{agent_name}/system_{version}.j2"
        try:
            template: Template = self._env.get_template(template_path)
            return template.render(**(variables or {}))
        except Exception:
            # Fallback: try without version
            template = self._env.get_template(f"{agent_name}/system.j2")
            return template.render(**(variables or {}))

    def build_messages(
        self,
        agent_name: str,
        user_message: str,
        chat_history: list[dict],
        context: dict | None = None,
        icl_scenario_tags: list[str] | None = None,
        prompt_version: str = "v1",
        safety_context: str = "",
    ) -> list[dict]:
        """Build complete messages array for an agent LLM call.

        Structure:
        1. System message (domain knowledge + safety rules + context)
        2. ICL example exchanges (few-shot)
        3. Chat history
        4. Current user message (with optional safety context prefix)
        """
        ctx = context or {}
        system_prompt = self.render_system_prompt(
            agent_name, prompt_version, {"safety_context": safety_context, **ctx}
        )

        messages: list[dict] = [
            {"role": "system", "content": system_prompt}
        ]

        # Inject ICL examples
        icl_examples = self.get_icl_examples(agent_name, icl_scenario_tags)
        for ex in icl_examples:
            messages.append({"role": "user", "content": ex["user"]})
            messages.append({"role": "assistant", "content": ex["assistant"]})

        # Add chat history (last N messages)
        recent_history = chat_history[-20:]  # Sliding window
        messages.extend(recent_history)

        # Current message
        user_content = user_message
        if safety_context:
            user_content = f"{safety_context}\n\n---\n{user_message}"

        messages.append({"role": "user", "content": user_content})

        return messages
