from __future__ import annotations

from dataclasses import dataclass

from app.models.base import Serializable


@dataclass
class TodoItem(Serializable):
    id: int
    text: str
    done: bool = False
