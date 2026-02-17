from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any, ClassVar

from app.tools import Tool

if TYPE_CHECKING:
    from app.agent import Agent


class IdleTool(Tool):
    name = "idle"
    description = "Enter idle state and wait for incoming messages. The agent sleeps until a message arrives or it is terminated."
    parameters: ClassVar[dict[str, Any]] = {
        "type": "object",
        "properties": {},
    }

    def execute(self, agent: Agent, args: dict[str, Any], **_kwargs: Any) -> str:
        from app.models import AgentState

        agent.set_state(AgentState.IDLE)
        messages: list[dict[str, str]] = []

        while not agent._terminate.is_set():
            msg = agent.try_get_message(timeout=2.0)
            if msg:
                messages.append(
                    {
                        "from_id": msg.from_id,
                        "content": msg.content,
                    }
                )
                break

        while True:
            msg = agent.try_get_message(timeout=0)
            if msg is None:
                break
            messages.append(
                {
                    "from_id": msg.from_id,
                    "content": msg.content,
                }
            )

        agent.set_state(AgentState.RUNNING)
        if not messages:
            return json.dumps({"messages": [], "note": "Terminated while idle"})
        return json.dumps({"messages": messages})
