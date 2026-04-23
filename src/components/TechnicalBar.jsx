import React from 'react'
import { motion } from 'framer-motion'
import { Activity, Gauge, Volume2, TrendingUp } from 'lucide-react'

function TechCard({ icon: Icon, label, value, subtitle, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-panel flex items-center gap-4 p-4 flex-1 min-w-[160px] relative overflow-hidden"
      style={{ border: '1px solid rgba(56,189,248,0.1)' }}
    >
      <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}40` }}>
        <Icon size={16} color={color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-0.5">{label}</div>
        <div className="font-mono-nums font-bold text-base" style={{ color }}>{value}</div>
        {subtitle && <div className="text-[10px] text-[var(--text-muted)] truncate">{subtitle}</div>}
      </div>
    </motion.div>
  )
}

function RsiGauge({ rsi }) {
  // RSI: <30 oversold (green), 30-70 neutral (blue), >70 overbought (red)
  let color = 'var(--neon-blue)'
  let label = 'Neutral'
  if (rsi < 30) { color = 'var(--neon-green)'; label = 'Oversold' }
  if (rsi > 70) { color = 'var(--neon-red)';   label = 'Overbought' }

  const pct = rsi / 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass-panel flex items-center gap-4 p-4 flex-1 min-w-[180px]"
      style={{ border: '1px solid rgba(56,189,248,0.1)' }}
    >
      <div className="relative w-12 h-12 flex-shrink-0">
        {/* SVG arc gauge */}
        <svg viewBox="0 0 48 48" width="48" height="48">
          {/* Track */}
          <circle cx="24" cy="24" r="18"
            fill="none"
            stroke="rgba(30,58,110,0.8)"
            strokeWidth="5"
            strokeDasharray="94 113"
            strokeDashoffset="-28"
            strokeLinecap="round"
          />
          {/* Fill */}
          <motion.circle
            cx="24" cy="24" r="18"
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={`${pct * 94} 113`}
            strokeDashoffset="-28"
            strokeLinecap="round"
            initial={{ strokeDasharray: '0 113' }}
            animate={{ strokeDasharray: `${pct * 94} 113` }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
          <text x="24" y="27" textAnchor="middle" fill={color}
            fontSize="10" fontFamily="'Space Grotesk', monospace" fontWeight="700">
            {rsi}
          </text>
        </svg>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-0.5">RSI (14)</div>
        <div className="font-bold text-base" style={{ color }}>{rsi}</div>
        <div className="text-[10px] text-[var(--text-muted)]">{label}</div>
      </div>
    </motion.div>
  )
}

export default function TechnicalBar({ prediction }) {
  const { rsi, macd, volume, pctChange } = prediction
  const macdColor = macd >= 0 ? 'var(--neon-green)' : 'var(--neon-red)'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="flex flex-col"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-px h-4" style={{ background: 'var(--neon-blue)', boxShadow: '0 0 6px var(--neon-blue)' }} />
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Technical Indicators</span>
      </div>
      <div className="flex flex-wrap gap-4">
        <RsiGauge rsi={rsi} />
        <TechCard
          icon={Activity}
          label="MACD"
          value={`${macd >= 0 ? '+' : ''}${macd}`}
          subtitle={macd >= 0 ? 'Bullish divergence' : 'Bearish divergence'}
          color={macdColor}
          delay={0.15}
        />
        <TechCard
          icon={Volume2}
          label="Volume"
          value={volume}
          subtitle="30-day avg"
          color="var(--neon-blue)"
          delay={0.2}
        />
        <TechCard
          icon={TrendingUp}
          label="Expected Return"
          value={`${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(2)}%`}
          subtitle={`Over ${prediction.days} days`}
          color={pctChange >= 0 ? 'var(--neon-green)' : 'var(--neon-red)'}
          delay={0.25}
        />
        <TechCard
          icon={Gauge}
          label="Volatility"
          value={`${(Math.abs(prediction.projectedUpper - prediction.projectedLower) / prediction.currentPrice * 100).toFixed(1)}%`}
          subtitle="Price range spread"
          color="var(--neon-purple)"
          delay={0.3}
        />
      </div>
    </motion.div>
  )
}
