from __future__ import annotations

from app.models import AgentConfig, Role
from app.prompts.steward import STEWARD_PROMPT
from app.prompts.supervisor import SUPERVISOR_PROMPT
from app.prompts.worker import WORKER_PROMPT

_ROLE_PROMPTS = {
    Role.STEWARD: STEWARD_PROMPT,
    Role.SUPERVISOR: SUPERVISOR_PROMPT,
    Role.WORKER: WORKER_PROMPT,
}


def get_system_prompt(config: AgentConfig) -> str:
    base = _ROLE_PROMPTS[config.role]
    parts = [base.strip()]

    parts.append(f"\nYour working directory is {config.virtual_root}")

    if config.supervisor_id:
        parts.append(f"Supervisor ID: {config.supervisor_id}")

    if config.network_access:
        parts.append("Network access: enabled")
    else:
        parts.append("Network access: disabled")

    return "\n".join(parts)
