import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  Brain,
  Plus,
  Sparkles,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';

const EXPANDED_W = 240;
const COLLAPSED_W = 64;

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
  { label: 'Patterns', path: '/patterns', icon: Brain },
];

export default function Sidebar({ showBack = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? COLLAPSED_W : EXPANDED_W }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{
        background: 'var(--color-sidebar)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        overflow: 'hidden',
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
      }}
    >
      {/* ── Logo Row ── */}
      {collapsed ? (
        /* Collapsed: just a centered expand button */
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 72, borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.18, duration: 0.2 }}
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            style={{
              background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8,
              width: 36, height: 36, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: '#94A3B8',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            <PanelLeftOpen size={16} />
          </motion.button>
        </div>
      ) : (
        /* Expanded: logo + brand + collapse button */
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '20px 16px 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          minHeight: 72,
        }}>
          {/* Brand icon */}
          <img
            src="/background-removed-background-removed.png"
            alt="Logo"
            onClick={() => navigate('/dashboard')}
            style={{
              width: 40, height: 40,
              flexShrink: 0, cursor: 'pointer',
            }}
          />

          {/* Brand text */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ flex: 1, overflow: 'hidden' }}
          >
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
              SalesMemory <span style={{ color: '#3B82F6' }}>AI</span>
            </div>
            
          </motion.div>

          {/* Collapse button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            onClick={() => setCollapsed(true)}
            aria-label="Collapse sidebar"
            style={{
              background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8,
              width: 30, height: 30, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: '#64748B', flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            <PanelLeftClose size={15} />
          </motion.button>
        </div>
      )}

      {/* ── Back link (deal detail only) ── */}
      <AnimatePresence initial={false}>
        {showBack && !collapsed && (
          <motion.button
            key="back"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 40 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 20px',
              fontSize: 13,
              color: '#64748B',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'Inter, sans-serif',
              overflow: 'hidden',
              width: '100%',
            }}
          >
            <ChevronLeft size={14} />
            ← Back to Pipeline
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Nav Items ── */}
      <nav style={{ flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <motion.button
              key={path}
              onClick={() => navigate(path)}
              whileHover={{ backgroundColor: 'rgba(30,41,59,1)' }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? 0 : 12,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '0' : '0 24px',
                height: 44,
                fontSize: 14,
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
                color: isActive ? '#ffffff' : '#94A3B8',
                background: isActive ? 'rgba(30,41,59,1)' : 'transparent',
                borderLeft: isActive ? '4px solid #3B82F6' : '4px solid transparent',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                width: '100%',
                cursor: 'pointer',
                transition: 'color 200ms ease',
                position: 'relative',
              }}
              title={collapsed ? label : ''}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{ overflow: 'hidden', whiteSpace: 'nowrap', display: 'block' }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        padding: collapsed ? '16px 8px 24px 8px' : '16px 16px 24px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        transition: 'padding 0.3s ease',
      }}>
        <AnimatePresence initial={false} mode="wait">
          {collapsed ? (
            <motion.div
              key="collapsed-footer"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1D4ED8, #7C3AED)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                margin: '0 auto',
              }}
              title="Powered by Hindsight"
              onClick={() => window.open('https://hindsight.vectorize.io', '_blank')}
            >
              <Sparkles size={14} color="white" />
            </motion.div>
          ) : (
            <motion.button
              key="expanded-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hindsight-pill"
              onClick={() => window.open('https://hindsight.vectorize.io', '_blank')}
            >
              <Sparkles size={14} />
              Powered by Hindsight
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
