import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown, DollarSign, BarChart2, Target, Percent } from 'lucide-react'

function MetricCard({ delay, icon: Icon, label, value, subvalue, accentColor, dimColor, borderColor }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-panel p-5 flex flex-col gap-3 relative overflow-hidden"
      style={{ border: `1px solid ${borderColor}` }}
    >
      {/* Background tint */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 80% 0%, ${dimColor} 0%, transparent 65%)` }}
      />
      {/* Icon */}
      <div className="relative flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: dimColor, border: `1px solid ${borderColor}` }}>
          <Icon size={15} color={accentColor} />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
      </div>
      {/* Value */}
      <div className="relative">
        <div className="font-mono-nums font-bold text-2xl leading-none" style={{ color: accentColor }}>
          {value}
        </div>
        {subvalue && (
          <div className="text-xs text-[var(--text-muted)] mt-1">{subvalue}</div>
        )}
      </div>
    </motion.div>
  )
}

function inr(val) {
  return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function MetricCards({ prediction }) {
  const {
    projectedUpper,
    projectedLower,
    projectedMid,
    priceDiff,
    pctChange,
    totalPnL,
    quantity,
    days,
  } = prediction

  const isProfit = priceDiff >= 0
  const pnlColor = isProfit ? 'var(--neon-green)' : 'var(--neon-red)'
  const pnlDim   = isProfit ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,85,0.1)'
  const pnlBorder = isProfit ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,85,0.3)'

  const pnlFormatted = (isProfit ? '+' : '') + '₹' + Math.abs(totalPnL).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const pctFormatted = (pctChange >= 0 ? '+' : '') + pctChange.toFixed(2) + '%'

  const cards = [
    {
      icon: ArrowUp,
      label: 'Projected Upper Bound',
      value: inr(projectedUpper),
      subvalue: `+${((projectedUpper - prediction.currentPrice) / prediction.currentPrice * 100).toFixed(1)}% vs. today`,
      accentColor: 'var(--neon-green)',
      dimColor: 'rgba(0,255,136,0.08)',
      borderColor: 'rgba(0,255,136,0.2)',
      delay: 0.1,
    },
    {
      icon: ArrowDown,
      label: 'Projected Lower Bound',
      value: inr(projectedLower),
      subvalue: `${((projectedLower - prediction.currentPrice) / prediction.currentPrice * 100).toFixed(1)}% vs. today`,
      accentColor: 'var(--neon-red)',
      dimColor: 'rgba(255,68,85,0.08)',
      borderColor: 'rgba(255,68,85,0.2)',
      delay: 0.2,
    },
    {
      icon: Target,
      label: 'Price Target (Mid)',
      value: inr(projectedMid),
      subvalue: `Δ ${(priceDiff >= 0 ? '+' : '')}₹${Math.abs(priceDiff).toFixed(2)} per share`,
      accentColor: 'var(--neon-blue)',
      dimColor: 'rgba(56,189,248,0.08)',
      borderColor: 'rgba(56,189,248,0.2)',
      delay: 0.3,
    },
    {
      icon: isProfit ? DollarSign : BarChart2,
      label: `Total P&L (${quantity} shares × ${days}d)`,
      value: pnlFormatted,
      subvalue: `${pctFormatted} return  ·  ${isProfit ? '📈 Profit' : '📉 Loss'}`,
      accentColor: pnlColor,
      dimColor: pnlDim,
      borderColor: pnlBorder,
      delay: 0.4,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <MetricCard key={i} {...card} />
      ))}
    </div>
  )
}
