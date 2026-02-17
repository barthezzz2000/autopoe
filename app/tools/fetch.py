from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any, ClassVar

import httpx
from loguru import logger

from app.tools import Tool

if TYPE_CHECKING:
    from app.agent import Agent


class FetchTool(Tool):
    name = "fetch"
    description = "Make an HTTP request."
    parameters: ClassVar[dict[str, Any]] = {
        "type": "object",
        "properties": {
            "method": {
                "type": "string",
                "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"],
                "description": "HTTP method",
            },
            "url": {"type": "string", "description": "Request URL"},
            "headers": {
                "type": "object",
                "description": "Request headers (optional)",
            },
            "body": {"type": "string", "description": "Request body (optional)"},
        },
        "required": ["method", "url"],
    }

    def execute(self, agent: Agent, args: dict[str, Any], **_kwargs: Any) -> str:
        method = args["method"]
        url = args["url"]
        logger.debug("HTTP {} {}", method, url)
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.request(
                    method=method,
                    url=url,
                    headers=args.get("headers"),
                    content=args.get("body"),
                )
            logger.debug("HTTP {} {} -> {}", method, url, response.status_code)
            return json.dumps(
                {
                    "status_code": response.status_code,
                    "body": response.text[:5000],
                }
            )
        except Exception as e:
            logger.warning("HTTP request failed: {} {} - {}", method, url, e)
            return json.dumps({"error": str(e)})
