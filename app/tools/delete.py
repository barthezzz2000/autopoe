from __future__ import annotations

import json
import os
import shutil
from pathlib import Path
from typing import TYPE_CHECKING, Any, ClassVar

from app.sandbox import VIRTUAL_ROOT, resolve_path
from app.tools import Tool

if TYPE_CHECKING:
    from app.agent import Agent


class DeleteTool(Tool):
    name = "delete"
    description = "Delete a file, symlink, or directory."
    parameters: ClassVar[dict[str, Any]] = {
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": f"Relative path within the repository or absolute path starting with {VIRTUAL_ROOT}",
            },
            "recursive": {
                "type": "boolean",
                "description": "Delete directory and all its contents recursively. Required for non-empty directories.",
                "default": False,
            },
        },
        "required": ["path"],
    }

    def execute(self, agent: Agent, args: dict[str, Any], **_kwargs: Any) -> str:
        try:
            real_path = resolve_path(agent, Path(args["path"]))
        except PermissionError as e:
            return json.dumps({"error": str(e)})

        recursive = args.get("recursive", False)

        try:
            if real_path.is_file() or real_path.is_symlink():
                os.unlink(real_path)
                return json.dumps({"status": "deleted", "path": args["path"]})
            elif real_path.is_dir() and recursive:
                shutil.rmtree(real_path)
                return json.dumps({"status": "deleted", "path": args["path"]})
            elif real_path.is_dir() and not recursive:
                os.rmdir(real_path)
                return json.dumps({"status": "deleted", "path": args["path"]})
            else:
                return json.dumps({"error": "Not found", "path": args["path"]})
        except OSError as e:
            if real_path.is_dir() and not recursive:
                return json.dumps(
                    {
                        "error": str(e),
                        "hint": "Directory may not be empty. Use recursive=true to delete non-empty directories.",
                    }
                )
            return json.dumps({"error": str(e)})
