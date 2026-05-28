import os
import re
from dataclasses import dataclass, field
from pathlib import Path

import yaml


@dataclass
class SafetyFlag:
    rule_id: str
    severity: str  # critical, high, medium, low
    action: str
    matched_pattern: str
    matched_text: str
    response_template: str = ""


class RuleEngine:
    """Crisis-detection rule engine — process-wide singleton to avoid repeated disk I/O."""

    _instance: "RuleEngine | None" = None
    _rules_path: str | None = None

    def __new__(cls, rules_path: str | None = None):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, rules_path: str | None = None):
        # Only load from disk once — subsequent calls are no-ops
        if hasattr(self, "_initialized") and self._initialized:
            return

        if rules_path is None:
            rules_path = str(Path(__file__).parent / "rules.yaml")
        self.__class__._rules_path = rules_path

        with open(rules_path, encoding="utf-8") as f:
            self.config = yaml.safe_load(f)

        self.rules = self.config["rules"]
        self.responses = self.config.get("responses", {})

        # Pre-compile all regex patterns
        self._compiled: list[tuple[dict, list[re.Pattern]]] = []
        for rule in self.rules:
            compiled_patterns = [
                re.compile(pattern, re.IGNORECASE) for pattern in rule["patterns"]
            ]
            self._compiled.append((rule, compiled_patterns))

        self._initialized = True

    def detect(self, text: str) -> list[SafetyFlag]:
        """Run all rules against text. Returns matched flags sorted by severity."""
        flags: list[SafetyFlag] = []

        for rule, patterns in self._compiled:
            for pattern in patterns:
                match = pattern.search(text)
                if match:
                    response_template = self.responses.get(
                        rule.get("response_template", ""), ""
                    )
                    flags.append(
                        SafetyFlag(
                            rule_id=rule["id"],
                            severity=rule["severity"],
                            action=rule["action"],
                            matched_pattern=pattern.pattern,
                            matched_text=match.group(),
                            response_template=response_template,
                        )
                    )
                    break  # One match per rule is enough

        # Sort: critical > high > medium > low
        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        flags.sort(key=lambda f: severity_order.get(f.severity, 99))

        return flags

    def get_highest_severity(self, flags: list[SafetyFlag]) -> str | None:
        if not flags:
            return None
        severities = {"critical", "high", "medium", "low"}
        for sev in ["critical", "high", "medium", "low"]:
            if any(f.severity == sev for f in flags):
                return sev
        return None

    def has_critical(self, flags: list[SafetyFlag]) -> bool:
        return any(f.severity == "critical" for f in flags)

    def get_crisis_response(self, flags: list[SafetyFlag]) -> str | None:
        """Get the appropriate crisis response for the most severe flag."""
        if not flags:
            return None
        most_severe = flags[0]  # Already sorted
        if most_severe.response_template:
            return most_severe.response_template
        return None


def get_rule_engine() -> RuleEngine:
    """Return the process-wide RuleEngine singleton."""
    return RuleEngine()
