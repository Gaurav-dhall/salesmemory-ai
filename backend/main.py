# backend/main.py

import json
import logging
import os
import sys
import uuid
from datetime import date

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq

# ── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("salesmemory")

# ── Config ─────────────────────────────────────────────────────────────────
load_dotenv()
app = FastAPI(title="SalesMemory AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://salesmemory-ai.vercel.app",
        "http://localhost:5173" ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

HINDSIGHT_KEY = os.getenv("HINDSIGHT_API_KEY")
HINDSIGHT_BANK_ID = os.getenv("HINDSIGHT_BANK_ID", "default")

# ── Correct Hindsight Cloud base URL ──────────────────────────────────────
# Cloud dashboard: https://ui.hindsight.vectorize.io
# Cloud API base:  https://api.hindsight.vectorize.io
# All endpoints follow the pattern:
#   /v1/default/banks/{bank_id}/memories/retain   (POST — store memory)
#   /v1/default/banks/{bank_id}/memories/recall   (POST — search memory)
HINDSIGHT_BASE_URL = os.getenv("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io")

# Startup validation
if not HINDSIGHT_KEY:
    logger.error("❌ HINDSIGHT_API_KEY is not set! Memory operations will fail.")
else:
    logger.info(f"✅ Hindsight API key loaded (prefix: {HINDSIGHT_KEY[:10]}...)")
    logger.info(f"✅ Hindsight bank ID: {HINDSIGHT_BANK_ID}")
    logger.info(f"✅ Hindsight base URL: {HINDSIGHT_BASE_URL}")

if not os.getenv("GROQ_API_KEY"):
    logger.error("❌ GROQ_API_KEY is not set!")


# ━━━ HINDSIGHT HELPER FUNCTIONS ━━━

def _hindsight_headers() -> dict:
    """Build correct auth headers for Hindsight API."""
    return {
        "Authorization": f"Bearer {HINDSIGHT_KEY}",
        "Content-Type": "application/json",
    }


def store_memory(content: str, metadata: dict) -> dict:
    """
    Store a memory in Hindsight using the correct /memories endpoint.

    Correct endpoint: POST /v1/default/banks/{bank_id}/memories
    Payload schema:   {"items": [{"content": "...", "metadata": {...}}]}

    The old code incorrectly used /memories/retain — that path does NOT exist,
    which is why every request returned 405 Method Not Allowed.
    """
    endpoint = f"{HINDSIGHT_BASE_URL}/v1/default/banks/{HINDSIGHT_BANK_ID}/memories"
    payload = {
        "items": [
            {
                "content": content,
                "metadata": {str(k): str(v) for k, v in metadata.items()},
            }
        ],
    }

    logger.debug("📤 Hindsight RETAIN request:")
    logger.debug(f"   URL     : {endpoint}")
    logger.debug(f"   Payload : {json.dumps(payload, indent=2)}")

    try:
        response = requests.post(
            endpoint,
            headers=_hindsight_headers(),
            json=payload,
            timeout=30,
        )

        logger.debug(f"📥 Hindsight RETAIN response:")
        logger.debug(f"   Status  : {response.status_code}")
        logger.debug(f"   Body    : {response.text[:500]}")  # Truncate for readability

        # Raise an exception for 4xx / 5xx responses — no silent failures
        response.raise_for_status()

        return response.json()

    except requests.exceptions.HTTPError as e:
        logger.error(f"❌ Hindsight RETAIN HTTP error: {e.response.status_code} — {e.response.text}")
        raise RuntimeError(
            f"Hindsight retain failed [{e.response.status_code}]: {e.response.text}"
        ) from e
    except requests.exceptions.ConnectionError as e:
        logger.error(f"❌ Hindsight RETAIN connection error: {e}")
        raise RuntimeError(f"Could not connect to Hindsight at {HINDSIGHT_BASE_URL}") from e
    except requests.exceptions.Timeout:
        logger.error(f"❌ Hindsight RETAIN timed out after 30s")
        raise RuntimeError("Hindsight retain request timed out") from None
    except requests.exceptions.JSONDecodeError as e:
        logger.error(f"❌ Hindsight RETAIN returned non-JSON response: {response.text}")
        raise RuntimeError(f"Hindsight retain returned invalid JSON: {response.text}") from e


def search_memory(query: str, limit: int = 5) -> list:
    """
    Search memories in Hindsight using the correct /recall endpoint.

    Correct endpoint: POST /v1/default/banks/{bank_id}/memories/recall
    Payload schema:   {"query": "...", "max_tokens": 4096}
    Response schema:  {"results": [{"id": ..., "text": ...}, ...]}
    """
    endpoint = f"{HINDSIGHT_BASE_URL}/v1/default/banks/{HINDSIGHT_BANK_ID}/memories/recall"
    payload = {
        "query": query,
        "max_tokens": 4096,
    }

    logger.debug("📤 Hindsight RECALL request:")
    logger.debug(f"   URL     : {endpoint}")
    logger.debug(f"   Payload : {json.dumps(payload, indent=2)}")

    try:
        response = requests.post(
            endpoint,
            headers=_hindsight_headers(),
            json=payload,
            timeout=30,
        )

        logger.debug(f"📥 Hindsight RECALL response:")
        logger.debug(f"   Status  : {response.status_code}")
        logger.debug(f"   Body    : {response.text[:500]}")

        response.raise_for_status()

        data = response.json()

        # Hindsight recall returns {"results": [...]} per the OpenAPI spec
        # Normalize to always return a list
        if isinstance(data, dict):
            return data.get("results", data.get("memories", []))
        elif isinstance(data, list):
            return data
        else:
            logger.warning(f"⚠️ Unexpected recall response shape: {type(data)}")
            return []

    except requests.exceptions.HTTPError as e:
        logger.error(f"❌ Hindsight RECALL HTTP error: {e.response.status_code} — {e.response.text}")
        # Don't crash the whole analyze flow; return empty list
        return []
    except requests.exceptions.ConnectionError as e:
        logger.error(f"❌ Hindsight RECALL connection error: {e}")
        return []
    except requests.exceptions.Timeout:
        logger.error(f"❌ Hindsight RECALL timed out after 30s")
        return []
    except Exception as e:
        logger.error(f"❌ Hindsight RECALL unexpected error: {e}")
        return []


# ━━━ API ENDPOINTS ━━━

@app.get("/health")
async def health_check():
    """Health check — also verifies Hindsight connectivity."""
    hindsight_reachable = False
    hindsight_error = None

    try:
        # Lightweight probe: list banks or hit root
        probe_url = f"{HINDSIGHT_BASE_URL}/v1/default/banks"
        r = requests.get(
            probe_url,
            headers=_hindsight_headers(),
            timeout=5,
        )
        logger.debug(f"🩺 Hindsight probe: {r.status_code} — {r.text[:200]}")
        hindsight_reachable = r.status_code < 500
    except Exception as e:
        hindsight_error = str(e)
        logger.error(f"🩺 Hindsight probe failed: {e}")

    return {
        "status": "ok",
        "hindsight": {
            "bank_id": HINDSIGHT_BANK_ID,
            "base_url": HINDSIGHT_BASE_URL,
            "reachable": hindsight_reachable,
            "error": hindsight_error,
        },
    }


@app.post("/api/load-historical-data")
async def load_historical_data():
    """
    Load all synthetic deals from data/ directory into Hindsight memory bank.

    Returns detailed stats:
      - total_files:   number of JSON files found
      - successful:    memories written successfully
      - failed:        memories that failed to write
      - errors:        list of {file, error} for each failure
    """
    data_dir = "data/"
    if not os.path.isdir(data_dir):
        raise HTTPException(status_code=500, detail=f"Data directory '{data_dir}' not found")

    json_files = [f for f in os.listdir(data_dir) if f.endswith(".json")]
    logger.info(f"📂 Found {len(json_files)} JSON files in {data_dir}: {json_files}")

    successful = 0
    failed = 0
    errors = []

    for filename in json_files:
        filepath = os.path.join(data_dir, filename)
        logger.info(f"⏳ Processing: {filename}")

        try:
            with open(filepath, encoding="utf-8") as f:
                deal = json.load(f)

            # Build rich memory content
            calls_summary = ""
            for call in deal.get("calls", []):
                calls_summary += (
                    f"\n  Call {call.get('call_number')} ({call.get('date')}): "
                    f"{call.get('notes', '')} "
                    f"[Sentiment: {call.get('sentiment', 'unknown')}] "
                    f"[Competitors: {call.get('competitor_mentions', [])}] "
                    f"[Red flags: {call.get('red_flags', [])}]"
                )

            outcome = (
                deal.get("lost_reason", "Unknown")
                if deal.get("status") == "LOST"
                else deal.get("won_reason", "WON")
            )

            memory_content = f"""
Deal: {deal.get('company', 'Unknown')}
Contact: {deal.get('contact', 'Unknown')}
Decision Maker: {deal.get('decision_maker', 'Unknown')}
Status: {deal.get('status', 'Unknown')}
Value: {deal.get('deal_value', 'Unknown')}
Duration: {deal.get('duration_days', 'Unknown')} days
Outcome: {outcome}
Lessons Learned: {deal.get('lessons_learned', [])}
Call History: {calls_summary}
""".strip()

            metadata = {
                "deal_id": deal.get("deal_id", filename),
                "status": deal.get("status", "UNKNOWN"),
                "company": deal.get("company", "Unknown"),
                "deal_value": deal.get("deal_value", "Unknown"),
                "source_file": filename,
            }

            logger.debug(f"📝 Memory content for {filename}:\n{memory_content}")

            result = store_memory(memory_content, metadata)

            logger.info(f"✅ Successfully stored memory for {filename}: {result}")
            successful += 1

        except json.JSONDecodeError as e:
            error_msg = f"JSON parse error in {filename}: {e}"
            logger.error(f"❌ {error_msg}")
            errors.append({"file": filename, "error": error_msg})
            failed += 1

        except RuntimeError as e:
            error_msg = str(e)
            logger.error(f"❌ Hindsight write failed for {filename}: {error_msg}")
            errors.append({"file": filename, "error": error_msg})
            failed += 1

        except Exception as e:
            error_msg = f"Unexpected error processing {filename}: {type(e).__name__}: {e}"
            logger.error(f"❌ {error_msg}")
            errors.append({"file": filename, "error": error_msg})
            failed += 1

    overall_status = "success" if failed == 0 else ("partial" if successful > 0 else "failed")

    logger.info(
        f"📊 Load complete — total: {len(json_files)}, "
        f"successful: {successful}, failed: {failed}"
    )

    return {
        "status": overall_status,
        "total_files": len(json_files),
        "successful": successful,
        "failed": failed,
        "errors": errors,
        "hindsight_bank_id": HINDSIGHT_BANK_ID,
        "hindsight_base_url": HINDSIGHT_BASE_URL,
    }


@app.post("/api/analyze-deal")
async def analyze_deal(deal_data: dict):
    """Analyze current deal — risk assessment + pre-call brief using past memories."""

    # Step 1: Retrieve relevant past deals from Hindsight
    query = (
        f"Deal with competitors {deal_data.get('competitor_mentions', [])}, "
        f"CFO engagement: {deal_data.get('cfo_engaged')}, "
        f"Stage: Call {deal_data.get('call_number')}, "
        f"Sentiment: {deal_data.get('sentiment')}"
    )

    logger.info(f"🔍 Searching Hindsight for: {query[:100]}...")
    raw_memories = search_memory(query, limit=10)  # fetch more so we can filter down to 5 named deals
    logger.info(f"📚 Retrieved {len(raw_memories)} memories from Hindsight")

    # Extract only the text from each memory to keep the prompt small.
    # Hindsight RecallResult has a 'text' field; full objects can be huge.
    past_memories_text = [
        m.get("text", str(m)) if isinstance(m, dict) else str(m)
        for m in raw_memories[:3]  # cap at 3 to stay under Groq's 12k TPM limit
    ]

    # Step 2: LLM analysis using retrieved memories
    prompt = f"""You are an expert sales coach AI with memory of past deals.

CURRENT DEAL (summary):
Company: {deal_data.get('company', 'Unknown')}
Call #: {deal_data.get('call_number')}
Sentiment: {deal_data.get('sentiment')}
CFO engaged: {deal_data.get('cfo_engaged')}
Competitors: {deal_data.get('competitor_mentions', [])}
Red flags: {deal_data.get('red_flags', [])}
Notes: {str(deal_data.get('notes', ''))[:300]}

MEMORIES FROM PAST DEALS (top {len(past_memories_text)}):
{chr(10).join(f'- {t[:400]}' for t in past_memories_text)}

Provide a JSON object with:
{{"RISK_LEVEL": "HIGH|MEDIUM|LOW", "RISK_REASON": "...", "WARNING_FLAGS": ["...", "..."], "PRE_CALL_BRIEF": "...", "RECOMMENDED_ACTION": "..."}}"""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=500,
    )

    analysis = json.loads(response.choices[0].message.content)

    similar_deals = []
    for m in raw_memories:
        if not isinstance(m, dict):
            continue
        meta = m.get("metadata", {})
        company = meta.get("company", "").strip()
        status = meta.get("status", "").strip()

        # Skip memories with no structured metadata — these are synthesized
        # insight snippets with no deal identity, not actual stored deal records
        if not company or not status:
            continue

        similar_deals.append({
            "company": company,
            "status": status,
            "summary": m.get("text", "")[:300],
            "score": m.get("score", m.get("similarity", None)),
        })

    # Cap at 5 — frontend shows 3 by default with a "See more" toggle
    similar_deals = similar_deals[:5]

    return {
        "analysis": analysis,
        "memories_used": len(raw_memories),
        "memory_bank_id": HINDSIGHT_BANK_ID,
        "similar_deals": similar_deals,
    }


@app.get("/api/pattern-insights")
async def get_pattern_insights():
    """Retrieve and synthesize deal patterns from Hindsight memory."""

    patterns_query = "patterns that lead to lost deals vs won deals risk factors champions"
    logger.info("🔍 Querying Hindsight for pattern insights...")
    raw_memories = search_memory(patterns_query, limit=10)
    logger.info(f"📚 Retrieved {len(raw_memories)} memories for pattern analysis")

    # Extract only text to keep the prompt under Groq's 12k TPM limit
    memory_texts = [
        m.get("text", str(m)) if isinstance(m, dict) else str(m)
        for m in raw_memories[:5]  # cap at 5
    ]

    prompt = f"""Based on these deal memory snippets, extract 4 key sales patterns.

DEAL MEMORIES:
{chr(10).join(f'- {t[:400]}' for t in memory_texts)}

Return JSON: {{"patterns": [{{"pattern_name": "...", "description": "...", "outcome": "WON|LOST", "confidence_percentage": 80, "example_deal": "..."}}]}}
Include 2 WON patterns and 2 LOST patterns."""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=600,
    )

    result = json.loads(response.choices[0].message.content)
    return {
        **result,
        "memories_analyzed": len(raw_memories),
        "bank_id": HINDSIGHT_BANK_ID,
    }


# ━━━ GAP 1: Dashboard needs all deals ━━━

@app.get("/api/deals")
async def get_all_deals():
    """
    Return a summary list of all deals for the Dashboard table.
    Reads every JSON file in data/ and returns deal metadata.
    Risk score starts as null — it gets populated when the rep
    opens a deal and analyze-deal is called.
    """
    data_dir = "data/"
    if not os.path.isdir(data_dir):
        raise HTTPException(status_code=500, detail=f"Data directory '{data_dir}' not found")

    json_files = sorted([f for f in os.listdir(data_dir) if f.endswith(".json")])
    deals = []

    for filename in json_files:
        filepath = os.path.join(data_dir, filename)
        try:
            with open(filepath, encoding="utf-8") as f:
                deal = json.load(f)

            # Latest call is the current stage
            calls = deal.get("calls", [])
            latest_call = calls[-1] if calls else {}

            deals.append({
                "deal_id": deal.get("deal_id"),
                "company": deal.get("company"),
                "contact": deal.get("contact"),
                "decision_maker": deal.get("decision_maker"),
                "deal_value": deal.get("deal_value"),
                "status": deal.get("status"),
                "call_number": len(calls),             # current stage = total calls so far
                "duration_days": deal.get("duration_days", 0),
                "latest_sentiment": latest_call.get("sentiment", "unknown"),
                "competitor_count": len(set(
                    c for call in calls for c in call.get("competitor_mentions", [])
                )),
                "risk_score": None,                    # populated client-side after analyze-deal
                "source_file": filename,
            })

        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"❌ Failed to read {filename}: {e}")
            continue

    logger.info(f"📋 Returning {len(deals)} deals for dashboard")
    return {
        "deals": deals,
        "total": len(deals),
        "pipeline_summary": {
            "active": sum(1 for d in deals if d["status"] == "ACTIVE"),
            "won": sum(1 for d in deals if d["status"] == "WON"),
            "lost": sum(1 for d in deals if d["status"] == "LOST"),
        },
    }


# ━━━ GAP 3: Deal Detail page needs a single deal by ID ━━━

@app.get("/api/deals/{deal_id}")
async def get_deal(deal_id: str):
    """
    Fetch a single deal's full history by deal_id.
    Called first when frontend loads /deal/:id — before analyze-deal runs.
    Returns the complete deal object including all calls, red flags,
    lessons learned, so the frontend can render the deal header and
    then fire analyze-deal with the full context.
    """
    data_dir = "data/"
    if not os.path.isdir(data_dir):
        raise HTTPException(status_code=500, detail=f"Data directory '{data_dir}' not found")

    for filename in os.listdir(data_dir):
        if not filename.endswith(".json"):
            continue
        filepath = os.path.join(data_dir, filename)
        try:
            with open(filepath, encoding="utf-8") as f:
                deal = json.load(f)
            if deal.get("deal_id") == deal_id:
                logger.info(f"✅ Found deal {deal_id} in {filename}")
                return {"deal": deal, "source_file": filename}
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"❌ Failed to read {filename}: {e}")
            continue

    logger.warning(f"⚠️ Deal {deal_id} not found in data/")
    raise HTTPException(status_code=404, detail=f"Deal '{deal_id}' not found")


# ━━━ GAP 2: Creating a fresh new deal (first call) ━━━

@app.post("/api/create-deal")
async def create_deal(deal_data: dict):
    """
    Create a brand-new deal from the first call the rep logs.
    1. Generates a unique deal_id
    2. Saves a JSON file to data/ so it persists and shows on dashboard
    3. Immediately stores in Hindsight so memory recall can find it

    Required fields in body:
      company, contact, deal_value, notes
    Optional:
      decision_maker, date, red_flags, competitor_mentions, sentiment
    """
    # Validate required fields
    required = ["company", "contact", "deal_value", "notes"]
    missing = [f for f in required if not deal_data.get(f)]
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Missing required fields: {missing}"
        )

    deal_id = f"DEAL-{str(uuid.uuid4())[:6].upper()}"
    call_date = deal_data.get("date", str(date.today()))

    new_deal = {
        "deal_id": deal_id,
        "company": deal_data["company"],
        "contact": deal_data["contact"],
        "decision_maker": deal_data.get("decision_maker", "Unknown"),
        "deal_value": deal_data["deal_value"],
        "status": "ACTIVE",
        "duration_days": 0,
        "calls": [
            {
                "call_number": 1,
                "date": call_date,
                "notes": deal_data["notes"],
                "red_flags": deal_data.get("red_flags", []),
                "competitor_mentions": deal_data.get("competitor_mentions", []),
                "sentiment": deal_data.get("sentiment", "neutral"),
            }
        ],
        "lessons_learned": [],
    }

    # Save JSON to data/ folder so it persists across restarts
    safe_company = deal_data["company"].lower().replace(" ", "_")[:20]
    filename = f"deal_{deal_id.lower()}_{safe_company}.json"
    filepath = os.path.join("data/", filename)

    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(new_deal, f, indent=2)
        logger.info(f"✅ Saved new deal to {filepath}")
    except OSError as e:
        logger.error(f"❌ Failed to save deal file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save deal: {e}")

    # Store in Hindsight immediately so memory recall can match it
    memory_content = f"""
New Deal Started: {deal_data['company']}
Contact: {deal_data['contact']}
Decision Maker: {deal_data.get('decision_maker', 'Unknown')}
Value: {deal_data['deal_value']}
Status: ACTIVE
Call 1 Notes ({call_date}): {deal_data['notes']}
Competitors mentioned: {deal_data.get('competitor_mentions', [])}
Red flags: {deal_data.get('red_flags', [])}
Sentiment: {deal_data.get('sentiment', 'neutral')}
""".strip()

    try:
        store_memory(memory_content, {
            "deal_id": deal_id,
            "status": "ACTIVE",
            "company": deal_data["company"],
            "type": "new_deal",
            "call_number": 1,
        })
        logger.info(f"✅ Stored new deal {deal_id} in Hindsight")
    except RuntimeError as e:
        # Memory store failure should not block the deal being created
        logger.warning(f"⚠️ Deal saved to disk but Hindsight store failed: {e}")

    return {
        "status": "created",
        "deal_id": deal_id,
        "source_file": filename,
        "deal": new_deal,
    }


# ━━━ GAP 5 (partial fix): update-deal-memory now also syncs the JSON file ━━━

@app.post("/api/update-deal-memory")
async def update_deal_memory(update_data: dict):
    """
    Store a post-call update in Hindsight AND append the new call to
    the deal's JSON file on disk so GET /api/deals/:id stays in sync.

    Required fields: deal_id, company, call_number, notes
    Optional: competitors, red_flags, sentiment, action_taken, date
    """
    required = ["deal_id", "company", "call_number", "notes"]
    missing = [f for f in required if update_data.get(f) is None]
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Missing required fields: {missing}"
        )

    # ── Step 1: Store in Hindsight ──────────────────────────────────────────
    memory_content = f"""
Deal Update — {update_data['company']} — Call {update_data['call_number']}
Notes: {update_data['notes']}
Competitor mentions: {update_data.get('competitors', [])}
Red flags: {update_data.get('red_flags', [])}
Sentiment: {update_data.get('sentiment', 'unknown')}
Action taken: {update_data.get('action_taken', 'None recorded')}
""".strip()

    metadata = {
        "deal_id": update_data["deal_id"],
        "call_number": update_data["call_number"],
        "type": "call_update",
        "company": update_data["company"],
    }

    hindsight_result = None
    try:
        hindsight_result = store_memory(memory_content, metadata)
        logger.info(f"✅ Hindsight memory updated for {update_data['company']} call {update_data['call_number']}")
    except RuntimeError as e:
        logger.error(f"❌ Hindsight store failed: {e}")
        # Don't abort — still sync the disk file below

    # ── Step 2: Sync JSON file on disk (the gap that was missing) ──────────
    data_dir = "data/"
    file_synced = False
    call_date = update_data.get("date", str(date.today()))

    if os.path.isdir(data_dir):
        for filename in os.listdir(data_dir):
            if not filename.endswith(".json"):
                continue
            filepath = os.path.join(data_dir, filename)
            try:
                with open(filepath, encoding="utf-8") as f:
                    deal = json.load(f)

                if deal.get("deal_id") != update_data["deal_id"]:
                    continue

                # Append the new call record
                new_call = {
                    "call_number": update_data["call_number"],
                    "date": call_date,
                    "notes": update_data["notes"],
                    "red_flags": update_data.get("red_flags", []),
                    "competitor_mentions": update_data.get("competitors", []),
                    "sentiment": update_data.get("sentiment", "neutral"),
                }
                deal.setdefault("calls", []).append(new_call)

                # Optionally mark deal as LOST/WON if caller provides status
                if update_data.get("new_status"):
                    deal["status"] = update_data["new_status"]
                    if update_data["new_status"] == "LOST":
                        deal["lost_reason"] = update_data.get("lost_reason", "Not specified")
                    elif update_data["new_status"] == "WON":
                        deal["won_reason"] = update_data.get("won_reason", "Not specified")

                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump(deal, f, indent=2)

                logger.info(f"✅ Synced call {update_data['call_number']} to {filename}")
                file_synced = True
                break

            except (json.JSONDecodeError, OSError) as e:
                logger.error(f"❌ Failed to sync {filename}: {e}")
                continue

    if not file_synced:
        logger.warning(f"⚠️ Deal {update_data['deal_id']} not found on disk — memory stored in Hindsight only")

    return {
        "status": "updated",
        "hindsight_stored": hindsight_result is not None,
        "file_synced": file_synced,
        "bank_id": HINDSIGHT_BANK_ID,
    }


# ━━━ GAP 4: Memory timeline for Patterns page ━━━

@app.get("/api/memory-timeline")
async def get_memory_timeline():
    """
    Return all deals sorted chronologically for the memory timeline
    on the Patterns page.
    Shows how memory grows over time — 6 historical deals + any
    new ones the rep has added during the session.

    Each entry includes:
      - company, status, deal_value
      - first_call_date (proxy for 'when this entered memory')
      - call_count, lessons_count (shows how rich each memory is)
      - total running memory count
    """
    data_dir = "data/"
    if not os.path.isdir(data_dir):
        raise HTTPException(status_code=500, detail=f"Data directory '{data_dir}' not found")

    json_files = sorted([f for f in os.listdir(data_dir) if f.endswith(".json")])
    timeline = []

    for filename in json_files:
        filepath = os.path.join(data_dir, filename)
        try:
            with open(filepath, encoding="utf-8") as f:
                deal = json.load(f)

            calls = deal.get("calls", [])
            # Use first call date as the "added to memory" timestamp
            first_call_date = calls[0]["date"] if calls else "unknown"

            timeline.append({
                "deal_id": deal.get("deal_id"),
                "company": deal.get("company"),
                "status": deal.get("status"),
                "deal_value": deal.get("deal_value"),
                "first_call_date": first_call_date,
                "call_count": len(calls),
                "lessons_count": len(deal.get("lessons_learned", [])),
                "source_file": filename,
            })

        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"❌ Failed to read {filename} for timeline: {e}")
            continue

    # Sort by first_call_date so timeline is chronological
    timeline.sort(key=lambda x: x["first_call_date"])

    # Attach running memory count so the frontend can animate growth
    for i, entry in enumerate(timeline, start=1):
        entry["memory_index"] = i

    total_lessons = sum(t["lessons_count"] for t in timeline)
    total_calls = sum(t["call_count"] for t in timeline)

    logger.info(f"📅 Returning memory timeline with {len(timeline)} entries")
    return {
        "timeline": timeline,
        "total_deals_in_memory": len(timeline),
        "total_lessons_learned": total_lessons,
        "total_calls_logged": total_calls,
        "won_count": sum(1 for t in timeline if t["status"] == "WON"),
        "lost_count": sum(1 for t in timeline if t["status"] == "LOST"),
        "active_count": sum(1 for t in timeline if t["status"] == "ACTIVE"),
    }