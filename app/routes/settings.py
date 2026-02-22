from __future__ import annotations

from dataclasses import asdict

from fastapi import APIRouter
from loguru import logger
from pydantic import BaseModel

from app.settings import EventLogSettings, ModelSettings, get_settings, save_settings

router = APIRouter()


@router.get("/api/settings")
async def get_settings_api() -> dict[str, object]:
    settings = get_settings()
    return asdict(settings)


class UpdateSettingsRequest(BaseModel):
    event_log: dict[str, object] | None = None
    model: dict[str, object] | None = None


@router.post("/api/settings")
async def update_settings(req: UpdateSettingsRequest) -> dict[str, object]:
    from app.providers.gateway import gateway

    current = get_settings()

    if req.event_log is not None:
        timestamp_format = req.event_log.get("timestamp_format")
        if isinstance(timestamp_format, str):
            current.event_log = EventLogSettings(timestamp_format=timestamp_format)

    if req.model is not None:
        active_provider_id = req.model.get(
            "active_provider_id", current.model.active_provider_id
        )
        active_model = req.model.get("active_model", current.model.active_model)
        current.model = ModelSettings(
            active_provider_id=active_provider_id
            if isinstance(active_provider_id, str)
            else current.model.active_provider_id,
            active_model=active_model
            if isinstance(active_model, str)
            else current.model.active_model,
        )

    save_settings(current)
    gateway.invalidate_cache()
    logger.info("Settings updated")
    return {"status": "saved", "settings": asdict(current)}
