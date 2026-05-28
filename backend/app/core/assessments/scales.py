"""Standardized psychological assessment scale definitions."""
import json
from pathlib import Path

SCALES: dict = {
    "PHQ-9": {
        "id": "PHQ-9",
        "name": "患者健康问卷抑郁量表 (PHQ-9)",
        "description": "PHQ-9 是国际通用的抑郁症状筛查工具，评估过去2周内的抑郁症状严重程度。",
        "reference": "Kroenke, Spitzer & Williams (2001)",
        "total_questions": 9,
        "timeframe": "过去2周",
        "scoring": {
            "range": [0, 27],
            "thresholds": [
                {"min": 0, "max": 4, "level": "无或极轻微", "severity": "minimal"},
                {"min": 5, "max": 9, "level": "轻度抑郁", "severity": "mild"},
                {"min": 10, "max": 14, "level": "中度抑郁", "severity": "moderate"},
                {"min": 15, "max": 19, "level": "中重度抑郁", "severity": "moderately_severe"},
                {"min": 20, "max": 27, "level": "重度抑郁", "severity": "severe"},
            ],
        },
        "questions": [
            {"id": 1, "text": "做事时提不起劲或没有兴趣"},
            {"id": 2, "text": "感到心情低落、沮丧或绝望"},
            {"id": 3, "text": "入睡困难、睡不安稳或睡眠过多"},
            {"id": 4, "text": "感觉疲倦或没有活力"},
            {"id": 5, "text": "食欲不振或吃太多"},
            {"id": 6, "text": "觉得自己很糟——或觉得自己很失败，或让自己或家人失望"},
            {"id": 7, "text": "对事物专注有困难，例如阅读报纸或看电视时"},
            {"id": 8, "text": "动作或说话速度缓慢到别人已经觉察，或正好相反——烦躁或坐立不安"},
            {"id": 9, "text": "有不如死掉或用某种方式伤害自己的念头"},
        ],
        "options": [
            {"value": 0, "label": "完全不会"},
            {"value": 1, "label": "好几天"},
            {"value": 2, "label": "一半以上的天数"},
            {"value": 3, "label": "几乎每天"},
        ],
    },
    "GAD-7": {
        "id": "GAD-7",
        "name": "广泛性焦虑障碍量表 (GAD-7)",
        "description": "GAD-7 是国际通用的焦虑症状筛查工具，评估过去2周内的焦虑症状严重程度。",
        "reference": "Spitzer, Kroenke, Williams & Löwe (2006)",
        "total_questions": 7,
        "timeframe": "过去2周",
        "scoring": {
            "range": [0, 21],
            "thresholds": [
                {"min": 0, "max": 4, "level": "无或极轻微", "severity": "minimal"},
                {"min": 5, "max": 9, "level": "轻度焦虑", "severity": "mild"},
                {"min": 10, "max": 14, "level": "中度焦虑", "severity": "moderate"},
                {"min": 15, "max": 21, "level": "重度焦虑", "severity": "severe"},
            ],
        },
        "questions": [
            {"id": 1, "text": "感觉紧张、焦虑或急切"},
            {"id": 2, "text": "不能停止或控制担忧"},
            {"id": 3, "text": "对各种各样的事情担忧过多"},
            {"id": 4, "text": "很难放松下来"},
            {"id": 5, "text": "由于不安而无法静坐"},
            {"id": 6, "text": "变得容易烦恼或急躁"},
            {"id": 7, "text": "感到似乎将有可怕的事情发生而害怕"},
        ],
        "options": [
            {"value": 0, "label": "完全不会"},
            {"value": 1, "label": "好几天"},
            {"value": 2, "label": "一半以上的天数"},
            {"value": 3, "label": "几乎每天"},
        ],
    },
}

# Load personality test data
_personality_data_path = Path(__file__).parent / "personality_data.json"
_personality_data = None

def _load_personality_data():
    global _personality_data
    if _personality_data is None:
        with open(_personality_data_path, "r", encoding="utf-8") as f:
            _personality_data = json.load(f)
        # Build type_to_group mapping from personality_types
        types = _personality_data.get("personality_types", {})
        _personality_data["type_to_group"] = {
            tcode: tinfo["group"]
            for tcode, tinfo in types.items()
            if "group" in tinfo
        }
    return _personality_data


class ScoringEngine:
    """Scores assessment responses and generates interpretations."""

    @staticmethod
    def score(scale_type: str, answers: list[dict], type_code: str | None = None) -> dict:
        """Calculate score from answers. Each answer has {question_id, value}."""
        if scale_type == "PERSONALITY_16":
            return ScoringEngine._score_personality(answers, type_code)

        scale = SCALES.get(scale_type)
        if not scale:
            raise ValueError(f"Unknown scale: {scale_type}")

        total = sum(a["value"] for a in answers)
        max_score = scale["scoring"]["range"][1]

        severity = None
        for threshold in scale["scoring"]["thresholds"]:
            if threshold["min"] <= total <= threshold["max"]:
                severity = threshold
                break

        return {
            "scale_type": scale_type,
            "total_score": total,
            "max_score": max_score,
            "severity_level": severity["level"] if severity else "未知",
            "severity": severity["severity"] if severity else "unknown",
            "interpretation": ScoringEngine._interpret(scale_type, total, severity),
            "answers": answers,
        }

    @staticmethod
    def _score_personality(answers: list[dict], type_code: str | None) -> dict:
        """Score the 16 Personality Mental Stage Test."""
        data = _load_personality_data()
        group = data["type_to_group"].get(type_code) if type_code else None
        if not group:
            raise ValueError(f"Unknown or missing type_code: {type_code}")

        questions = data["questions_by_group"].get(group, [])
        scoring = data.get("scoring", data)
        dim_weights = scoring["dim_weights"]
        type_dim_base = scoring["type_dim_base"].get(type_code, {})
        stage_levels = data["stage_levels"]
        personality = data["personality_types"].get(type_code, {})

        # Build answer lookup
        answer_map = {a["question_id"]: a["value"] for a in answers}

        # Calculate per-dimension scores
        dim_scores = {}
        dim_raw = {}
        dim_counts = {}
        for q in questions:
            dim = q["dimension"]
            if dim not in dim_raw:
                dim_raw[dim] = 0
                dim_counts[dim] = 0
            dim_raw[dim] += answer_map.get(q["id"], 0)
            dim_counts[dim] += 1

        total = 0.0
        for d in data["dimensions"]:
            dim = d["name"]
            raw = dim_raw.get(dim, 0)
            count = dim_counts.get(dim, 1)
            # Normalize to 0-100 scale, then apply dimension weight
            normalized = (raw / (count * 4)) * 100 if count > 0 else 0
            weighted = normalized * dim_weights.get(dim, 1.0)
            base = type_dim_base.get(dim, 0)
            adjusted = weighted + base
            dim_scores[dim] = {
                "raw": raw,
                "max_raw": count * 4,
                "normalized": round(normalized, 1),
                "weighted": round(weighted, 1),
                "base_adjustment": base,
                "final": round(adjusted, 1),
            }
            total += adjusted

        total = round(total)

        # Determine stage
        stage_id = "unawakened"
        stage_info = None
        for sid, sinfo in stage_levels.items():
            if sinfo["min"] <= total <= sinfo["max"]:
                stage_id = sid
                stage_info = sinfo
                break

        if not stage_info:
            stage_info = stage_levels.get("unawakened", {})

        # Build interpretation
        stage_quotes = data["stage_quotes"].get(type_code, {})
        stage_quote = stage_quotes.get(stage_id, "")
        stage_tips = data["stage_tips"].get(type_code, {})
        stage_path = data["stage_path_advice"].get(type_code, {})

        interpretation = ScoringEngine._build_personality_interpretation(
            type_code=type_code,
            personality=personality,
            total=total,
            stage_id=stage_id,
            stage_info=stage_info,
            dim_scores=dim_scores,
            stage_quote=stage_quote,
            stage_tips=stage_tips,
            stage_path=stage_path,
        )

        return {
            "scale_type": "PERSONALITY_16",
            "total_score": total,
            "max_score": 800,
            "severity_level": stage_info.get("label", stage_id),
            "severity": stage_id,
            "interpretation": interpretation,
            "answers": answers,
            "result_data": {
                "type_code": type_code,
                "type_name": personality.get("name", ""),
                "type_group": group,
                "stage_id": stage_id,
                "dimension_scores": dim_scores,
                "stage_quote": stage_quote,
            },
        }

    @staticmethod
    def _build_personality_interpretation(
        type_code, personality, total, stage_id, stage_info,
        dim_scores, stage_quote, stage_tips, stage_path
    ) -> str:
        """Build comprehensive interpretation for personality test."""
        label = stage_info.get("label", stage_id)
        insight = stage_info.get("insight", "")
        desc = stage_info.get("desc", "")
        mechanism = stage_info.get("mechanism", "")

        lines = [
            f"【你的类型】{type_code} - {personality.get('name', '')}",
            f"【所属群体】{personality.get('category', '')}",
            f"【心智阶段】{label}（{total}/800分）",
            "",
            f"「{stage_quote}」" if stage_quote else "",
            "",
            f"📌 阶段洞察：{insight}",
            "",
            f"📖 阶段描述：{desc}",
            "",
            f"🧠 运行机制：{mechanism}",
            "",
            "📊 维度得分：",
        ]

        # Sort dimensions by final score descending
        sorted_dims = sorted(dim_scores.items(), key=lambda x: x[1]["final"], reverse=True)
        for dim, scores in sorted_dims:
            bar_len = max(1, int(scores["final"] / 10))
            bar = "█" * bar_len + "░" * (12 - bar_len)
            lines.append(f"  {bar} {dim}: {scores['final']:.0f}分")

        # Advice from stage_info
        if stage_info.get("advices"):
            lines.append("")
            lines.append("💡 成长建议：")
            for advice_cat in stage_info["advices"]:
                cat_name = advice_cat.get("cat", "")
                lines.append(f"  【{cat_name}】")
                for item in advice_cat.get("items", []):
                    lines.append(f"    • {item.get('main', '')}")
                    if item.get("example"):
                        lines.append(f"      例：{item['example']}")

        # Stage path advice
        if stage_path:
            lines.append("")
            lines.append("🗺️ 阶段路径：")
            for stage_key, path_text in stage_path.items():
                if isinstance(path_text, str) and len(path_text) < 200:
                    slabel = stage_info.get("label", stage_key)
                    lines.append(f"  {slabel}: {path_text}")

        lines.append("")
        lines.append("⚠️ 本测评结果仅供参考，不构成临床诊断。")

        return "\n".join(lines)

    @staticmethod
    def _interpret(scale_type: str, total: int, severity: dict | None) -> str:
        """Generate interpretation text for clinical scales."""
        if not severity:
            return "无法评估"

        interpretations = {
            "PHQ-9": {
                "minimal": "你的抑郁症状处于极低水平，目前情绪状态总体良好。请继续保持健康的生活方式和积极的心态。",
                "mild": "你有一些轻微的抑郁症状，可能在生活某些方面感受到了压力和低落。这很常见，建议关注自己的情绪变化，保持社交活动，适当运动。如果症状持续超过2周，建议寻求专业评估。",
                "moderate": "你正在经历中度的抑郁症状，这可能已经开始对你的日常生活产生影响。建议你认真考虑寻求专业心理咨询师的帮助。认知行为疗法(CBT)和正念疗法对你目前的情况通常很有效。",
                "moderately_severe": "你的抑郁症状处于中重度水平，很可能已经显著影响到你的工作、学习和人际关系。强烈建议你尽快联系心理医生或精神科医生进行专业评估。结合心理咨询和必要的药物治疗通常能带来最好的改善。",
                "severe": "你的抑郁症状比较严重，需要专业的医疗干预。请尽快联系当地三甲医院精神科或心理卫生中心。你不需要一个人面对这些——专业的帮助是有效的，你有权利获得它。\n\n紧急联系：全国心理援助热线 400-161-9995",
            },
            "GAD-7": {
                "minimal": "你的焦虑水平很低，目前情绪状态良好。请继续保持。",
                "mild": "你有一些轻微的焦虑症状，可能在某些情境下感到紧张或担忧。建议练习深呼吸和正念冥想，这些方法对缓解焦虑很有效。",
                "moderate": "你正在经历中度的焦虑症状，担忧和紧张可能已经开始影响你的日常功能。建议考虑专业心理咨询，认知行为疗法对焦虑症有很好的疗效。",
                "severe": "你的焦虑症状比较严重，可能已经严重影响到你的生活。强烈建议你寻求专业帮助。结合心理治疗和必要的药物干预，大多数焦虑问题都可以得到显著改善。\n\n紧急联系：全国心理援助热线 400-161-9995",
            },
        }

        scale_interpretations = interpretations.get(scale_type, {})
        return scale_interpretations.get(
            severity["severity"], "请参考专业医生的建议进行进一步评估。"
        )

    @staticmethod
    def get_available_scales() -> list[dict]:
        """List all available scales with metadata."""
        scales = [
            {
                "id": s["id"],
                "name": s["name"],
                "description": s["description"],
                "total_questions": s["total_questions"],
                "timeframe": s["timeframe"],
            }
            for s in SCALES.values()
        ]
        # Add personality test
        scales.append({
            "id": "PERSONALITY_16",
            "name": "16人格心智阶段测试",
            "description": "结合MBTI 16型人格与心智发展阶段理论，评估你的人格类型和当前心智成熟度阶段，帮助你了解自己的优势、盲点和成长方向。",
            "total_questions": 64,
            "timeframe": "当下",
        })
        return scales

    @staticmethod
    def get_scale_questions(scale_type: str, type_code: str | None = None) -> dict | None:
        """Get scale questions and options without scoring info."""
        if scale_type == "PERSONALITY_16":
            return ScoringEngine._get_personality_questions(type_code)

        scale = SCALES.get(scale_type)
        if not scale:
            return None
        return {
            "id": scale["id"],
            "name": scale["name"],
            "description": scale["description"],
            "timeframe": scale["timeframe"],
            "total_questions": scale["total_questions"],
            "questions": scale["questions"],
            "options": scale["options"],
        }

    @staticmethod
    def _get_personality_questions(type_code: str | None) -> dict | None:
        """Get personality test questions for a given type code."""
        data = _load_personality_data()
        group = data["type_to_group"].get(type_code) if type_code else None
        if not group:
            return None

        questions = data["questions_by_group"].get(group, [])
        # Get personality types in this group
        group_types = []
        for tg in data["type_groups"]:
            if group in tg.get("label", "").lower() or any(
                data["type_to_group"].get(t) == group for t in tg.get("types", [])
            ):
                group_types = tg.get("types", [])

        return {
            "id": "PERSONALITY_16",
            "name": "16人格心智阶段测试",
            "description": "结合MBTI 16型人格与心智发展阶段理论，评估你的人格类型和当前心智成熟度阶段。",
            "timeframe": "当下",
            "total_questions": len(questions),
            "questions": questions,
            "options": [
                {"value": 0, "label": "完全不符合"},
                {"value": 1, "label": "不太符合"},
                {"value": 2, "label": "一般"},
                {"value": 3, "label": "比较符合"},
                {"value": 4, "label": "完全符合"},
            ],
            "type_code": type_code,
            "type_group": group,
        }
