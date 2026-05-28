import pytest
from app.core.safety.rule_engine import RuleEngine


@pytest.fixture
def rule_engine():
    return RuleEngine()
