from __future__ import annotations

from dataclasses import asdict

from fastapi import APIRouter, HTTPException
from loguru import logger
from pydantic import BaseModel

from app.settings import (
    EventLogSettings,
    ModelSettings,
    ProviderConfig,
    get_all_providers,
    get_settings,
    save_settings,
)

router = APIRouter()


@router.get("/api/settings")
async def get_settings_api() -> dict:
    settings = get_settings()
    result = asdict(settings)
    all_providers = get_all_providers(settings.model)
    result["model"]["all_providers"] = [asdict(p) for p in all_providers]
    return result


class UpdateSettingsRequest(BaseModel):
    event_log: dict | None = None
    model: dict | None = None


@router.post("/api/settings")
async def update_settings(req: UpdateSettingsRequest) -> dict:
    current = get_settings()

    if req.event_log is not None:
        current.event_log = EventLogSettings(**req.event_log)
    if req.model is not None:
        providers_raw = req.model.pop("providers", [])
        providers = [
            ProviderConfig(**p) if isinstance(p, dict) else p for p in providers_raw
        ]
        current.model = ModelSettings(
            active_provider=req.model.get(
                "active_provider",
                current.model.active_provider,
            ),
            active_model=req.model.get("active_model", current.model.active_model),
            providers=providers,
        )

    save_settings(current)
    logger.info("Settings updated")
    result = asdict(current)
    all_providers = get_all_providers(current.model)
    result["model"]["all_providers"] = [asdict(p) for p in all_providers]
    return {"status": "saved", "settings": result}


class ListModelsRequest(BaseModel):
    provider_name: str


@router.post("/api/providers/models")
async def list_provider_models(req: ListModelsRequest) -> dict:
    from app.providers.gateway import gateway

    try:
        models = gateway.list_models_for(req.provider_name)
        return {"models": [{"id": m.id} for m in models]}
    except Exception as e:
        logger.error(
            "Failed to list models for provider '{}': {}",
            req.provider_name,
            e,
        )
        raise HTTPException(status_code=500, detail=str(e)) from e
