import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Shield } from 'lucide-react'

const SIGNAL_CONFIG = {
  BUY: {
    label: 'BUY',
    color: 'var(--neon-green)',
    dimColor: 'rgba(0, 255, 136, 0.12)',
    borderColor: 'rgba(0, 255, 136, 0.35)',
    glowClass: 'glow-green',
    textGlow: 'text-glow-green',
    Icon: TrendingUp,
    sublabel: 'Strong Bullish Signal',
    emoji: '🚀',
  },
  SELL: {
    label: 'SELL',
    color: 'var(--neon-red)',
    dimColor: 'rgba(255, 68, 85, 0.12)',
    borderColor: 'rgba(255, 68, 85, 0.35)',
    glowClass: 'glow-red',
    textGlow: 'text-glow-red',
    Icon: TrendingDown,
    sublabel: 'Bearish Reversal Signal',
    emoji: '📉',
  },
  HOLD: {
    label: 'HOLD',
    color: 'var(--neon-gold)',
    dimColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
    glowClass: 'glow-gold',
    textGlow: 'text-glow-gold',
    Icon: Minus,
    sublabel: 'Neutral Consolidation',
    emoji: '⚖️',
  },
}

export default function ActionBadge({ prediction }) {
  const { signal, confidence, ticker, companyName, currentPrice } = prediction
  const cfg = SIGNAL_CONFIG[signal]
  const Icon = cfg.Icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 180 }}
      className="glass-panel flex flex-col items-center justify-center gap-4 p-6 min-h-[260px] relative overflow-hidden"
      style={{ border: `1px solid ${cfg.borderColor}` }}
    >
      {/* Background glow blob */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 60%, ${cfg.dimColor} 0%, transparent 70%)`,
        }}
      />

      {/* Ticker tag */}
      <div className="relative flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }} />
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--text-secondary)]">
          {ticker}
        </span>
        <span className="text-[10px] text-[var(--text-muted)]">— {companyName}</span>
      </div>

      {/* Main badge */}
      <div className="relative flex flex-col items-center badge-pulse">
        {/* Icon background ring */}
        <div className="relative mb-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: cfg.dimColor, border: `1px solid ${cfg.borderColor}` }}
          >
            <Icon size={28} color={cfg.color} strokeWidth={2.5} />
          </div>
          {/* Outer pulsing ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `1px solid ${cfg.color}` }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <span
          className={`font-bold tracking-wider ${cfg.textGlow}`}
          style={{ fontSize: '3.5rem', lineHeight: 1, color: cfg.color, fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {cfg.label}
        </span>
        <span className="text-xs text-[var(--text-muted)] mt-1 tracking-wide">{cfg.sublabel}</span>
      </div>

      {/* Confidence bar */}
      <div className="relative w-full">
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
            <Shield size={10} />
            AI Confidence
          </div>
          <span className="text-xs font-bold font-mono-nums" style={{ color: cfg.color }}>
            {confidence}%
          </span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'rgba(30,58,110,0.8)' }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            style={{
              background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
              boxShadow: `0 0 8px ${cfg.color}`,
            }}
          />
        </div>
      </div>

      {/* Current price */}
      <div className="relative flex items-baseline gap-1">
        <span className="text-xs text-[var(--text-muted)]">Current:</span>
        <span className="font-mono-nums font-bold text-lg text-[var(--text-primary)]">
          ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </motion.div>
  )
}
