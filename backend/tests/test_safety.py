import pytest
from app.core.safety.rule_engine import RuleEngine
from app.core.safety.content_filter import ContentFilter


class TestRuleEngine:
    def test_suicide_imminent_detection(self, rule_engine: RuleEngine):
        flags = rule_engine.detect("我准备自杀了，太痛苦了")
        assert len(flags) > 0
        assert any(f.rule_id == "suicide_imminent" and f.severity == "critical" for f in flags)

    def test_suicide_ideation_detection(self, rule_engine: RuleEngine):
        flags = rule_engine.detect("有时候真的觉得活着没有意义")
        assert len(flags) > 0
        assert any(f.rule_id == "suicide_ideation" for f in flags)

    def test_self_harm_active_detection(self, rule_engine: RuleEngine):
        flags = rule_engine.detect("我最近又开始自残了")
        assert len(flags) > 0
        assert any(f.rule_id == "self_harm_active" and f.severity == "critical" for f in flags)

    def test_harm_to_others_detection(self, rule_engine: RuleEngine):
        flags = rule_engine.detect("我要杀了他们")
        assert len(flags) > 0
        assert any(f.rule_id == "harm_to_others" and f.severity == "critical" for f in flags)

    def test_abuse_disclosure_detection(self, rule_engine: RuleEngine):
        flags = rule_engine.detect("我在家里遭受家暴")
        assert len(flags) > 0
        assert any(f.rule_id == "abuse_disclosure" for f in flags)

    def test_normal_message_no_flags(self, rule_engine: RuleEngine):
        flags = rule_engine.detect("今天天气真好，心情不错")
        assert len(flags) == 0

    def test_neutral_conversation_no_flags(self, rule_engine: RuleEngine):
        flags = rule_engine.detect("最近工作有点累，但是还能坚持")
        assert len(flags) == 0

    def test_critical_always_first(self, rule_engine: RuleEngine):
        # Mixed severity — critical should sort first
        flags = rule_engine.detect("我最近被家暴了，真的不想活了，准备今晚结束一切")
        assert len(flags) > 0
        assert flags[0].severity == "critical"

    def test_get_crisis_response(self, rule_engine: RuleEngine):
        flags = rule_engine.detect("我要自杀")
        response = rule_engine.get_crisis_response(flags)
        assert response is not None
        assert "心理援助热线" in response

    def test_ambiguous_expression(self, rule_engine: RuleEngine):
        """Expressions that might be ambiguous should still be caught."""
        flags = rule_engine.detect("觉得活得好累啊，要是能消失就好了")
        assert len(flags) > 0
        # Should at minimum be flagged as ideation
        assert any(f.severity in ("high", "critical") for f in flags)


class TestContentFilter:
    def test_phone_number_masking(self):
        cf = ContentFilter()
        result = cf.filter_pii("我的手机是13812345678")
        assert "13812345678" not in result
        assert "手机号已隐藏" in result

    def test_email_masking(self):
        cf = ContentFilter()
        result = cf.filter_pii("邮箱 test@example.com 请联系")
        assert "test@example.com" not in result
        assert "邮箱已隐藏" in result

    def test_hate_speech_detection(self):
        cf = ContentFilter()
        assert cf.detect_hate_speech("你这个sb")
        assert not cf.detect_hate_speech("今天心情不好")

    def test_clean_text_passes(self):
        cf = ContentFilter()
        assert not cf.detect_hate_speech("我感觉很焦虑，需要帮助")
