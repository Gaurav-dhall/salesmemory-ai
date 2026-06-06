# backend/test_main.py — Route tests for main.py

import json
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# ── conftest.py has already set dummy env vars and patched groq.Groq ────────
# main can now be imported safely.
from main import app

# ── Shared mock payloads ───────────────────────────────────────────────────

MOCK_STORE_RESPONSE = {"id": "mem-abc123", "status": "stored"}

MOCK_HINDSIGHT_MEMORIES = [
    {"content": "Deal: Acme Corp — LOST — budget freeze", "score": 0.91},
    {"content": "Deal: SwiftMove Logistics — WON — strong champion", "score": 0.87},
]

MOCK_GROQ_ANALYSIS = {
    "RISK_LEVEL": "HIGH",
    "WARNING_FLAGS": ["No CFO engagement yet", "Competitor Salesforce mentioned"],
    "PRE_CALL_BRIEF": "Push for CFO intro. Present ROI data early.",
    "RECOMMENDED_ACTION": "Schedule a CFO call within 5 business days.",
}

MOCK_GROQ_PATTERNS = {
    "patterns": [
        {
            "pattern_name": "No decision-maker engagement",
            "description": "Deals that never reached CFO/CEO lost 80% of the time.",
            "confidence_percentage": 80,
            "example_deal": "DEAL-001",
        },
        {
            "pattern_name": "ROI case built early",
            "description": "Deals with ROI calculator by call 2 closed faster.",
            "confidence_percentage": 90,
            "example_deal": "DEAL-002",
        },
    ]
}


def _make_groq_response(payload: dict):
    """Build a fake Groq ChatCompletion response."""
    choice = MagicMock()
    choice.message.content = json.dumps(payload)
    resp = MagicMock()
    resp.choices = [choice]
    return resp


# ── Sample request payloads ────────────────────────────────────────────────

DEAL_PAYLOAD = {
    "deal_id": "DEAL-TEST-001",
    "company": "TestCorp",
    "competitor_mentions": ["Salesforce"],
    "cfo_engaged": False,
    "call_number": 2,
    "sentiment": "neutral",
}

UPDATE_PAYLOAD = {
    "deal_id": "DEAL-TEST-001",
    "company": "TestCorp",
    "call_number": 3,
    "notes": "Discussed pricing. Stakeholder asked for a discount.",
    "competitors": ["HubSpot"],
    "sentiment": "concerned",
    "action_taken": "Offered 10% discount pending legal approval",
}


@pytest.fixture
def client():
    return TestClient(app)


# ── Tests ──────────────────────────────────────────────────────────────────


class TestLoadHistoricalData:
    """POST /api/load-historical-data"""

    def test_returns_200(self, client):
        with patch("main.store_memory", return_value=MOCK_STORE_RESPONSE):
            resp = client.post("/api/load-historical-data")
        assert resp.status_code == 200

    def test_response_has_status_success(self, client):
        with patch("main.store_memory", return_value=MOCK_STORE_RESPONSE):
            body = client.post("/api/load-historical-data").json()
        assert body["status"] == "success"

    def test_loaded_count_matches_data_folder(self, client):
        """6 JSON deal files exist in data/ — loaded should equal 6."""
        with patch("main.store_memory", return_value=MOCK_STORE_RESPONSE):
            body = client.post("/api/load-historical-data").json()
        assert body["loaded"] == 6

    def test_store_memory_called_once_per_file(self, client):
        with patch("main.store_memory", return_value=MOCK_STORE_RESPONSE) as mock_store:
            client.post("/api/load-historical-data")
        assert mock_store.call_count == 6


class TestAnalyzeDeal:
    """POST /api/analyze-deal"""

    def test_returns_200(self, client):
        with (
            patch("main.search_memory", return_value=MOCK_HINDSIGHT_MEMORIES),
            patch(
                "main.groq_client.chat.completions.create",
                return_value=_make_groq_response(MOCK_GROQ_ANALYSIS),
            ),
        ):
            resp = client.post("/api/analyze-deal", json=DEAL_PAYLOAD)
        assert resp.status_code == 200

    def test_response_contains_analysis_key(self, client):
        with (
            patch("main.search_memory", return_value=MOCK_HINDSIGHT_MEMORIES),
            patch(
                "main.groq_client.chat.completions.create",
                return_value=_make_groq_response(MOCK_GROQ_ANALYSIS),
            ),
        ):
            body = client.post("/api/analyze-deal", json=DEAL_PAYLOAD).json()
        assert "analysis" in body

    def test_analysis_has_all_expected_keys(self, client):
        with (
            patch("main.search_memory", return_value=MOCK_HINDSIGHT_MEMORIES),
            patch(
                "main.groq_client.chat.completions.create",
                return_value=_make_groq_response(MOCK_GROQ_ANALYSIS),
            ),
        ):
            analysis = client.post("/api/analyze-deal", json=DEAL_PAYLOAD).json()["analysis"]
        for key in ("RISK_LEVEL", "WARNING_FLAGS", "PRE_CALL_BRIEF", "RECOMMENDED_ACTION"):
            assert key in analysis

    def test_memories_used_matches_search_results(self, client):
        with (
            patch("main.search_memory", return_value=MOCK_HINDSIGHT_MEMORIES),
            patch(
                "main.groq_client.chat.completions.create",
                return_value=_make_groq_response(MOCK_GROQ_ANALYSIS),
            ),
        ):
            body = client.post("/api/analyze-deal", json=DEAL_PAYLOAD).json()
        assert body["memories_used"] == len(MOCK_HINDSIGHT_MEMORIES)

    def test_empty_payload_does_not_crash(self, client):
        """Route should handle missing optional fields gracefully."""
        with (
            patch("main.search_memory", return_value=[]),
            patch(
                "main.groq_client.chat.completions.create",
                return_value=_make_groq_response(MOCK_GROQ_ANALYSIS),
            ),
        ):
            resp = client.post("/api/analyze-deal", json={})
        assert resp.status_code == 200

    def test_search_memory_is_called(self, client):
        with (
            patch("main.search_memory", return_value=MOCK_HINDSIGHT_MEMORIES) as mock_search,
            patch(
                "main.groq_client.chat.completions.create",
                return_value=_make_groq_response(MOCK_GROQ_ANALYSIS),
            ),
        ):
            client.post("/api/analyze-deal", json=DEAL_PAYLOAD)
        mock_search.assert_called_once()


class TestUpdateDealMemory:
    """POST /api/update-deal-memory"""

    def test_returns_200(self, client):
        with patch("main.store_memory", return_value=MOCK_STORE_RESPONSE):
            resp = client.post("/api/update-deal-memory", json=UPDATE_PAYLOAD)
        assert resp.status_code == 200

    def test_status_message(self, client):
        with patch("main.store_memory", return_value=MOCK_STORE_RESPONSE):
            body = client.post("/api/update-deal-memory", json=UPDATE_PAYLOAD).json()
        assert body["status"] == "Memory updated"

    def test_result_key_contains_store_response(self, client):
        with patch("main.store_memory", return_value=MOCK_STORE_RESPONSE):
            body = client.post("/api/update-deal-memory", json=UPDATE_PAYLOAD).json()
        assert body["result"] == MOCK_STORE_RESPONSE

    def test_store_memory_called_once(self, client):
        with patch("main.store_memory", return_value=MOCK_STORE_RESPONSE) as mock_store:
            client.post("/api/update-deal-memory", json=UPDATE_PAYLOAD)
        mock_store.assert_called_once()


class TestPatternInsights:
    """GET /api/pattern-insights"""

    def test_returns_200(self, client):
        with (
            patch("main.search_memory", return_value=MOCK_HINDSIGHT_MEMORIES),
            patch(
                "main.groq_client.chat.completions.create",
                return_value=_make_groq_response(MOCK_GROQ_PATTERNS),
            ),
        ):
            resp = client.get("/api/pattern-insights")
        assert resp.status_code == 200

    def test_response_contains_patterns_list(self, client):
        with (
            patch("main.search_memory", return_value=MOCK_HINDSIGHT_MEMORIES),
            patch(
                "main.groq_client.chat.completions.create",
                return_value=_make_groq_response(MOCK_GROQ_PATTERNS),
            ),
        ):
            body = client.get("/api/pattern-insights").json()
        assert "patterns" in body
        assert isinstance(body["patterns"], list)
        assert len(body["patterns"]) == 2

    def test_each_pattern_has_required_fields(self, client):
        with (
            patch("main.search_memory", return_value=MOCK_HINDSIGHT_MEMORIES),
            patch(
                "main.groq_client.chat.completions.create",
                return_value=_make_groq_response(MOCK_GROQ_PATTERNS),
            ),
        ):
            patterns = client.get("/api/pattern-insights").json()["patterns"]
        for p in patterns:
            assert "pattern_name" in p
            assert "description" in p
            assert "confidence_percentage" in p
            assert "example_deal" in p

    def test_search_memory_called_with_patterns_query(self, client):
        with (
            patch("main.search_memory", return_value=MOCK_HINDSIGHT_MEMORIES) as mock_search,
            patch(
                "main.groq_client.chat.completions.create",
                return_value=_make_groq_response(MOCK_GROQ_PATTERNS),
            ),
        ):
            client.get("/api/pattern-insights")
        call_args = mock_search.call_args[0][0]
        assert "lost" in call_args.lower() or "won" in call_args.lower()
