import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import { BarChart2, Eye, EyeOff } from 'lucide-react'

/** Combine historical + predicted into one unified dataset for Recharts */
function buildChartData(historical, predicted) {
  const histData = historical.map(h => ({
    date: h.date,
    historical: h.price,
    upper: null,
    lower: null,
    mid: null,
    band: null,
  }))

  // Bridge point: last historical also starts the predicted line
  const bridge = {
    date: histData[histData.length - 1].date,
    historical: histData[histData.length - 1].historical,
    upper: histData[histData.length - 1].historical,
    lower: histData[histData.length - 1].historical,
    mid: histData[histData.length - 1].historical,
    band: null,
  }

  const predData = predicted.map(p => ({
    date: p.date,
    historical: null,
    upper: p.upper,
    lower: p.lower,
    mid: p.mid,
    band: [p.lower, p.upper],  // for Area band
  }))

  return [...histData, bridge, ...predData]
}

/** Thin the data for performance (show every Nth point) */
function thinData(data, targetPoints = 60) {
  if (data.length <= targetPoints) return data
  const step = Math.ceil(data.length / targetPoints)
  return data.filter((_, i) => i % step === 0 || i === data.length - 1)
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null

  const hist  = payload.find(p => p.dataKey === 'historical')
  const mid   = payload.find(p => p.dataKey === 'mid')
  const upper = payload.find(p => p.dataKey === 'upper')
  const lower = payload.find(p => p.dataKey === 'lower')

  return (
    <div style={{
      background: 'rgba(5, 13, 26, 0.95)',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      borderRadius: '10px',
      padding: '12px 14px',
      backdropFilter: 'blur(20px)',
      fontSize: '12px',
      minWidth: '160px',
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: 11, letterSpacing: '0.05em' }}>{label}</p>
      {hist?.value != null && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
          <span style={{ color: 'rgba(99, 179, 237, 0.9)' }}>Historical</span>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontFamily: "'Space Grotesk', monospace" }}>
            ₹{Number(hist.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}
      {mid?.value != null && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
            <span style={{ color: 'rgba(168, 85, 247, 0.9)' }}>Target</span>
            <span style={{ color: '#e2e8f0', fontWeight: 700, fontFamily: "'Space Grotesk', monospace" }}>
              ₹{Number(mid.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {upper?.value != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
              <span style={{ color: 'rgba(0, 255, 136, 0.8)' }}>Upper</span>
              <span style={{ color: 'rgba(0,255,136,0.9)', fontFamily: "'Space Grotesk', monospace" }}>
                ₹{Number(upper.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          {lower?.value != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ color: 'rgba(255, 68, 85, 0.8)' }}>Lower</span>
              <span style={{ color: 'rgba(255,68,85,0.9)', fontFamily: "'Space Grotesk', monospace" }}>
                ₹{Number(lower.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function PredictionChart({ prediction }) {
  const { historical, predicted, currentPrice, ticker } = prediction
  const [showBand, setShowBand] = useState(true)
  const [showMid, setShowMid]   = useState(true)

  const allData = buildChartData(historical, predicted)
  const chartData = thinData(allData, 65)

  // Domain padding
  const allPrices = chartData.flatMap(d => [d.historical, d.upper, d.lower].filter(Boolean))
  const minP = Math.min(...allPrices) * 0.97
  const maxP = Math.max(...allPrices) * 1.03

  // Show every ~10th label
  const tickInterval = Math.ceil(chartData.length / 10)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-panel p-5 sm:p-6 gradient-border"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)' }}>
            <BarChart2 size={14} color="var(--neon-blue)" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Price Forecast Chart</h2>
            <p className="text-[10px] text-[var(--text-muted)]">
              {historical.length} days historical  ·  {predicted.length} days predicted
            </p>
          </div>
        </div>
        {/* Toggle controls */}
        <div className="flex items-center gap-2">
          <ToggleChip
            active={showBand}
            onClick={() => setShowBand(v => !v)}
            color="rgba(56,189,248,0.5)"
            label="Confidence Band"
          />
          <ToggleChip
            active={showMid}
            onClick={() => setShowMid(v => !v)}
            color="rgba(168,85,247,0.8)"
            label="Target Line"
          />
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              {/* Historical line gradient */}
              <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="rgba(56,189,248,0.25)" />
                <stop offset="95%" stopColor="rgba(56,189,248,0)" />
              </linearGradient>
              {/* Prediction band gradient */}
              <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="rgba(99,102,241,0.2)" />
                <stop offset="95%" stopColor="rgba(99,102,241,0.04)" />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 6"
              stroke="rgba(56, 189, 248, 0.06)"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={{ stroke: 'rgba(56,189,248,0.12)' }}
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Inter, sans-serif' }}
              interval={tickInterval}
            />
            <YAxis
              domain={[minP, maxP]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: "'Space Grotesk', monospace" }}
              tickFormatter={v => `₹${v >= 100000 ? (v/100000).toFixed(1)+'L' : v >= 1000 ? (v/1000).toFixed(0)+'K' : v.toFixed(0)}`}
              width={68}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Reference line: current price */}
            <ReferenceLine
              y={currentPrice}
              stroke="rgba(251,191,36,0.5)"
              strokeDasharray="8 4"
              label={{
                value: `Now ₹${currentPrice >= 100000 ? (currentPrice/100000).toFixed(1)+'L' : currentPrice >= 1000 ? (currentPrice/1000).toFixed(1)+'K' : currentPrice.toFixed(0)}`,
                fill: 'rgba(251,191,36,0.8)',
                fontSize: 10,
                position: 'insideTopRight',
                fontFamily: "'Space Grotesk', monospace",
              }}
            />

            {/* Prediction confidence band (Area) */}
            {showBand && (
              <Area
                type="monotone"
                dataKey="upper"
                stroke="rgba(0,255,136,0.4)"
                strokeWidth={1}
                strokeDasharray="4 3"
                fill="url(#bandGrad)"
                dot={false}
                activeDot={false}
                legendType="none"
              />
            )}
            {showBand && (
              <Area
                type="monotone"
                dataKey="lower"
                stroke="rgba(255,68,85,0.4)"
                strokeWidth={1}
                strokeDasharray="4 3"
                fill="rgba(0,0,0,0)"
                dot={false}
                activeDot={false}
                legendType="none"
              />
            )}

            {/* Historical line */}
            <Line
              type="monotone"
              dataKey="historical"
              stroke="rgba(56,189,248,0.9)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--neon-blue)', stroke: 'var(--navy-900)', strokeWidth: 2 }}
              name="Historical"
            />

            {/* Predicted mid line */}
            {showMid && (
              <Line
                type="monotone"
                dataKey="mid"
                stroke="rgba(168,85,247,0.9)"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                activeDot={{ r: 4, fill: 'var(--neon-purple)', stroke: 'var(--navy-900)', strokeWidth: 2 }}
                name="Prediction"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 mt-4 pt-4"
        style={{ borderTop: '1px solid rgba(56,189,248,0.08)' }}>
        <LegendItem color="rgba(56,189,248,0.9)" dash={false} label="Historical Price" />
        <LegendItem color="rgba(168,85,247,0.9)" dash={true} label="Predicted Target" />
        <LegendItem color="rgba(0,255,136,0.6)" dash={true} label="Upper Bound" />
        <LegendItem color="rgba(255,68,85,0.6)" dash={true} label="Lower Bound" />
        <LegendItem color="rgba(251,191,36,0.7)" dash={true} label="Current Price" />
      </div>
    </motion.div>
  )
}

function ToggleChip({ active, onClick, color, label }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer"
      style={{
        background: active ? `${color.replace('0.5', '0.12').replace('0.8', '0.12')}` : 'rgba(15,32,64,0.5)',
        border: `1px solid ${active ? color : 'rgba(56,189,248,0.1)'}`,
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
      }}
    >
      {active ? <Eye size={10} /> : <EyeOff size={10} />}
      {label}
    </button>
  )
}

function LegendItem({ color, dash, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center" style={{ width: 24 }}>
        {dash ? (
          <svg width="24" height="4">
            <line x1="0" y1="2" x2="24" y2="2" stroke={color} strokeWidth="2" strokeDasharray="5 3" />
          </svg>
        ) : (
          <div className="h-0.5 w-6 rounded-full" style={{ background: color }} />
        )}
      </div>
      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}
