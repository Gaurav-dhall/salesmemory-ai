// src/api.js — Centralized API utility for SalesMemory AI
// All backend calls go through here. Change BASE_URL once to switch environments.

const BASE_URL = 'http://localhost:8000';

async function request(path, { method = 'GET', body } = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Health ───────────────────────────────────────────────────────────────────
/** GET /health — check backend + Hindsight connectivity */
export const checkHealth = () => request('/health');

// ─── Deals ────────────────────────────────────────────────────────────────────
/** GET /api/deals — return all deals for the Dashboard table */
export const getAllDeals = () => request('/api/deals');

/** GET /api/deals/:deal_id — return a single deal's full data */
export const getDeal = (dealId) => request(`/api/deals/${dealId}`);

/** POST /api/create-deal — create a brand-new deal (Call 1) */
export const createDeal = (data) => request('/api/create-deal', { method: 'POST', body: data });

// ─── Memory ───────────────────────────────────────────────────────────────────
/** POST /api/load-historical-data — bulk-load data/ dir into Hindsight */
export const loadHistoricalData = () => request('/api/load-historical-data', { method: 'POST' });

/** POST /api/update-deal-memory — save a call update to Hindsight + disk */
export const updateDealMemory = (data) => request('/api/update-deal-memory', { method: 'POST', body: data });

// ─── AI Analysis ──────────────────────────────────────────────────────────────
/** POST /api/analyze-deal — AI risk assessment + pre-call brief */
export const analyzeDeal = (data) => request('/api/analyze-deal', { method: 'POST', body: data });

// ─── Patterns ─────────────────────────────────────────────────────────────────
/** GET /api/pattern-insights — AI-synthesized deal patterns from Hindsight */
export const getPatternInsights = () => request('/api/pattern-insights');

/** GET /api/memory-timeline — chronological deal timeline for Patterns page */
export const getMemoryTimeline = () => request('/api/memory-timeline');
