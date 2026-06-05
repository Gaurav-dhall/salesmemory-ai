import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain, CheckCircle, AlertTriangle,
  User, Users, Calendar, FileText,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useSidebar } from '../context/SidebarContext';

const MEMORY_ITEMS = [
  { company: 'FinEdge Technologies', outcome: 'LOST', highlight: 'CFO disengaged by Call 3 — no ROI answer prepared',                              borderColor: '#EF4444' },
  { company: 'MetroBank',            outcome: 'LOST', highlight: '3 competitor mentions without counter-strategy — timeline slipped twice',         borderColor: '#EF4444' },
  { company: 'NexTech',              outcome: 'WON',  highlight: 'CFO invited to demo by Call 2 — weekly touchpoints maintained',                   borderColor: '#10B981' },
];

const RISK_ITEMS = [
  { title: 'CFO Not Engaged',              subtitle: 'Pattern match: Ghosting',   level: 'High', color: '#EF4444' },
  { title: 'Competitor Escalation Needed', subtitle: 'Active mentions detected',  level: 'Med',  color: '#F59E0B' },
  { title: 'Timeline Risk',               subtitle: '8 days since last touch',   level: 'Med',  color: '#F59E0B' },
];

// ── Animation Variants ────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const slideInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: (i = 0) => ({
    opacity: 1, x: 0,
    transition: { delay: 0.2 + i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const slideInRight = {
  hidden: { opacity: 0, x: 24 },
  visible: (i = 0) => ({
    opacity: 1, x: 0,
    transition: { delay: 0.25 + i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const memoryCardVariant = {
  hidden: { opacity: 0, x: -16 },
  visible: (i = 0) => ({
    opacity: 1, x: 0,
    transition: { delay: 0.35 + i * 0.09, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function DealDetail() {
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const sidebarW = collapsed ? 64 : 240;

  return (
    <div className="app-layout">
      <Sidebar showBack={true} />
      <motion.div
        initial={false}
        animate={{ marginLeft: sidebarW }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{ flex: 1, background: 'var(--color-bg)', minHeight: '100vh' }}
      >
        <TopBar pageTitle="GlobalCorp Deal Detail" />
        <div className="page-content">
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

            {/* ── LEFT COLUMN ── */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* CARD 1 — DEAL HEADER */}
              <motion.div
                className="card-static"
                style={{ padding: 28 }}
                variants={fadeUp} custom={0} initial="hidden" animate="visible"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                        GlobalCorp
                      </h1>
                      <span className="stage-pill" style={{ fontSize: 14 }}>Call 5</span>
                    </div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: 'var(--color-text-secondary)', margin: '6px 0 0 0' }}>
                      David Kim — VP of Engineering
                    </p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                      {[
                        { icon: User,     text: 'Decision Maker: CFO Sarah Wong' },
                        { icon: Users,    text: 'Competitor: Salesforce' },
                        { icon: Calendar, text: 'Last Contact: 8 days ago' },
                      ].map(({ icon: Icon, text }, i) => (
                        <motion.span key={text} className="meta-chip"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.07, duration: 0.3 }}
                        >
                          <Icon size={14} color="#94A3B8" />{text}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, marginLeft: 24 }}>
                    <motion.div
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.35, type: 'spring', stiffness: 200 }}
                    >
                      <AlertTriangle size={14} /> HIGH RISK
                    </motion.div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>DEAL VALUE</div>
                      <motion.div
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 40, fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1.1, marginTop: 2 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      >
                        $134,000
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* CARD 2 — MEMORY RECALL */}
              <motion.div className="card-static" style={{ padding: 28 }} variants={fadeUp} custom={1} initial="hidden" animate="visible">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>🧠</span>
                    <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Memory Recall</h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-success)', fontSize: 14, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                    <CheckCircle size={16} color="#10B981" /> Analysis complete
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {MEMORY_ITEMS.map((item, i) => (
                    <motion.div
                      key={item.company}
                      className="memory-card"
                      style={{ borderLeft: `3px solid ${item.borderColor}` }}
                      variants={memoryCardVariant} custom={i} initial="hidden" animate="visible"
                      whileHover={{ x: 3, transition: { duration: 0.15 } }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: "'Inter', sans-serif" }}>{item.company}</span>
                        {item.outcome === 'LOST' ? <span className="badge-lost">{item.outcome}</span> : <span className="badge-won">{item.outcome}</span>}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Inter', sans-serif" }}>Highlight:</span>
                      </div>
                      <div className="memory-highlight">{item.highlight}</div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  className="memory-insight-box"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1E40AF', marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>💡 Memory Insight</div>
                  <p style={{ fontSize: 14, color: '#1E40AF', lineHeight: 1.6, margin: 0, fontFamily: "'Inter', sans-serif" }}>
                    CFO Sarah Wong has not appeared since Call 2. In 4 past deals with this pattern, we lost 3 of them. Immediate action required.
                  </p>
                  <p style={{ fontSize: 12, color: '#64748B', marginTop: 10, marginBottom: 0, fontFamily: "'Inter', sans-serif" }}>
                    Based on memory: FinEdge Technologies (LOST), MetroBank (LOST), NexTech (WON)
                  </p>
                </motion.div>
              </motion.div>

              {/* CARD 3 — PRE-CALL BRIEF */}
              <motion.div className="card-static" style={{ padding: 28 }} variants={fadeUp} custom={2} initial="hidden" animate="visible">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                  <FileText size={20} color="var(--color-accent)" />
                  <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                    Pre-Call Brief – Call 6
                  </h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[
                    <>Prioritize presenting the <strong>3rd Year ROI projection</strong> immediately to address Sarah Wong's probable concerns regarding TCO.</>,
                    <>Mention the <strong>GlobalCorp security audit</strong> — previous successful deals at this stage used this as a bridge to re-engage the CFO.</>,
                    <>Directly ask David Kim for a <strong>15-minute 1-on-1 with Sarah</strong> before Call 7 to mitigate the 'Ghosting' pattern detected by SalesMemory AI.</>,
                  ].map((text, i, arr) => (
                    <motion.div
                      key={i}
                      style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none', alignItems: 'flex-start' }}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0, marginTop: 6 }} />
                      <p style={{ fontSize: 14, fontFamily: "'Inter', sans-serif", color: 'var(--color-text-primary)', lineHeight: 1.6, margin: 0 }}>{text}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* RISK ASSESSMENT */}
              <motion.div className="card-static" style={{ padding: 24 }} variants={slideInRight} custom={0} initial="hidden" animate="visible">
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif", marginBottom: 16 }}>
                  RISK ASSESSMENT
                </div>
                {RISK_ITEMS.map((item, i) => (
                  <motion.div
                    key={item.title}
                    className="risk-item"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="risk-indicator" style={{ background: item.color }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: "'Inter', sans-serif" }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Inter', sans-serif", marginTop: 2 }}>{item.subtitle}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: item.color, fontFamily: "'Inter', sans-serif" }}>{item.level}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* UPDATE DEAL MEMORY */}
              <motion.div className="card-static" style={{ padding: 24 }} variants={slideInRight} custom={1} initial="hidden" animate="visible">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                  <span style={{ fontSize: 16 }}>📝</span>
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Update Deal Memory</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label className="form-label">Notes from Call 5</label>
                    <textarea className="form-textarea" rows={5} placeholder="Enter key conversation points, sentiment, or new blockers..." />
                  </div>
                  <div>
                    <label className="form-label">Sentiment</label>
                    <select className="form-input" defaultValue="neutral">
                      <option value="positive">Positive / Advancing</option>
                      <option value="neutral">Neutral / Stalled</option>
                      <option value="declining">Declining / At Risk</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="form-label">Competitor</label>
                      <input className="form-input" type="text" defaultValue="Salesforce" />
                    </div>
                    <div>
                      <label className="form-label">Call Number</label>
                      <input className="form-input" type="text" defaultValue="5" />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Action Taken</label>
                    <input className="form-input" type="text" placeholder="e.g. Sent ROI deck, Scheduled follow-up..." />
                  </div>
                  <motion.button
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', height: 48 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Save to Memory 🧠
                  </motion.button>
                  <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Inter', sans-serif", margin: 0 }}>
                    Stored in Hindsight — improves future recommendations
                  </p>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
