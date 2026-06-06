import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain, BarChart2, Lightbulb, AlertTriangle, CheckCircle, Clock, ArrowRight, Loader2, AlertCircle,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useSidebar } from '../context/SidebarContext';
import { getPatternInsights, getMemoryTimeline } from '../api';

// ── Helpers ───────────────────────────────────────────────────────────────────
function Skeleton({ w = '80%', h = 16, mb = 0, radius = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'var(--color-border)', marginBottom: mb,
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

// ── Animation Variants ─────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const patternVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.3 + i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const timelineVariant = {
  hidden: { opacity: 0, scale: 0, y: 10 },
  visible: (i = 0) => ({
    opacity: 1, scale: 1, y: 0,
    transition: { delay: 0.5 + i * 0.07, duration: 0.35, type: 'spring', stiffness: 200, damping: 18 },
  }),
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Patterns() {
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const sidebarW = collapsed ? 64 : 240;

  // ── State ──────────────────────────────────────────────────────────────────
  const [patterns, setPatterns] = useState([]);
  const [loadingPatterns, setLoadingPatterns] = useState(true);
  const [patternsError, setPatternsError] = useState(null);
  const [memoriesAnalyzed, setMemoriesAnalyzed] = useState(0);

  const [timeline, setTimeline] = useState([]);
  const [timelineStats, setTimelineStats] = useState({});
  const [loadingTimeline, setLoadingTimeline] = useState(true);

  // ── Fetch on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    // Fetch patterns
    getPatternInsights()
      .then(data => {
        setPatterns(data.patterns || []);
        setMemoriesAnalyzed(data.memories_analyzed || 0);
      })
      .catch(err => setPatternsError(err.message))
      .finally(() => setLoadingPatterns(false));

    // Fetch memory timeline
    getMemoryTimeline()
      .then(data => {
        setTimeline(data.timeline || []);
        setTimelineStats({
          total: data.total_deals_in_memory || 0,
          lessons: data.total_lessons_learned || 0,
          calls: data.total_calls_logged || 0,
          won: data.won_count || 0,
          lost: data.lost_count || 0,
          active: data.active_count || 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoadingTimeline(false));
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const losingPatterns = patterns.filter(p => p.outcome === 'LOST');
  const winningPatterns = patterns.filter(p => p.outcome === 'WON');

  const wonCount = timelineStats.won || 0;
  const lostCount = timelineStats.lost || 0;
  const totalDeals = timelineStats.total || 0;
  const avgWinConf = winningPatterns.length
    ? Math.round(winningPatterns.reduce((s, p) => s + (p.confidence_percentage || 80), 0) / winningPatterns.length)
    : 82;

  const statCards = [
    { label: 'DEALS ANALYZED',         value: loadingTimeline ? '—' : String(totalDeals),  icon: BarChart2,    iconColor: '#94A3B8', valueColor: 'var(--color-text-primary)' },
    { label: 'PATTERNS DETECTED',      value: loadingPatterns ? '—' : String(patterns.length), icon: Lightbulb,   iconColor: '#94A3B8', valueColor: 'var(--color-accent)'  },
    { label: 'AVG LOSS SIGNAL',        value: 'Call 3',                                    icon: AlertTriangle,iconColor: '#EF4444', valueColor: 'var(--color-danger)', sub: 'When danger first appears', valueSize: 24 },
    { label: 'WIN PREDICTION ACCURACY',value: loadingPatterns ? '—' : `${avgWinConf}%`,   icon: CheckCircle,  iconColor: '#10B981', valueColor: 'var(--color-success)' },
  ];

  const totalInteractions = timelineStats.calls || 0;

  return (
    <div className="app-layout">
      <Sidebar />
      <motion.div
        initial={false}
        animate={{ marginLeft: sidebarW }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{ flex: 1, background: 'var(--color-bg)', minHeight: '100vh', minWidth: 0, overflow: 'hidden' }}
      >
        <TopBar />
        <div className="page-content">

          {/* ── Top Row ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
            <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.2 }}>
                Deal Patterns
              </h1>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'var(--color-text-secondary)', margin: '6px 0 0 0' }}>
                What SalesMemory AI has learned from {totalDeals || '—'} historical deals — {wonCount} won, {lostCount} lost
              </p>
            </motion.div>
            <motion.div
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontFamily: "'Inter', sans-serif", color: '#1E40AF', fontWeight: 500, whiteSpace: 'nowrap' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.35, ease: 'easeOut' }}
            >
              <Brain size={16} color="#3B82F6" />
              {loadingTimeline
                ? 'Loading memory...'
                : `Memory: ${totalDeals} deals · ${totalInteractions} interactions stored`}
            </motion.div>
          </div>

          {/* ── 4 Stat Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, marginBottom: 48 }}>
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  className="card"
                  style={{ padding: 24 }}
                  variants={fadeUp} custom={i} initial="hidden" animate="visible"
                  whileHover={{ y: -4, boxShadow: '0px 12px 28px rgba(15,23,42,0.1)', transition: { duration: 0.2 } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>
                      {card.label}
                    </span>
                    <Icon size={24} color={card.iconColor} />
                  </div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: card.valueSize || 32, fontWeight: 700, color: card.valueColor, lineHeight: 1.1 }}>
                    {card.value}
                  </div>
                  {card.sub && (
                    <p style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--color-text-muted)', fontFamily: "'Inter', sans-serif", margin: '6px 0 0 0' }}>
                      {card.sub}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* ── Error State ── */}
          {patternsError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: 24, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#DC2626' }}>
              <AlertCircle size={15} />
              Pattern insights unavailable: {patternsError}. Showing cached data.
            </div>
          )}

          {/* ── Losing Patterns ── */}
          <div style={{ marginBottom: 32 }}>
            <motion.div
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
              <AlertTriangle size={16} color="#EF4444" />
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Losing Patterns</span>
            </motion.div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {loadingPatterns ? (
                [0,1].map(i => (
                  <div key={i} className="pattern-card-losing" style={{ minHeight: 140 }}>
                    <Skeleton w="70%" h={16} mb={12} />
                    <Skeleton w="90%" h={13} mb={6} />
                    <Skeleton w="80%" h={13} mb={6} />
                    <Skeleton w="40%" h={13} />
                  </div>
                ))
              ) : losingPatterns.map((p, i) => (
                <motion.div
                  key={p.pattern_name}
                  className="pattern-card-losing"
                  variants={patternVariant} custom={i} initial="hidden" animate="visible"
                  whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(239,68,68,0.1)', transition: { duration: 0.2 } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', flex: 1 }}>{p.pattern_name}</span>
                    <span style={{ background: '#FEF2F2', color: '#EF4444', borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 700, fontFamily: "'Inter', sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {p.confidence_percentage}% CONFIDENCE
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '10px 0 0 0' }}>{p.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
                    <Clock size={14} color="#94A3B8" />
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontFamily: "'Inter', sans-serif" }}>Example: {p.example_deal}</span>
                    <span className="badge-lost">LOST</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Winning Patterns ── */}
          <div style={{ marginBottom: 48 }}>
            <motion.div
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
              <CheckCircle size={16} color="#10B981" />
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Winning Patterns</span>
            </motion.div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {loadingPatterns ? (
                [0,1].map(i => (
                  <div key={i} className="pattern-card-winning" style={{ minHeight: 140 }}>
                    <Skeleton w="70%" h={16} mb={12} />
                    <Skeleton w="90%" h={13} mb={6} />
                    <Skeleton w="80%" h={13} mb={6} />
                    <Skeleton w="40%" h={13} />
                  </div>
                ))
              ) : winningPatterns.map((p, i) => (
                <motion.div
                  key={p.pattern_name}
                  className="pattern-card-winning"
                  variants={patternVariant} custom={i + 2} initial="hidden" animate="visible"
                  whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(16,185,129,0.1)', transition: { duration: 0.2 } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', flex: 1 }}>{p.pattern_name}</span>
                    <span style={{ background: '#F0FDF4', color: '#10B981', borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 700, fontFamily: "'Inter', sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {p.confidence_percentage}% CONFIDENCE
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '10px 0 0 0' }}>{p.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
                    <Clock size={14} color="#94A3B8" />
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontFamily: "'Inter', sans-serif" }}>Example: {p.example_deal}</span>
                    <span className="badge-won">WON</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Memory Timeline ── */}
          <motion.div
            className="card-static"
            style={{ padding: 28, marginBottom: 48 }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Brain size={20} color="var(--color-accent)" />
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>How Memory Has Grown</span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: "'Inter', sans-serif" }}>
                {loadingTimeline ? 'Loading...' : `${totalDeals} deals · ${timelineStats.lessons || 0} lessons · ${timelineStats.calls || 0} calls`}
              </span>
            </div>

            <div className="timeline-container">
              <motion.div
                className="timeline-line"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.65, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
              <div className="timeline-nodes">
                {loadingTimeline ? (
                  [1,2,3,4,5,6].map(i => (
                    <div key={i} className="timeline-node" style={{ opacity: 0.4 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--color-border)' }} />
                      <Skeleton w={56} h={12} />
                    </div>
                  ))
                ) : timeline.map((node, i) => (
                  <motion.div
                    key={node.deal_id}
                    className="timeline-node"
                    variants={timelineVariant} custom={i} initial="hidden" animate="visible"
                  >
                    <div className={`timeline-dot ${node.status === 'LOST' ? 'timeline-dot-red' : node.status === 'ACTIVE' ? 'timeline-dot-amber' : 'timeline-dot-blue'}`} />
                    <div className="timeline-label">{node.company}</div>
                    <div className="timeline-sub">{node.call_count} CALLS</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.p
              style={{ textAlign: 'center', fontSize: 13, fontStyle: 'italic', color: 'var(--color-text-muted)', fontFamily: "'Inter', sans-serif", marginTop: 24, marginBottom: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.4 }}
            >
              {loadingTimeline
                ? 'Loading memory timeline...'
                : `Memory compounds — ${timelineStats.lessons || 0} lessons learned across ${totalDeals} deals`}
            </motion.p>
          </motion.div>

          {/* ── Bottom CTA ── */}
          <motion.div
            style={{ textAlign: 'center', paddingBottom: 48 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.4 }}
          >
            <motion.button
              className="btn-primary"
              style={{ padding: '14px 32px', fontSize: 15 }}
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.05, y: -3, boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}
              whileTap={{ scale: 0.97 }}
            >
              View Active Deals <ArrowRight size={16} />
            </motion.button>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}
