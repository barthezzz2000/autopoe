from __future__ import annotations

from typing import TYPE_CHECKING, Any, ClassVar

from app.tools import Tool

if TYPE_CHECKING:
    from app.agent import Agent


class ListAgentsTool(Tool):
    name = "list_agents"
    description = (
        "List all agents in the system with their hierarchy, state, and todo progress."
    )
    parameters: ClassVar[dict[str, Any]] = {
        "type": "object",
        "properties": {},
    }

    def execute(self, agent: Agent, args: dict[str, Any], **_kwargs: Any) -> str:
        from app.registry import registry

        all_agents = registry.get_all()
        agent_map: dict[str, Agent] = {a.uuid: a for a in all_agents}

        roots = [a for a in all_agents if a.config.supervisor_id is None]

        lines: list[str] = []
        for root in roots:
            self._render(root, agent_map, lines, indent=0)

        return "\n".join(lines) if lines else "(no agents)"

    def _render(
        self,
        agent: Agent,
        agent_map: dict[str, Any],
        lines: list[str],
        indent: int,
    ) -> None:
        prefix = "  " * indent
        name_part = f" ({agent.config.name})" if agent.config.name else ""
        todo_done = sum(1 for t in agent.todos if t.done)
        todo_total = len(agent.todos)
        todo_part = f" [{todo_done}/{todo_total}]" if todo_total > 0 else ""
        lines.append(
            f"{prefix}- {agent.uuid[:8]} [{agent.config.role.value}] {agent.state.value}{name_part}{todo_part}",
        )
        for child_id in agent.children_ids:
            child = agent_map.get(child_id)
            if child:
                self._render(child, agent_map, lines, indent + 1)
