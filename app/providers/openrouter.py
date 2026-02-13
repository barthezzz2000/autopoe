from __future__ import annotations

import json
import time
from collections.abc import Callable
from typing import Any

import httpx
from loguru import logger

from app.models import LLMResponse, ToolCall
from app.providers import LLMProvider
from app.settings import Settings


class OpenRouterProvider(LLMProvider):
    BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or Settings()
        self._client = httpx.Client(timeout=120.0)

    def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        on_chunk: Callable[[str, str], None] | None = None,
    ) -> LLMResponse:
        payload: dict[str, Any] = {
            "model": self._settings.MODEL,
            "messages": messages,
            "stream": True,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        headers = {
            "Authorization": f"Bearer {self._settings.API_KEY}",
            "Content-Type": "application/json",
        }

        t0 = time.perf_counter()

        content_parts: list[str] = []
        thinking_parts: list[str] = []
        tool_calls_accum: dict[int, dict[str, Any]] = {}

        with self._client.stream(
            "POST", self.BASE_URL, headers=headers, content=json.dumps(payload)
        ) as response:
            if response.status_code != 200:
                body = response.read().decode()
                elapsed = time.perf_counter() - t0
                logger.error(
                    "OpenRouter API error: {} - {} ({:.2f}s)",
                    response.status_code,
                    body[:200],
                    elapsed,
                )
                raise RuntimeError(
                    f"OpenRouter API error: {response.status_code} - {body}"
                )

            for line in response.iter_lines():
                if not line or line.startswith(":"):
                    continue
                if not line.startswith("data: "):
                    continue
                data_str = line[6:]
                if data_str.strip() == "[DONE]":
                    break

                try:
                    chunk = json.loads(data_str)
                except json.JSONDecodeError:
                    continue

                choices = chunk.get("choices")
                if not choices:
                    continue
                delta = choices[0].get("delta", {})

                if delta.get("content"):
                    text = delta["content"]
                    content_parts.append(text)
                    if on_chunk:
                        on_chunk("content", text)

                reasoning = delta.get("reasoning_content") or delta.get("reasoning")
                if reasoning:
                    thinking_parts.append(reasoning)
                    if on_chunk:
                        on_chunk("thinking", reasoning)

                if delta.get("tool_calls"):
                    for tc_delta in delta["tool_calls"]:
                        idx = tc_delta["index"]
                        if idx not in tool_calls_accum:
                            tool_calls_accum[idx] = {
                                "id": "",
                                "name": "",
                                "arguments": "",
                            }
                        acc = tool_calls_accum[idx]
                        if tc_delta.get("id"):
                            acc["id"] = tc_delta["id"]
                        fn = tc_delta.get("function", {})
                        if fn.get("name"):
                            acc["name"] = fn["name"]
                        if fn.get("arguments"):
                            acc["arguments"] += fn["arguments"]

        elapsed = time.perf_counter() - t0
        logger.debug(
            "OpenRouter stream completed ({:.2f}s, model={})",
            elapsed,
            self._settings.MODEL,
        )

        content = "".join(content_parts) or None
        thinking = "".join(thinking_parts) or None

        if tool_calls_accum:
            tool_calls = [
                ToolCall(
                    id=acc["id"],
                    name=acc["name"],
                    arguments=json.loads(acc["arguments"]),
                )
                for _, acc in sorted(tool_calls_accum.items())
            ]
            return LLMResponse(content=content, tool_calls=tool_calls, thinking=thinking)

        return LLMResponse(content=content or "", thinking=thinking)
