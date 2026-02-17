from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any, ClassVar

from loguru import logger

from app.tools import Tool

if TYPE_CHECKING:
    from app.agent import Agent


class ExitTool(Tool):
    name = "exit"
    description = "Terminate this agent. Use after completing all work."
    parameters: ClassVar[dict[str, Any]] = {
        "type": "object",
        "properties": {
            "reason": {"type": "string", "description": "Reason for exiting"},
        },
    }

    def execute(self, agent: Agent, args: dict[str, Any], **_kwargs: Any) -> str:
        reason = args.get("reason", "Task completed")
        logger.info("Agent {} exiting: {}", agent.uuid[:8], reason)
        agent.request_termination(reason)
        return json.dumps({"status": "terminating", "reason": reason})
