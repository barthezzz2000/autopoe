from __future__ import annotations

import sys
from pathlib import Path
from typing import TYPE_CHECKING

from loguru import logger

if TYPE_CHECKING:
    from loguru import Record

from app.config import Config


def _stderr_format(record: Record) -> str:
    agent_id = record["extra"].get("agent_id", "")
    role = record["extra"].get("role", "")
    agent_part = f" | agent:{agent_id} | {role}" if agent_id else ""
    return (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan>"
        f"{agent_part}"
        " | <level>{message}</level>\n{exception}"
    )


def setup_logging(config: Config | None = None) -> None:
    if config is None:
        config = Config()

    level = "DEBUG" if config.DEBUG else config.LOG_LEVEL.upper()

    logger.remove()

    logger.add(
        sys.stderr,
        format=_stderr_format,
        level=level,
        colorize=True,
        backtrace=True,
        diagnose=config.DEBUG,
    )

    log_dir = Path(config.LOG_DIR)
    log_dir.mkdir(parents=True, exist_ok=True)

    logger.add(
        str(log_dir / "synode.log"),
        format="{message}",
        level=level,
        rotation="10 MB",
        retention=5,
        compression="gz",
        serialize=True,
    )
