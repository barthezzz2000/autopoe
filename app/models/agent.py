from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class Role(StrEnum):
    STEWARD = "steward"
    SUPERVISOR = "supervisor"
    WORKER = "worker"


class AgentState(StrEnum):
    INITIALIZING = "initializing"
    IDLE = "idle"
    RUNNING = "running"
    ERROR = "error"
    TERMINATED = "terminated"


@dataclass
class AgentConfig:
    role: Role
    repo_path: str = ""
    worktree_path: str = ""
    virtual_root: str = "/project"
    supervisor_id: str | None = None
    name: str | None = None
    network_access: bool = False
