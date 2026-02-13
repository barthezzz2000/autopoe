from __future__ import annotations

import fnmatch
import os
import shlex

from app.models import Permissions


def check_path_access(perms: Permissions, target_path: str) -> bool:
    normalized = os.path.normpath(os.path.abspath(target_path))

    for blocked in perms.blocked_paths:
        blocked_norm = os.path.normpath(os.path.abspath(blocked))
        if normalized == blocked_norm or normalized.startswith(blocked_norm + os.sep):
            return False

    for allowed in perms.allowed_paths:
        allowed_norm = os.path.normpath(os.path.abspath(allowed))
        if normalized == allowed_norm or normalized.startswith(allowed_norm + os.sep):
            return True

    return False


def check_write_access(perms: Permissions, target_path: str) -> bool:
    if not check_path_access(perms, target_path):
        return False

    normalized = os.path.normpath(os.path.abspath(target_path))
    for writable in perms.writable_paths:
        writable_norm = os.path.normpath(os.path.abspath(writable))
        if normalized == writable_norm or normalized.startswith(writable_norm + os.sep):
            return True

    return False


def check_command_access(perms: Permissions, command: str) -> bool:
    if not perms.allowed_commands:
        return False

    try:
        tokens = shlex.split(command)
    except ValueError:
        tokens = command.split()

    if not tokens:
        return False

    executable = tokens[0]
    for pattern in perms.allowed_commands:
        if fnmatch.fnmatch(executable, pattern):
            return True
        if fnmatch.fnmatch(command, pattern):
            return True

    return False
