from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any


class EventType(StrEnum):
    AGENT_CREATED = "agent_created"
    AGENT_STATE_CHANGED = "agent_state_changed"
    AGENT_MESSAGE = "agent_message"
    AGENT_TERMINATED = "agent_terminated"
    TOOL_CALLED = "tool_called"
    HISTORY_ENTRY_ADDED = "history_entry_added"
    HISTORY_ENTRY_DELTA = "history_entry_delta"


DISPLAY_EVENTS: set[EventType] = {
    EventType.AGENT_CREATED,
    EventType.AGENT_STATE_CHANGED,
    EventType.AGENT_MESSAGE,
    EventType.AGENT_TERMINATED,
    EventType.TOOL_CALLED,
}


@dataclass
class Event:
    type: EventType
    agent_id: str
    data: dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)
