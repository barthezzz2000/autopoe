from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any, ClassVar

from loguru import logger

from app.events import event_bus
from app.models import Event, EventType, Message
from app.tools import Tool

if TYPE_CHECKING:
    from app.agent import Agent


class SendTool(Tool):
    name = "send"
    description = "Send a message to another agent by UUID or name."
    parameters: ClassVar[dict[str, Any]] = {
        "type": "object",
        "properties": {
            "to": {
                "type": "string",
                "description": "Target agent UUID or name",
            },
            "content": {"type": "string", "description": "Message content"},
        },
        "required": ["to", "content"],
    }

    def execute(self, agent: Agent, args: dict[str, Any], **_kwargs: Any) -> str:
        from app.registry import registry

        target_ref = args["to"]
        content = args["content"]

        if target_ref == "human":
            logger.debug(
                "Message sent: {} -> human ({} chars)",
                agent.uuid[:8],
                len(content),
            )
            event_bus.emit(
                Event(
                    type=EventType.AGENT_MESSAGE,
                    agent_id=agent.uuid,
                    data={"to_id": "human", "content": content},
                ),
            )
            return json.dumps({"status": "sent"})

        target = registry.get(target_ref)
        if target is None:
            target = registry.find_by_name(target_ref)
        if target is None:
            return json.dumps({"error": f"Agent '{target_ref}' not found"})

        msg = Message(from_id=agent.uuid, to_id=target.uuid, content=content)
        target.enqueue_message(msg)

        logger.debug(
            "Message sent: {} -> {} ({} chars)",
            agent.uuid[:8],
            target.uuid[:8],
            len(content),
        )

        event_bus.emit(
            Event(
                type=EventType.AGENT_MESSAGE,
                agent_id=agent.uuid,
                data={"to_id": target.uuid, "content": content},
            ),
        )
        return json.dumps({"status": "sent"})
