"""Backward-compatible ASGI entrypoint.

The application composition lives in :mod:`app.app`; this module remains so
existing ``uvicorn app.main:app`` commands continue to work.
"""

from .app import app

__all__ = ["app"]
