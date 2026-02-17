from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models import Message
from app.registry import registry

router = APIRouter()


class AgentMessageRequest(BaseModel):
    message: str


@router.post("/api/agents/{agent_id}/message")
async def send_agent_message(agent_id: str, req: AgentMessageRequest) -> dict:
    agent = registry.get(agent_id)
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")

    msg = Message(from_id="human", to_id=agent_id, content=req.message)
    agent.enqueue_message(msg)
    return {"status": "sent"}


@router.get("/api/agents")
async def list_agents() -> dict:
    agents = registry.get_all()
    return {
        "agents": [
            {
                "id": a.uuid,
                "role": a.config.role.value,
                "state": a.state.value,
                "children": a.children_ids,
                "name": a.config.name,
                "todos": [t.serialize() for t in a.todos],
            }
            for a in agents
        ],
    }


@router.get("/api/agents/{agent_id}")
async def get_agent(agent_id: str) -> dict:
    agent = registry.get(agent_id)
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")

    children = [
        {
            "id": c.uuid,
            "role": c.config.role.value,
            "state": c.state.value,
            "name": c.config.name,
            "todos": [t.serialize() for t in c.todos],
        }
        for c in registry.get_children(agent_id)
    ]

    return {
        "id": agent.uuid,
        "role": agent.config.role.value,
        "state": agent.state.value,
        "name": agent.config.name,
        "children": children,
        "supervisor_id": agent.config.supervisor_id,
        "todos": [t.serialize() for t in agent.todos],
        "history": [entry.serialize() for entry in agent.history],
    }


@router.post("/api/agents/{agent_id}/terminate")
async def terminate_agent(agent_id: str) -> dict:
    agent = registry.get(agent_id)
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent.request_termination("user_requested")
    return {"status": "terminating"}
