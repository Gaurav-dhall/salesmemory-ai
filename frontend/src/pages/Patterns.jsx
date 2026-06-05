import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain, BarChart2, Lightbulb, AlertTriangle, CheckCircle, Clock, ArrowRight,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useSidebar } from '../context/SidebarContext';

const STAT_CARDS = [
  { label: 'DEALS ANALYZED',         value: '6',      icon: BarChart2,   iconColor: '#94A3B8', valueColor: 'var(--color-text-primary)', sub: null           },
  { label: 'PATTERNS DETECTED',      value: '4',      icon: Lightbulb,   iconColor: '#94A3B8', valueColor: 'var(--color-accent)',       sub: null           },
  { label: 'AVG LOSS SIGNAL',        value: 'Call 3', icon: AlertTriangle,iconColor: '#EF4444', valueColor: 'var(--color-danger)',       sub: 'When danger first appears', valueSize: 24 },
  { label: 'WIN PREDICTION ACCURACY',value: '82%',    icon: CheckCircle, iconColor: '#10B981', valueColor: 'var(--color-success)',      sub: null           },
];

const LOSING_PATTERNS = [
  {
    title: 'CFO Disengagement by Call 3', confidence: '80% CONFIDENCE',
    description: 'When the economic buyer (CFO) is absent or passive by Call 3, the deal has an 80% loss rate. Reps underestimate this signal.',
    example: 'FinEdge Technologies', outcome: 'LOST',
  },
  {
    title: 'Unaddressed Competitor Escalation', confidence: '75% CONFIDENCE',
    description: 'Failure to counter-position against competitor mentions in Q&A. When competitors are named 2+ times without a comparison document, deals stall.',
    example: 'MetroBank', outcome: 'LOST',
  },
];

const WINNING_PATTERNS = [
  {
    title: 'Custom ROI Calculator Sent by Call 2', confidence: '82% CONFIDENCE',
    description: 'Quantifying business value early secures champion alignment. Deals with a personalized ROI doc before Call 2 closed at 82% rate.',
    example: 'CloudSoft Inc', outcome: 'WON',
  },
  {
    title: 'Multi-threaded Stakeholder Relationships', confidence: '78% CONFIDENCE',
    description: 'Maintaining active dialogue with 4+ unique personas simultaneously. Single-threaded deals died when the champion lost influence.',
    example: 'GlobalCorp', outcome: 'WON',
  },
];

const TIMELINE_NODES = [
  { company: 'FinEdge',   signals: 3, type: 'lost' },
  { company: 'MetroBank', signals: 2, type: 'lost' },
  { company: 'RetailCo',  signals: 4, type: 'lost' },
  { company: 'CloudSoft', signals: 5, type: 'won'  },
  { company: 'NexTech',   signals: 4, type: 'won'  },
  { company: 'GlobalCorp',signals: 6, type: 'won'  },
];

// ── Variants ──────────────────────────────────────────────────────────
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

export default function Patterns() {
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const sidebarW = collapsed ? 64 : 240;

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.2 }}>
                Deal Patterns
              </h1>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'var(--color-text-secondary)', margin: '6px 0 0 0' }}>
                What SalesMemory AI has learned from 6 historical deals — 3 won, 3 lost
              </p>
            </motion.div>
            <motion.div
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontFamily: "'Inter', sans-serif", color: '#1E40AF', fontWeight: 500, whiteSpace: 'nowrap' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.35, ease: 'easeOut' }}
            >
              <Brain size={16} color="#3B82F6" />
              Memory: 6 deals · 24 interactions stored
            </motion.div>
          </div>

          {/* ── 4 Stat Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, marginBottom: 48 }}>
            {STAT_CARDS.map((card, i) => {
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
              {LOSING_PATTERNS.map((p, i) => (
                <motion.div
                  key={p.title}
                  className="pattern-card-losing"
                  variants={patternVariant} custom={i} initial="hidden" animate="visible"
                  whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(239,68,68,0.1)', transition: { duration: 0.2 } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', flex: 1 }}>{p.title}</span>
                    <span style={{ background: '#FEF2F2', color: '#EF4444', borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 700, fontFamily: "'Inter', sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>{p.confidence}</span>
                  </div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '10px 0 0 0' }}>{p.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
                    <Clock size={14} color="#94A3B8" />
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontFamily: "'Inter', sans-serif" }}>Example: {p.example}</span>
                    <span className="badge-lost">{p.outcome}</span>
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
              {WINNING_PATTERNS.map((p, i) => (
                <motion.div
                  key={p.title}
                  className="pattern-card-winning"
                  variants={patternVariant} custom={i + 2} initial="hidden" animate="visible"
                  whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(16,185,129,0.1)', transition: { duration: 0.2 } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', flex: 1 }}>{p.title}</span>
                    <span style={{ background: '#F0FDF4', color: '#10B981', borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 700, fontFamily: "'Inter', sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>{p.confidence}</span>
                  </div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '10px 0 0 0' }}>{p.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
                    <Clock size={14} color="#94A3B8" />
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontFamily: "'Inter', sans-serif" }}>Example: {p.example}</span>
                    <span className="badge-won">{p.outcome}</span>
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
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: "'Inter', sans-serif" }}>Timeline of Deal Ingestion</span>
            </div>

            <div className="timeline-container">
              <motion.div
                className="timeline-line"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.65, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
              <div className="timeline-nodes">
                {TIMELINE_NODES.map((node, i) => (
                  <motion.div
                    key={node.company}
                    className="timeline-node"
                    variants={timelineVariant} custom={i} initial="hidden" animate="visible"
                  >
                    <div className={`timeline-dot ${node.type === 'lost' ? 'timeline-dot-red' : 'timeline-dot-blue'}`} />
                    <div className="timeline-label">{node.company}</div>
                    <div className="timeline-sub">{node.signals} SIGNALS</div>
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
              Memory compounds — every new deal improves pattern confidence
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
              onClick={() => navigate('/deal')}
              whileHover={{ scale: 1.05, y: -3, boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}
              whileTap={{ scale: 0.97 }}
            >
              Analyze New Deal <ArrowRight size={16} />
            </motion.button>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}
