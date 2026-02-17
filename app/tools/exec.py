from __future__ import annotations

import json
import subprocess
import threading
from collections.abc import Callable
from typing import TYPE_CHECKING, Any, ClassVar

from loguru import logger

from app.sandbox import VIRTUAL_ROOT, build_firejail_cmd
from app.tools import Tool

if TYPE_CHECKING:
    from app.agent import Agent


class ExecTool(Tool):
    name = "exec"
    description = "Execute a shell command in a sandboxed environment. Working directory is /project."
    parameters: ClassVar[dict[str, Any]] = {
        "type": "object",
        "properties": {
            "command": {
                "type": "string",
                "description": "Shell command to execute",
            },
            "timeout": {
                "type": "number",
                "description": "Timeout in seconds (default 30)",
            },
        },
        "required": ["command"],
    }

    def execute(self, agent: Agent, args: dict[str, Any], **kwargs: Any) -> str:
        on_output: Callable[[str], None] | None = kwargs.get("on_output")

        command = args["command"]
        timeout = args.get("timeout", 30)

        firejail_cmd = build_firejail_cmd(agent, command, timeout=timeout)

        logger.debug(
            "Executing command: {} (timeout={}s)",
            command,
            timeout,
        )

        try:
            proc = subprocess.Popen(
                firejail_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=VIRTUAL_ROOT,
            )

            stdout_lines: list[str] = []
            stderr_lines: list[str] = []

            def _read_stderr() -> None:
                assert proc.stderr is not None
                for line in proc.stderr:
                    stderr_lines.append(line)

            stderr_thread = threading.Thread(target=_read_stderr, daemon=True)
            stderr_thread.start()

            assert proc.stdout is not None
            for line in proc.stdout:
                stdout_lines.append(line)
                if on_output:
                    on_output(line)

            try:
                proc.wait(timeout=timeout)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait()
                logger.warning("Command timed out after {}s: {}", timeout, command)
                return json.dumps({"error": f"Command timed out after {timeout}s"})

            stderr_thread.join(timeout=5)

            stdout = "".join(stdout_lines)
            stderr = "".join(stderr_lines)
            logger.debug("Command exited with code {}", proc.returncode)
            return json.dumps(
                {
                    "returncode": proc.returncode,
                    "stdout": stdout[:5000],
                    "stderr": stderr[:2000],
                }
            )
        except FileNotFoundError:
            return self._fallback_exec(agent, command, timeout, on_output)
        except Exception as e:
            return json.dumps({"error": str(e)})

    def _fallback_exec(
        self,
        agent: Agent,
        command: str,
        timeout: int,
        on_output: Callable[[str], None] | None,
    ) -> str:
        cwd = agent.config.worktree_path
        if not cwd:
            return json.dumps({"error": "No working directory available"})

        logger.debug("firejail not found, falling back to direct execution")
        try:
            proc = subprocess.Popen(
                command,
                shell=True,
                cwd=cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )

            stdout_lines: list[str] = []
            stderr_lines: list[str] = []

            def _read_stderr() -> None:
                assert proc.stderr is not None
                for line in proc.stderr:
                    stderr_lines.append(line)

            stderr_thread = threading.Thread(target=_read_stderr, daemon=True)
            stderr_thread.start()

            assert proc.stdout is not None
            for line in proc.stdout:
                stdout_lines.append(line)
                if on_output:
                    on_output(line)

            try:
                proc.wait(timeout=timeout)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait()
                return json.dumps({"error": f"Command timed out after {timeout}s"})

            stderr_thread.join(timeout=5)

            stdout = "".join(stdout_lines)
            stderr = "".join(stderr_lines)
            return json.dumps(
                {
                    "returncode": proc.returncode,
                    "stdout": stdout[:5000],
                    "stderr": stderr[:2000],
                }
            )
        except Exception as e:
            return json.dumps({"error": str(e)})
