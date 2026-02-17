from __future__ import annotations

import threading
from collections.abc import Callable
from typing import Any

from loguru import logger

from app.models import LLMResponse, ModelInfo
from app.providers import LLMProvider


class ProviderGateway:
    def __init__(self) -> None:
        self._cache: dict[tuple[str, ...], LLMProvider] = {}
        self._lock = threading.Lock()

    def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        on_chunk: Callable[[str, str], None] | None = None,
    ) -> LLMResponse:
        provider = self._resolve()
        return provider.chat(messages, tools, on_chunk)

    def list_models_for(self, provider_name: str) -> list[ModelInfo]:
        from app.providers.registry import ProviderType, create_provider
        from app.settings import find_provider, get_settings

        settings = get_settings()
        cfg = find_provider(settings.model, provider_name)
        if cfg is None:
            return []

        provider = create_provider(
            provider_name=cfg.name,
            provider_type=ProviderType(cfg.provider_type),
            api_base_url=cfg.api_base_url,
            api_key=cfg.api_key,
        )
        return provider.list_models()

    def _resolve(self) -> LLMProvider:
        from app.providers.registry import ProviderType, create_provider
        from app.settings import find_provider, get_settings

        settings = get_settings()
        ms = settings.model
        cfg = find_provider(ms, ms.active_provider)

        if cfg:
            provider_name = cfg.name
            provider_type = ProviderType(cfg.provider_type)
            api_base_url = cfg.api_base_url
            api_key = cfg.api_key
            model = ms.active_model
        else:
            provider_name = "OpenRouter"
            provider_type = ProviderType.OPENAI
            api_base_url = "https://openrouter.ai/api/v1"
            api_key = ""
            model = ms.active_model

        key = (provider_name, provider_type.value, api_base_url, model)

        with self._lock:
            if key in self._cache:
                return self._cache[key]

            logger.debug(
                "ProviderGateway resolved: provider={}, type={}, model={}, base_url={}",
                provider_name,
                provider_type,
                model,
                api_base_url,
            )

            provider = create_provider(
                provider_name=provider_name,
                provider_type=provider_type,
                api_base_url=api_base_url,
                api_key=api_key,
                model=model,
            )

            self._cache[key] = provider
            return provider


gateway = ProviderGateway()
