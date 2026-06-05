# backend/conftest.py
"""
Patch groq.Groq at the very start of the test session so that main.py can be
imported without a real GROQ_API_KEY environment variable.
"""
import os
from unittest.mock import MagicMock, patch

import pytest


# ── Set a dummy env var so Groq.__init__ is satisfied ──────────────────────
os.environ.setdefault("GROQ_API_KEY", "test-dummy-key")
os.environ.setdefault("HINDSIGHT_API_KEY", "test-dummy-hindsight-key")


# ── Patch Groq client at import time ───────────────────────────────────────
# We patch the class constructor so the real HTTP client is never created.
_groq_patcher = patch("groq.Groq", return_value=MagicMock())
_groq_patcher.start()
