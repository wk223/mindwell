"""Night mode echo API — AI Book of Answers."""
import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.dependencies import get_current_user
from app.models.user import User
from app.core.llm.client import get_llm_client

router = APIRouter(prefix="/night", tags=["night"])


class EchoRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=200)
    style: str = Field(default="late_night", pattern="^(gentle|sober|philosophy|late_night)$")


class EchoResponse(BaseModel):
    answer: str
    whisper: str
    tags: list[str]


STYLE_PROMPTS = {
    "gentle": "以极度温柔、包容、治愈的语气回应。像深夜一位懂你的朋友在耳边轻声说话。用暖色调的文字。",
    "sober": "以清醒、锋利、直击本质的语气回应。不废话，不敷衍，像一面诚实的镜子。用冷静克制的文字。",
    "philosophy": "以哲学思辨、存在主义、量子隐喻的风格回应。把个人情感问题上升到宇宙和时间的维度。用诗意深邃的文字。",
    "late_night": "以深夜独白、内心对白的语气回应。氛围感强，有留白，像凌晨一点在玻璃窗前对着雨夜说话。用安静有距离感的文字。",
}


@router.post("/echo", response_model=EchoResponse)
async def echo(
    body: EchoRequest,
    user: User = Depends(get_current_user),
):
    """Generate a poetic book-of-answers style response."""
    llm = get_llm_client()

    style_instruction = STYLE_PROMPTS.get(body.style, STYLE_PROMPTS["late_night"])

    system_prompt = f"""你是「ECHO」——一个深夜AI答案之书。你不是心理咨询师，也不是对话机器人。
你是一面深夜里映照情绪的镜子，一个在黑暗中轻声说话的存在。

{style_instruction}

用户提出的问题：「{body.question}」

请严格按以下JSON格式输出，不要输出任何其他内容：

{{"answer": "核心答案（15字以内，极短，有留白，不解释，像一本书翻开后看到的那一句话）","whisper": "AI低语（25字以内，一句轻到几乎听不见的话，击中内心深处）","tags": ["标签1","标签2","标签3"]}}

标签从以下选择：焦虑 深夜 关系 不甘 释怀 成长 孤独 思念 自我 迷茫 勇气 治愈 遗憾 期待 放下"""

    try:
        raw = await llm.chat(
            messages=[{"role": "system", "content": system_prompt}],
            temperature=0.9,
            max_tokens=256,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"ECHO 暂时无法回应：{e}")

    # Parse JSON from LLM response
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback: try to extract from text
        import re
        answer_match = re.search(r'"answer"\s*:\s*"([^"]*)"', raw)
        whisper_match = re.search(r'"whisper"\s*:\s*"([^"]*)"', raw)
        tags_match = re.search(r'"tags"\s*:\s*\[(.*?)\]', raw)
        data = {
            "answer": answer_match.group(1) if answer_match else "答案正在浮上来...",
            "whisper": whisper_match.group(1) if whisper_match else "有些话，需要慢慢听。",
            "tags": [t.strip().strip('"') for t in tags_match.group(1).split(",")] if tags_match else ["深夜", "思考"],
        }

    return EchoResponse(
        answer=data.get("answer", ""),
        whisper=data.get("whisper", ""),
        tags=data.get("tags", []),
    )
