import React from 'react';
import { Search, Bell, HelpCircle, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function TopBar({ pageTitle }) {
  const { dark, toggle } = useTheme();

  return (
    <div className="top-bar">
      {/* Left: page title or search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {pageTitle && (
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}>
            {pageTitle}
          </h2>
        )}
        <div className="search-bar" style={pageTitle ? { marginLeft: 8 } : {}}>
          <Search size={16} color="var(--color-text-muted)" />
          <input type="text" placeholder="Search insights..." aria-label="Search insights" />
        </div>
      </div>

      {/* Right: actions */}
      <div className="top-bar-right">
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button className="icon-btn" aria-label="Help">
          <HelpCircle size={18} />
        </button>

        {/* ── Dark / Light Toggle ── */}
        <motion.button
          onClick={toggle}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            position: 'relative',
            width: 52,
            height: 28,
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
            background: dark
              ? 'linear-gradient(135deg, #1E3A5F, #312E81)'
              : 'linear-gradient(135deg, #FDE68A, #FCA5A5)',
            boxShadow: dark
              ? '0 0 0 1px rgba(96,165,250,0.2), inset 0 1px 2px rgba(0,0,0,0.4)'
              : '0 0 0 1px rgba(251,191,36,0.3), inset 0 1px 2px rgba(0,0,0,0.1)',
            transition: 'background 300ms ease, box-shadow 300ms ease',
          }}
          whileTap={{ scale: 0.93 }}
        >
          {/* Track icons */}
          <span style={{
            position: 'absolute',
            left: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 10,
            opacity: dark ? 1 : 0.3,
            transition: 'opacity 200ms ease',
            pointerEvents: 'none',
          }}>
            🌙
          </span>
          <span style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 10,
            opacity: dark ? 0.3 : 1,
            transition: 'opacity 200ms ease',
            pointerEvents: 'none',
          }}>
            ☀️
          </span>

          {/* Thumb */}
          <motion.div
            layout
            animate={{ x: dark ? 26 : 2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'absolute',
              top: 3,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {dark ? (
                <motion.span
                  key="moon"
                  initial={{ rotate: -30, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 30, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Moon size={12} color="#312E81" strokeWidth={2.5} />
                </motion.span>
              ) : (
                <motion.span
                  key="sun"
                  initial={{ rotate: 30, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -30, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Sun size={12} color="#D97706" strokeWidth={2.5} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.button>

        <div className="avatar" aria-label="User Avatar">A</div>
      </div>
    </div>
  );
}
