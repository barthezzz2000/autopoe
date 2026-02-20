from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any, ClassVar

from loguru import logger

from app.sandbox import VIRTUAL_ROOT, resolve_path
from app.tools import Tool

if TYPE_CHECKING:
    from app.agent import Agent


class EditTool(Tool):
    name = "edit"
    description = (
        "Replace a range of lines in a file with new content. "
        "Use the read tool first to get the exact line numbers. "
        "start_line and end_line are 1-indexed and inclusive. "
        "new_content replaces those lines exactly as given (include a trailing newline if needed). "
        "To insert without removing, set start_line and end_line to the same line number and "
        "provide new_content that includes that original line plus the inserted lines. "
        "To delete lines, set new_content to an empty string."
    )
    parameters: ClassVar[dict[str, Any]] = {
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": f"Relative path within the repository or absolute path starting with {VIRTUAL_ROOT}",
            },
            "start_line": {
                "type": "integer",
                "description": "First line to replace (1-indexed, inclusive).",
            },
            "end_line": {
                "type": "integer",
                "description": "Last line to replace (1-indexed, inclusive).",
            },
            "new_content": {
                "type": "string",
                "description": "Replacement text for the specified line range. Use an empty string to delete lines.",
            },
        },
        "required": ["path", "start_line", "end_line", "new_content"],
    }

    def execute(self, agent: Agent, args: dict[str, Any], **_kwargs: Any) -> str:
        try:
            real_path = resolve_path(agent, args["path"])
        except PermissionError as e:
            return json.dumps({"error": str(e)})

        if not real_path.is_file():
            return json.dumps({"error": f"File not found: {args['path']}"})

        try:
            start_line = int(args["start_line"])
            end_line = int(args["end_line"])
            new_content: str = args["new_content"]

            if start_line < 1:
                return json.dumps({"error": "start_line must be >= 1"})
            if end_line < start_line:
                return json.dumps({"error": "end_line must be >= start_line"})

            with open(real_path, encoding="utf-8") as f:
                lines = f.readlines()

            total_lines = len(lines)
            if start_line > total_lines + 1:
                return json.dumps(
                    {
                        "error": f"start_line {start_line} exceeds file length {total_lines}"
                    }
                )

            end_line = min(end_line, total_lines)

            replacement = []
            if new_content:
                replacement = new_content.splitlines(keepends=True)
                if replacement and not replacement[-1].endswith("\n"):
                    replacement[-1] += "\n"

            new_lines = lines[: start_line - 1] + replacement + lines[end_line:]

            with open(real_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)

            logger.debug(
                "Edited file: {} (lines {}-{} replaced with {} lines)",
                args["path"],
                start_line,
                end_line,
                len(replacement),
            )
            return json.dumps(
                {
                    "status": "edited",
                    "path": args["path"],
                    "replaced_lines": f"{start_line}-{end_line}",
                    "new_line_count": len(new_lines),
                }
            )
        except Exception as e:
            return json.dumps({"error": str(e)})
