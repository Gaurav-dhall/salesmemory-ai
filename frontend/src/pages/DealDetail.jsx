import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, CheckCircle, AlertTriangle,
  User, Users, Calendar, FileText, Loader2, AlertCircle,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useSidebar } from '../context/SidebarContext';
import { getDeal, analyzeDeal, updateDealMemory } from '../api';

// ── Animation Variants ────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function riskColor(level) {
  if (level === 'HIGH') return '#EF4444';
  if (level === 'MEDIUM') return '#F59E0B';
  return '#10B981';
}

function riskBg(level) {
  if (level === 'HIGH') return '#FEF2F2';
  if (level === 'MEDIUM') return '#FFFBEB';
  return '#F0FDF4';
}

function riskBorder(level) {
  if (level === 'HIGH') return '#FECACA';
  if (level === 'MEDIUM') return '#FDE68A';
  return '#BBF7D0';
}

function Skeleton({ w = '80%', h = 16, mb = 0 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 6,
      background: 'var(--color-border)',
      marginBottom: mb,
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DealDetail() {
  const navigate = useNavigate();
  const { deal_id } = useParams();
  const { collapsed } = useSidebar();
  const sidebarW = collapsed ? 64 : 240;

  // ── State ──────────────────────────────────────────────────────────────────
  const [deal, setDeal] = useState(null);
  const [loadingDeal, setLoadingDeal] = useState(true);
  const [dealError, setDealError] = useState(null);

  const [analysis, setAnalysis] = useState(null);
  const [analyzingDeal, setAnalyzingDeal] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [memoriesUsed, setMemoriesUsed] = useState(0);
  const [similarDeals, setSimilarDeals] = useState([]);
  const [memorySearching, setMemorySearching] = useState(true);
  const [showAllDeals, setShowAllDeals] = useState(false);

  // Form state
  const [notes, setNotes] = useState('');
  const [sentiment, setSentiment] = useState('neutral');
  const [competitor, setCompetitor] = useState('');
  const [callNumber, setCallNumber] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saved' | 'error' | null
  const analysisTriggered = useRef(false);

  // ── Fetch deal on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (!deal_id) {
      setDealError('No deal ID provided');
      setLoadingDeal(false);
      return;
    }
    setLoadingDeal(true);
    analysisTriggered.current = false;

    getDeal(deal_id)
      .then(data => {
        const d = data.deal;
        setDeal(d);
        // Pre-fill form with current state
        const latestCall = (d.calls || []).slice(-1)[0] || {};
        setCallNumber(String((d.calls || []).length + 1));
        setCompetitor((latestCall.competitor_mentions || []).join(', '));
        setLoadingDeal(false);
        // Trigger AI analysis with the deal data
        if (!analysisTriggered.current) {
          analysisTriggered.current = true;
          triggerAnalysis(d);
        }
      })
      .catch(err => {
        setDealError(err.message);
        setLoadingDeal(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal_id]);

  const triggerAnalysis = async (d) => {
    setAnalyzingDeal(true);
    setMemorySearching(true);
    setAnalysisError(null);
    const latestCall = (d.calls || []).slice(-1)[0] || {};
    const allRedFlags = [...new Set((d.calls || []).flatMap(c => c.red_flags || []))];
    const allCompetitors = [...new Set((d.calls || []).flatMap(c => c.competitor_mentions || []))];

    try {
      const [result] = await Promise.all([
        analyzeDeal({
          company: d.company,
          call_number: (d.calls || []).length,
          sentiment: latestCall.sentiment || 'neutral',
          cfo_engaged: !allRedFlags.some(f => f.toLowerCase().includes('cfo')),
          competitor_mentions: allCompetitors,
          red_flags: allRedFlags,
          notes: latestCall.notes || '',
        }),
        new Promise(resolve => setTimeout(resolve, 1500)),
      ]);
      setAnalysis(result.analysis);
      setMemoriesUsed(result.memories_used || 0);
      setSimilarDeals(result.similar_deals || []);
    } catch (err) {
      setAnalysisError(err.message);
    } finally {
      setAnalyzingDeal(false);
      setMemorySearching(false);
    }
  };

  // ── Save memory ────────────────────────────────────────────────────────────
  const handleSaveMemory = async () => {
    if (!notes.trim()) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      await updateDealMemory({
        deal_id,
        company: deal?.company || '',
        call_number: Number(callNumber) || (deal?.calls?.length || 0) + 1,
        notes,
        sentiment,
        competitors: competitor ? competitor.split(',').map(s => s.trim()).filter(Boolean) : [],
        action_taken: actionTaken,
        date: new Date().toISOString().split('T')[0],
      });
      setSaveStatus('saved');
      // Re-trigger analysis with updated info
      if (deal) triggerAnalysis({ ...deal });
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  // ── Derived from deal + analysis ───────────────────────────────────────────
  const latestCall = deal ? (deal.calls || []).slice(-1)[0] || {} : {};
  const allCompetitors = deal
    ? [...new Set((deal.calls || []).flatMap(c => c.competitor_mentions || []))]
    : [];
  const riskLevel = analysis?.RISK_LEVEL || 'MEDIUM';
  const warningFlags = analysis?.WARNING_FLAGS || [];
  const preBriefText = analysis?.PRE_CALL_BRIEF || '';
  const riskReason = analysis?.RISK_REASON || '';
  const recommendedAction = analysis?.RECOMMENDED_ACTION || '';

  // Split pre-call brief into bullet sentences
  const briefBullets = preBriefText
    ? preBriefText
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 10)
        .slice(0, 4)
    : [];

  return (
    <div className="app-layout">
      <Sidebar showBack={true} />
      <motion.div
        initial={false}
        animate={{ marginLeft: sidebarW }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{ flex: 1, background: 'var(--color-bg)', minHeight: '100vh' }}
      >
        <TopBar pageTitle={deal ? `${deal.company} — Deal Detail` : 'Deal Detail'} />
        <div className="page-content">

          {/* ── Error State ── */}
          {dealError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: 24, fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#DC2626' }}>
              <AlertCircle size={16} />
              {dealError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

            {/* ── LEFT COLUMN ── */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* CARD 1 — DEAL HEADER */}
              <motion.div
                className="card-static"
                style={{ padding: 28 }}
                variants={fadeUp} custom={0} initial="hidden" animate="visible"
              >
                {loadingDeal ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Skeleton w="40%" h={28} />
                    <Skeleton w="60%" h={18} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <Skeleton w={160} h={32} /><Skeleton w={160} h={32} /><Skeleton w={160} h={32} />
                    </div>
                  </div>
                ) : deal && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                          {deal.company}
                        </h1>
                        <span className="stage-pill" style={{ fontSize: 14 }}>Call {(deal.calls || []).length}</span>
                      </div>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: 'var(--color-text-secondary)', margin: '6px 0 0 0' }}>
                        {deal.contact}{deal.decision_maker && deal.decision_maker !== 'Unknown' ? ` — Decision Maker: ${deal.decision_maker}` : ''}
                      </p>
                      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                        {[
                          { icon: User,     text: `Decision Maker: ${deal.decision_maker || 'Unknown'}` },
                          ...(allCompetitors.length ? [{ icon: Users,    text: `Competitor: ${allCompetitors.join(', ')}` }] : []),
                          { icon: Calendar, text: `Duration: ${deal.duration_days} days` },
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
                      {/* Risk badge — from analysis or loading */}
                      {analyzingDeal ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-surface-alt)', borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif", color: 'var(--color-text-muted)' }}>
                          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...
                        </div>
                      ) : (
                        <motion.div
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: riskBg(riskLevel), color: riskColor(riskLevel), border: `1px solid ${riskBorder(riskLevel)}`, borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2, duration: 0.35, type: 'spring', stiffness: 200 }}
                        >
                          <AlertTriangle size={14} /> {riskLevel} RISK
                        </motion.div>
                      )}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>DEAL VALUE</div>
                        <motion.div
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 40, fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1.1, marginTop: 2 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        >
                          {deal.deal_value}
                        </motion.div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* SIMILAR DEALS FOUND IN MEMORY */}
              <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible" style={{ marginBottom: 0 }}>
                {memorySearching ? (
                  <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <span style={{ fontSize: 20 }}>🧠</span>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        Searching Hindsight memory for similar deals...
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: 'var(--color-border)', overflow: 'hidden', marginBottom: 12 }}>
                      <div style={{ height: '100%', borderRadius: 999, background: 'var(--color-accent)', width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: "'Inter', sans-serif", margin: 0 }}>
                      Scanning 21 past deals across 6 months...
                    </p>
                  </div>
                ) : (
                  <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 24, marginBottom: 0 }}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 20 }}>🧠</span>
                        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                          Similar Deals Found in Memory
                        </h2>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: "'Inter', sans-serif", margin: '0 0 0 30px' }}>
                        Hindsight recalled {similarDeals.length} past deal{similarDeals.length !== 1 ? 's' : ''} matching this situation
                      </p>
                    </div>

                    {similarDeals.length === 0 ? (
                      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', fontFamily: "'Inter', sans-serif", fontStyle: 'italic' }}>
                        No similar past deals found in memory yet. Load historical data first to enable pattern matching.
                      </p>
                    ) : (
                      <>
                        {similarDeals.slice(0, showAllDeals ? 5 : 3).map((deal, i) => {
                          const isWon = deal.status.toUpperCase().includes('WON');
                          const isLost = deal.status.toUpperCase().includes('LOST');
                          const borderColor = isWon ? '#10B981' : isLost ? '#EF4444' : '#3B82F6';
                          const badgeStyle = isWon
                            ? { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }
                            : isLost
                            ? { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }
                            : { background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' };

                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 + i * 0.09, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                              style={{
                                background: 'var(--color-bg)',
                                borderRadius: 10,
                                border: '1px solid var(--color-border)',
                                borderLeft: `4px solid ${borderColor}`,
                                padding: '14px 16px',
                                marginBottom: 10,
                                position: 'relative',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                  {deal.company}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 10px', fontFamily: "'Inter', sans-serif", letterSpacing: '0.05em', ...badgeStyle }}>
                                  {isWon ? 'WON' : isLost ? 'LOST' : 'ACTIVE'}
                                </span>
                              </div>
                              <p style={{
                                fontSize: 13,
                                color: 'var(--color-text-muted)',
                                fontFamily: "'Inter', sans-serif",
                                margin: 0,
                                lineHeight: 1.55,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}>
                                {deal.summary}
                              </p>
                              {deal.score != null && (
                                <div style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: "'Inter', sans-serif" }}>
                                  {Math.round(deal.score * 100)}% match
                                </div>
                              )}
                            </motion.div>
                          );
                        })}

                        {similarDeals.length > 3 && (
                          <button
                            onClick={() => setShowAllDeals(p => !p)}
                            style={{
                              width: '100%', padding: '8px 0', marginBottom: 12,
                              background: 'transparent', border: '1px dashed var(--color-border)',
                              borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                              color: 'var(--color-text-muted)', fontFamily: "'Inter', sans-serif",
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                          >
                            {showAllDeals ? '↑ See less' : `↓ See ${similarDeals.length - 3} more similar deal${similarDeals.length - 3 > 1 ? 's' : ''}`}
                          </button>
                        )}

                        <div style={{ paddingTop: 12, borderTop: '1px solid var(--color-border)', fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Inter', sans-serif" }}>
                          ⚡ Based on memory: {similarDeals.slice(0, showAllDeals ? 5 : 3).map(d => d.company).join(' · ')}
                          <span style={{ display: 'block', marginTop: 2, opacity: 0.7 }}>Powered by Hindsight semantic memory</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </motion.div>

              {/* CARD 2 — MEMORY RECALL */}
              <motion.div className="card-static" style={{ padding: 28 }} variants={fadeUp} custom={1} initial="hidden" animate="visible">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>🧠</span>
                    <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Memory Recall</h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-success)', fontSize: 14, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                    {analyzingDeal
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} color="var(--color-text-muted)" /><span style={{ color: 'var(--color-text-muted)' }}>Searching memory...</span></>
                      : <><CheckCircle size={16} color="#10B981" /> {memoriesUsed} memories recalled</>}
                  </div>
                </div>

                {/* Call history from the deal data */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {loadingDeal ? (
                    [1,2,3].map(i => (
                      <div key={i} className="memory-card" style={{ borderLeft: '3px solid var(--color-border)' }}>
                        <Skeleton w="50%" h={15} mb={8} />
                        <Skeleton w="90%" h={13} />
                      </div>
                    ))
                  ) : (deal?.calls || []).slice(-3).reverse().map((call, i) => (
                    <motion.div
                      key={call.call_number}
                      className="memory-card"
                      style={{ borderLeft: `3px solid ${call.sentiment === 'declining' ? '#EF4444' : call.sentiment === 'positive' ? '#10B981' : '#94A3B8'}` }}
                      variants={memoryCardVariant} custom={i} initial="hidden" animate="visible"
                      whileHover={{ x: 3, transition: { duration: 0.15 } }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: "'Inter', sans-serif" }}>
                          Call {call.call_number} — {call.date}
                        </span>
                        <span className={call.sentiment === 'declining' ? 'badge-lost' : call.sentiment === 'positive' ? 'badge-won' : 'badge-medium'} style={{ textTransform: 'capitalize' }}>
                          {call.sentiment}
                        </span>
                      </div>
                      <div className="memory-highlight">{call.notes}</div>
                      {call.red_flags?.length > 0 && (
                        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-danger)', fontFamily: "'Inter', sans-serif" }}>
                          ⚠️ {call.red_flags.join(' · ')}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* AI Insight box */}
                {!loadingDeal && (
                  <motion.div
                    className="memory-insight-box"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-memory-text)', marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      💡 Memory Insight
                    </div>
                    {analyzingDeal ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <Skeleton w="95%" h={13} />
                        <Skeleton w="80%" h={13} />
                      </div>
                    ) : (
                      <>
                        <p style={{ fontSize: 14, color: 'var(--color-memory-text)', lineHeight: 1.6, margin: 0, fontFamily: "'Inter', sans-serif" }}>
                          {riskReason || 'AI analysis complete.'}
                        </p>
                        {recommendedAction && (
                          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 10, marginBottom: 0, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                            → {recommendedAction}
                          </p>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>

              {/* CARD 3 — PRE-CALL BRIEF */}
              <motion.div className="card-static" style={{ padding: 28 }} variants={fadeUp} custom={2} initial="hidden" animate="visible">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                  <FileText size={20} color="var(--color-accent)" />
                  <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                    Pre-Call Brief — Call {deal ? (deal.calls || []).length + 1 : '...'}
                  </h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {analyzingDeal ? (
                    [1,2,3].map(i => (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none', alignItems: 'flex-start' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-border)', flexShrink: 0, marginTop: 6 }} />
                        <div style={{ flex: 1 }}><Skeleton w="90%" h={14} mb={6} /><Skeleton w="70%" h={14} /></div>
                      </div>
                    ))
                  ) : briefBullets.length > 0 ? (
                    briefBullets.map((text, i) => (
                      <motion.div
                        key={i}
                        style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: i < briefBullets.length - 1 ? '1px solid var(--color-border)' : 'none', alignItems: 'flex-start' }}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0, marginTop: 6 }} />
                        <p style={{ fontSize: 14, fontFamily: "'Inter', sans-serif", color: 'var(--color-text-primary)', lineHeight: 1.6, margin: 0 }}>{text}</p>
                      </motion.div>
                    ))
                  ) : (
                    <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontFamily: "'Inter', sans-serif" }}>
                      {analysisError ? `⚠️ Analysis failed: ${analysisError}` : 'Pre-call brief will appear after AI analysis completes.'}
                    </p>
                  )}
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
                {analyzingDeal ? (
                  [1,2,3].map(i => (
                    <div key={i} className="risk-item">
                      <Skeleton w="55%" h={14} mb={4} />
                      <Skeleton w="40%" h={12} />
                    </div>
                  ))
                ) : warningFlags.length > 0 ? (
                  warningFlags.map((flag, i) => (
                    <motion.div
                      key={flag}
                      className="risk-item"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="risk-indicator" style={{ background: i === 0 ? '#EF4444' : '#F59E0B' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: "'Inter', sans-serif" }}>{flag}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Inter', sans-serif", marginTop: 2 }}>AI detected pattern</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? '#EF4444' : '#F59E0B', fontFamily: "'Inter', sans-serif" }}>{i === 0 ? 'High' : 'Med'}</span>
                    </motion.div>
                  ))
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: "'Inter', sans-serif" }}>
                    {analysisError ? 'Analysis unavailable' : 'No risk flags detected.'}
                  </p>
                )}
              </motion.div>

              {/* UPDATE DEAL MEMORY */}
              <motion.div className="card-static" style={{ padding: 24 }} variants={slideInRight} custom={1} initial="hidden" animate="visible">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                  <span style={{ fontSize: 16 }}>📝</span>
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Update Deal Memory</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="form-label">Notes from Call {callNumber}</label>
                    <textarea
                      className="form-textarea"
                      rows={4}
                      placeholder="Enter key conversation points, sentiment, or new blockers..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Sentiment</label>
                    <select className="form-input" value={sentiment} onChange={e => setSentiment(e.target.value)}>
                      <option value="positive">Positive / Advancing</option>
                      <option value="neutral">Neutral / Stalled</option>
                      <option value="declining">Declining / At Risk</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="form-label">Competitor</label>
                      <input className="form-input" type="text" value={competitor} onChange={e => setCompetitor(e.target.value)} placeholder="Salesforce" />
                    </div>
                    <div>
                      <label className="form-label">Call Number</label>
                      <input className="form-input" type="text" value={callNumber} onChange={e => setCallNumber(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Action Taken</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Sent ROI deck, Scheduled follow-up..."
                      value={actionTaken}
                      onChange={e => setActionTaken(e.target.value)}
                    />
                  </div>

                  {/* Save status */}
                  <AnimatePresence>
                    {saveStatus && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                          padding: '8px 12px', borderRadius: 8, fontSize: 13, fontFamily: "'Inter', sans-serif",
                          background: saveStatus === 'saved' ? '#F0FDF4' : '#FEF2F2',
                          color: saveStatus === 'saved' ? '#15803D' : '#DC2626',
                          border: `1px solid ${saveStatus === 'saved' ? '#BBF7D0' : '#FECACA'}`,
                        }}
                      >
                        {saveStatus === 'saved' ? '✅ Saved to Hindsight memory' : '❌ Save failed — try again'}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', height: 48 }}
                    onClick={handleSaveMemory}
                    disabled={saving || !notes.trim()}
                    whileHover={saving ? {} : { scale: 1.02, y: -2 }}
                    whileTap={saving ? {} : { scale: 0.97 }}
                  >
                    {saving
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                      : '🧠 Save to Memory'}
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
