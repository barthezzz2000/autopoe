from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class ModelInfo:
    id: str


@dataclass
class ToolCallResult:
    id: str
    name: str
    arguments: dict[str, Any]


@dataclass
class LLMResponse:
    content: str | None = None
    tool_calls: list[ToolCallResult] | None = None
    thinking: str | None = None
