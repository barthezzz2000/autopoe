from __future__ import annotations

from fastapi import APIRouter
from starlette.websockets import WebSocket, WebSocketDisconnect

from app.events import event_bus

router = APIRouter()


@router.websocket("/ws/events")
async def ws_events(ws: WebSocket) -> None:
    await event_bus.connect_display(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        event_bus.disconnect_display(ws)


@router.websocket("/ws/updates")
async def ws_updates(ws: WebSocket) -> None:
    await event_bus.connect_updates(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        event_bus.disconnect_updates(ws)
