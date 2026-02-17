from __future__ import annotations

import os
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.agent import Agent

VIRTUAL_ROOT = "/project"


def resolve_path(agent: Agent, logical_path: str) -> str:
    normalized = os.path.normpath(logical_path)
    if not normalized.startswith(VIRTUAL_ROOT):
        raise PermissionError(f"Access denied: {logical_path}")
    relative = os.path.relpath(normalized, VIRTUAL_ROOT)
    real_path = os.path.normpath(os.path.join(agent.config.worktree_path, relative))
    if not real_path.startswith(os.path.normpath(agent.config.worktree_path)):
        raise PermissionError(f"Path traversal denied: {logical_path}")
    return real_path


def _find_git_dir(worktree_path: str) -> str | None:
    git_path = os.path.join(worktree_path, ".git")
    if os.path.isdir(git_path):
        return git_path
    if os.path.isfile(git_path):
        with open(git_path) as f:
            content = f.read().strip()
        if content.startswith("gitdir: "):
            return os.path.normpath(
                os.path.join(worktree_path, content[len("gitdir: ") :])
            )
    return None


def build_firejail_cmd(
    agent: Agent,
    command: str,
    timeout: int = 30,
) -> list[str]:
    worktree = agent.config.worktree_path
    virtual_root = agent.config.virtual_root
    git_dir = _find_git_dir(worktree)

    cmd = [
        "firejail",
        "--noprofile",
        "--quiet",
        "--seccomp",
        f"--bind={worktree},{virtual_root}",
        "--read-only=/",
        f"--read-write={virtual_root}",
        "--read-write=/tmp",
    ]

    if git_dir:
        cmd.append(f"--bind={git_dir},{git_dir}")

    if not agent.config.network_access:
        cmd.append("--net=none")

    cmd.extend([f"--timeout={timeout}", "bash", "-c", command])
    return cmd
