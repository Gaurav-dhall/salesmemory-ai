import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw, Filter, Search, Brain } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useSidebar } from '../context/SidebarContext';

const DEALS = [
  { id: 1, company: 'FinEdge Technologies', contact: 'Rajesh Kumar',   value: '$85,000',  stage: 'Call 4', risk: 'HIGH',   days: 94  },
  { id: 2, company: 'MetroBank',            contact: 'Sarah Chen',     value: '$92,000',  stage: 'Call 5', risk: 'HIGH',   days: 108 },
  { id: 3, company: 'RetailCo',             contact: 'James Wilson',   value: '$67,000',  stage: 'Call 3', risk: 'MEDIUM', days: 61  },
  { id: 4, company: 'CloudSoft Inc',        contact: 'Emily Torres',   value: '$95,000',  stage: 'Call 6', risk: 'LOW',    days: 72  },
  { id: 5, company: 'NexTech',              contact: 'Arjun Mehta',    value: '$78,000',  stage: 'Call 4', risk: 'LOW',    days: 55  },
  { id: 6, company: 'GlobalCorp',           contact: 'David Kim',      value: '$134,000', stage: 'Call 5', risk: 'MEDIUM', days: 89  },
];

function RiskBadge({ risk }) {
  const cls = risk === 'HIGH' ? 'badge badge-high' : risk === 'MEDIUM' ? 'badge badge-medium' : 'badge badge-low';
  return <span className={cls}>{risk}</span>;
}

// ── Animation variants ──────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const chipVariant = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.15 + i * 0.07, duration: 0.35, ease: 'easeOut' },
  }),
};

const tableRowVariant = {
  hidden: { opacity: 0, x: -16 },
  visible: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.3 + i * 0.055, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Dashboard() {
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Pipeline', value: '$454,000', color: 'var(--color-accent)' },
                { label: 'Active Deals',   value: '6',        color: 'var(--color-text-primary)' },
                { label: 'High Risk',      value: '2',        color: 'var(--color-danger)' },
              ].map((chip, i) => (
                <motion.div key={chip.label} className="stat-chip" variants={chipVariant} custom={i} initial="hidden" animate="visible">
                  <div className="stat-chip-label">{chip.label}</div>
                  <div className="stat-chip-value" style={{ color: chip.color }}>{chip.value}</div>
                </motion.div>
              ))}

              <motion.button
                className="btn-primary"
                style={{ flexShrink: 0 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45, duration: 0.35, ease: 'easeOut' }}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <RefreshCw size={14} />
                Load Historical Data
              </motion.button>
            </div>
          </div>

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
                  6 deals being monitored by AI
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <button className="icon-btn" aria-label="Filter"><Filter size={18} /></button>
                <button className="icon-btn" aria-label="Search"><Search size={18} /></button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="deals-table">
                <thead>
                  <tr>
                    <th>Company &amp; Contact</th>
                    <th>Deal Value</th>
                    <th>Stage</th>
                    <th>Risk Score</th>
                    <th>Days Active</th>
                    <th style={{ width: 140 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {DEALS.map((deal, i) => (
                    <motion.tr
                      key={deal.id}
                      variants={tableRowVariant}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      onClick={() => navigate('/deal')}
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
                          {deal.value}
                        </span>
                      </td>
                      <td><span className="stage-pill">{deal.stage}</span></td>
                      <td><RiskBadge risk={deal.risk} /></td>
                      <td>
                        <span style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontFamily: "'Inter', sans-serif" }}>
                          {deal.days} days
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="analyze-btn"
                          onClick={(e) => { e.stopPropagation(); navigate('/deal'); }}
                        >
                          Analyze Deal →
                        </button>
                      </td>
                    </motion.tr>
                  ))}
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
              Memory active — 6 historical deals loaded into Hindsight memory
            </p>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}
