import asyncio
from typing import AsyncIterator

import httpx

from app.config import get_settings, Settings

# ── Module-level singleton ──
_llm_client: "LLMClient | None" = None


def get_llm_client() -> "LLMClient":
    """Return the process-wide LLMClient singleton. Created on first call."""
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
    return _llm_client


async def close_llm_client():
    """Gracefully close the singleton LLMClient (called on shutdown)."""
    global _llm_client
    if _llm_client is not None:
        await _llm_client.close()
        _llm_client = None


class LLMClient:
    """OpenAI-compatible async chat client — use `get_llm_client()` to get the singleton."""

    def __init__(self, settings: Settings | None = None):
        self._settings = settings or get_settings()
        self._client = httpx.AsyncClient(
            base_url=self._settings.llm_base_url,
            headers={
                "Authorization": f"Bearer {self._settings.llm_api_key}",
                "Content-Type": "application/json",
            },
            timeout=httpx.Timeout(10.0, read=90.0),  # 10s connect, 90s read for streaming
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
        )

    @property
    def model(self) -> str:
        return self._settings.llm_model

    async def chat(
        self,
        messages: list[dict],
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> str:
        """Non-streaming chat completion."""
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature if temperature is not None else self._settings.llm_temperature,
            "max_tokens": max_tokens or self._settings.llm_max_tokens,
        }

        for attempt in range(3):
            try:
                resp = await self._client.post("/chat/completions", json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            except (httpx.TimeoutException, httpx.HTTPStatusError) as e:
                if attempt == 2:
                    raise
                await asyncio.sleep(1.5 ** attempt)

        raise RuntimeError("LLM request failed after retries")

    async def chat_stream(
        self,
        messages: list[dict],
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[str]:
        """Streaming chat completion with 1 retry on transient errors."""
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature if temperature is not None else self._settings.llm_temperature,
            "max_tokens": max_tokens or self._settings.llm_max_tokens,
            "stream": True,
        }

        last_exc: Exception | None = None
        for attempt in range(2):
            try:
                async with self._client.stream(
                    "POST", "/chat/completions", json=payload
                ) as resp:
                    resp.raise_for_status()
                    async for line in resp.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:].strip()
                            if data == "[DONE]":
                                return  # success — stop generator
                            try:
                                import json as _json
                                chunk = _json.loads(data)
                                delta = chunk.get("choices", [{}])[0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                            except (_json.JSONDecodeError, KeyError, IndexError):
                                continue
                    return  # stream completed normally
            except (httpx.TimeoutException, httpx.HTTPStatusError, httpx.ConnectError) as e:
                last_exc = e
                if attempt == 0:
                    await asyncio.sleep(1.0)  # brief backoff before retry
                continue

        raise last_exc or RuntimeError("Stream failed after retry")

    async def close(self):
        await self._client.aclose()
