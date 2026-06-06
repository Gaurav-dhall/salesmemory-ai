import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Filter, Search, Brain, Plus, X, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useSidebar } from '../context/SidebarContext';
import { getAllDeals, loadHistoricalData, createDeal } from '../api';

// ── Helpers ────────────────────────────────────────────────────────────────────
function parseDealValue(val) {
  if (!val) return 0;
  return Number(String(val).replace(/[^0-9.]/g, '')) || 0;
}

function formatPipeline(deals) {
  const total = deals.reduce((sum, d) => sum + parseDealValue(d.deal_value), 0);
  if (total >= 1_000_000) return `$${(total / 1_000_000).toFixed(1)}M`;
  if (total >= 1_000) return `$${(total / 1_000).toFixed(0)}K`;
  return `$${total}`;
}

function riskFromSentiment(sentiment) {
  if (sentiment === 'declining') return 'HIGH';
  if (sentiment === 'neutral') return 'MEDIUM';
  return 'LOW';
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function RiskBadge({ risk, status }) {
  // Closed deals → show outcome, not risk
  if (status === 'WON')  return <span className="badge-won">WON</span>;
  if (status === 'LOST') return <span className="badge-lost">LOST</span>;
  // Active deals → show sentiment-based risk
  const cls = risk === 'HIGH' ? 'badge badge-high' : risk === 'MEDIUM' ? 'badge badge-medium' : 'badge badge-low';
  return <span className={cls}>{risk}</span>;
}

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <td key={i}>
          <div style={{ height: 16, borderRadius: 6, background: 'var(--color-border)', width: i === 1 ? '80%' : '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </td>
      ))}
    </tr>
  );
}

// ── Add Deal Modal ─────────────────────────────────────────────────────────────
function AddDealModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    company: '', contact: '', deal_value: '', notes: '',
    decision_maker: '', sentiment: 'positive',
    competitor_mentions: '', red_flags: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        company: form.company,
        contact: form.contact,
        deal_value: form.deal_value,
        notes: form.notes,
        decision_maker: form.decision_maker || undefined,
        sentiment: form.sentiment,
        competitor_mentions: form.competitor_mentions
          ? form.competitor_mentions.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        red_flags: form.red_flags
          ? form.red_flags.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      };
      const result = await createDeal(payload);
      onSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        style={{
          background: 'var(--color-surface)', borderRadius: 16,
          border: '1px solid var(--color-border)',
          width: '100%', maxWidth: 560, padding: 32,
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Add New Deal
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Creates Call 1 and stores in Hindsight memory
            </p>
          </div>
          <button onClick={onClose} className="icon-btn" style={{ width: 36, height: 36 }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <AlertCircle size={15} color="#EF4444" />
            <span style={{ fontSize: 13, color: '#EF4444', fontFamily: "'Inter', sans-serif" }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Company *</label>
                <input className="form-input" value={form.company} onChange={set('company')} required placeholder="Acme Corp" />
              </div>
              <div>
                <label className="form-label">Contact Name *</label>
                <input className="form-input" value={form.contact} onChange={set('contact')} required placeholder="Jane Doe" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Deal Value *</label>
                <input className="form-input" value={form.deal_value} onChange={set('deal_value')} required placeholder="$50,000" />
              </div>
              <div>
                <label className="form-label">Decision Maker</label>
                <input className="form-input" value={form.decision_maker} onChange={set('decision_maker')} placeholder="CEO John Smith" />
              </div>
            </div>
            <div>
              <label className="form-label">Call 1 Notes *</label>
              <textarea className="form-textarea" rows={3} value={form.notes} onChange={set('notes')} required placeholder="Key points from the discovery call..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Sentiment</label>
                <select className="form-input" value={form.sentiment} onChange={set('sentiment')}>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="declining">Declining</option>
                </select>
              </div>
              <div>
                <label className="form-label">Competitors (comma-sep)</label>
                <input className="form-input" value={form.competitor_mentions} onChange={set('competitor_mentions')} placeholder="Salesforce, HubSpot" />
              </div>
            </div>
            <div>
              <label className="form-label">Red Flags (comma-sep)</label>
              <input className="form-input" value={form.red_flags} onChange={set('red_flags')} placeholder="CFO not on call, budget unclear" />
            </div>
          </div>

          <motion.button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', height: 48, marginTop: 20, gap: 8 }}
            disabled={saving}
            whileHover={saving ? {} : { scale: 1.02, y: -2 }}
            whileTap={saving ? {} : { scale: 0.97 }}
          >
            {saving
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating deal...</>
              : <><Plus size={16} /> Create Deal &amp; Store in Memory</>}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Animation Variants ─────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const chipVariant = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({
    opacity: 1, scale: 1,
    transition: { delay: 0.15 + i * 0.07, duration: 0.35, ease: 'easeOut' },
  }),
};

const tableRowVariant = {
  hidden: { opacity: 0, x: -16 },
  visible: (i = 0) => ({
    opacity: 1, x: 0,
    transition: { delay: 0.3 + i * 0.055, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const sidebarW = collapsed ? 64 : 240;

  // ── State ──────────────────────────────────────────────────────────────────
  const [deals, setDeals] = useState([]);
  const [summary, setSummary] = useState({ active: 0, won: 0, lost: 0 });
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [dealsError, setDealsError] = useState(null);

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyResult, setHistoryResult] = useState(null);

  const [showAddDeal, setShowAddDeal] = useState(false);

  // ── Fetch deals on mount ───────────────────────────────────────────────────
  const fetchDeals = useCallback(async () => {
    setLoadingDeals(true);
    setDealsError(null);
    try {
      const data = await getAllDeals();
      setDeals(data.deals || []);
      setSummary(data.pipeline_summary || { active: 0, won: 0, lost: 0 });
    } catch (err) {
      setDealsError(err.message);
    } finally {
      setLoadingDeals(false);
    }
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalPipeline = formatPipeline(deals);
  const highRiskCount = deals.filter(d =>
    d.status === 'ACTIVE' && riskFromSentiment(d.latest_sentiment) === 'HIGH'
  ).length;

  const statChips = [
    { label: 'Total Pipeline', value: loadingDeals ? '—' : totalPipeline, color: 'var(--color-accent)' },
    { label: 'Active Deals',   value: loadingDeals ? '—' : String(summary.active), color: 'var(--color-text-primary)' },
    { label: 'High Risk',      value: loadingDeals ? '—' : String(highRiskCount), color: 'var(--color-danger)' },
  ];

  // ── Load historical data ───────────────────────────────────────────────────
  const handleLoadHistory = async () => {
    setLoadingHistory(true);
    setHistoryResult(null);
    try {
      const result = await loadHistoricalData();
      setHistoryResult({ ok: true, message: `✅ ${result.successful}/${result.total_files} deals loaded into Hindsight` });
    } catch (err) {
      setHistoryResult({ ok: false, message: `❌ ${err.message}` });
    } finally {
      setLoadingHistory(false);
    }
  };

  // ── After deal created ─────────────────────────────────────────────────────
  const handleDealCreated = (result) => {
    setShowAddDeal(false);
    fetchDeals(); // refresh table
    navigate(`/deal/${result.deal_id}`);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <motion.div
        initial={false}
        animate={{ marginLeft: sidebarW }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{ flex: 1, background: 'var(--color-bg)', minHeight: '100vh' }}
      >
        <TopBar />
        <div className="page-content">

          {/* ── Top Row ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
              <h1 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 32, fontWeight: 700,
                color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.2,
              }}>
                Deal Pipeline
              </h1>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'var(--color-text-secondary)', margin: '6px 0 0 0' }}>
                AI-monitored deals with memory-powered risk scoring
              </p>
            </motion.div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {statChips.map((chip, i) => (
                <motion.div key={chip.label} className="stat-chip" variants={chipVariant} custom={i} initial="hidden" animate="visible">
                  <div className="stat-chip-label">{chip.label}</div>
                  <div className="stat-chip-value" style={{ color: chip.color }}>{chip.value}</div>
                </motion.div>
              ))}

              {/* Add New Deal */}
              <motion.button
                className="btn-secondary"
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                onClick={() => setShowAddDeal(true)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.35, ease: 'easeOut' }}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <Plus size={14} /> New Deal
              </motion.button>

              {/* Load Historical Data */}
              <motion.button
                className="btn-primary"
                style={{ flexShrink: 0 }}
                onClick={handleLoadHistory}
                disabled={loadingHistory}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.35, ease: 'easeOut' }}
                whileHover={loadingHistory ? {} : { scale: 1.04, y: -2 }}
                whileTap={loadingHistory ? {} : { scale: 0.97 }}
              >
                {loadingHistory
                  ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <RefreshCw size={14} />}
                {loadingHistory ? 'Loading...' : 'Load Historical Data'}
              </motion.button>
            </div>
          </div>

          {/* History result toast */}
          <AnimatePresence>
            {historyResult && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px', borderRadius: 10, marginBottom: 16,
                  background: historyResult.ok ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${historyResult.ok ? '#BBF7D0' : '#FECACA'}`,
                  fontFamily: "'Inter', sans-serif", fontSize: 13,
                  color: historyResult.ok ? '#15803D' : '#DC2626',
                }}
              >
                <span>{historyResult.message}</span>
                <button onClick={() => setHistoryResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Deals Table Card ── */}
          <motion.div
            className="card-static"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Card header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 24px', borderBottom: '1px solid var(--color-border)',
            }}>
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Active Deals
                </div>
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 2, fontFamily: "'Inter', sans-serif" }}>
                  {loadingDeals ? 'Loading...' : `${deals.length} deals being monitored by AI`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <button className="icon-btn" aria-label="Filter"><Filter size={18} /></button>
                <button className="icon-btn" aria-label="Search"><Search size={18} /></button>
              </div>
            </div>

            {/* Error state */}
            {dealsError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 24px', color: 'var(--color-danger)', fontFamily: "'Inter', sans-serif", fontSize: 14 }}>
                <AlertCircle size={16} />
                Failed to load deals: {dealsError}
              </div>
            )}

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="deals-table">
                <thead>
                  <tr>
                    <th>Company &amp; Contact</th>
                    <th>Deal Value</th>
                    <th>Stage</th>
                    <th>Status / Risk</th>
                    <th>Days Active</th>
                    <th style={{ width: 140 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loadingDeals ? (
                    [1, 2, 3, 4, 5, 6].map(i => <SkeletonRow key={i} />)
                  ) : deals.map((deal, i) => {
                    const risk = riskFromSentiment(deal.latest_sentiment);
                    return (
                      <motion.tr
                        key={deal.deal_id}
                        variants={tableRowVariant}
                        custom={i}
                        initial="hidden"
                        animate="visible"
                        onClick={() => navigate(`/deal/${deal.deal_id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: "'Inter', sans-serif" }}>
                            {deal.company}
                          </div>
                          <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontFamily: "'Inter', sans-serif", marginTop: 2 }}>
                            {deal.contact}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-accent)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {deal.deal_value}
                          </span>
                        </td>
                        <td><span className="stage-pill">Call {deal.call_number}</span></td>
                        <td><RiskBadge risk={risk} status={deal.status} /></td>
                        <td>
                          <span style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontFamily: "'Inter', sans-serif" }}>
                            {deal.duration_days} days
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="analyze-btn"
                            onClick={(e) => { e.stopPropagation(); navigate(`/deal/${deal.deal_id}`); }}
                          >
                            Analyze Deal →
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* ── Footer ── */}
          <motion.div
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.4 }}
          >
            <Brain size={16} color="var(--color-text-muted)" />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
              {loadingDeals
                ? 'Loading deal memory...'
                : `Memory active — ${deals.length} deals loaded (${summary.won} won, ${summary.lost} lost, ${summary.active} active)`}
            </p>
          </motion.div>

        </div>
      </motion.div>

      {/* ── Add Deal Modal ── */}
      <AnimatePresence>
        {showAddDeal && (
          <AddDealModal
            onClose={() => setShowAddDeal(false)}
            onSuccess={handleDealCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
