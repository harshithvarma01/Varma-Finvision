import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, TrendingUp, Hash, Sparkles, AlertCircle, Building2, RefreshCw } from 'lucide-react'
import { searchStocks } from '../utils/yahooFinance.js'

// Popular Indian + Global stocks for quick-pick
const QUICK_PICKS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  { symbol: 'TCS.NS',      name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'INFY.NS',     name: 'Infosys' },
  { symbol: 'AAPL',        name: 'Apple Inc.' },
  { symbol: 'NVDA',        name: 'NVIDIA Corp.' },
]

export default function InputPanel({ inputs, onChange, onGenerate, loading, error, lastUpdated }) {
  const [query, setQuery]           = useState(inputs.stockName || '')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching]   = useState(false)
  const [open, setOpen]             = useState(false)
  const debounceRef                 = useRef(null)
  const wrapperRef                  = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Debounce search
  const handleQueryChange = useCallback((val) => {
    setQuery(val)
    // Reset selection if user types after picking
    if (!val.trim()) {
      setSuggestions([])
      onChange('ticker', '')
      onChange('stockName', '')
      setOpen(false)
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const results = await searchStocks(val)
      setSuggestions(results)
      setSearching(false)
      setOpen(results.length > 0)
    }, 350)
  }, [onChange])

  const selectStock = useCallback((symbol, name) => {
    setQuery(name)
    setSuggestions([])
    setOpen(false)
    onChange('ticker', symbol)
    onChange('stockName', name)
  }, [onChange])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputs.ticker) onGenerate()
  }

  const isSelected = !!inputs.ticker

  return (
    <motion.section
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel gradient-border p-5 sm:p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-end gap-5">
        {/* ── Search input with autocomplete ── */}
        <div className="flex-1 min-w-0 relative" ref={wrapperRef}>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            <span className="flex items-center gap-1.5">
              <Search size={11} />
              Stock Name or Symbol
            </span>
          </label>

          {/* Input wrapper */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {searching
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                    <RefreshCw size={14} color="var(--neon-blue)" />
                  </motion.div>
                : <Building2 size={14} color={isSelected ? 'var(--neon-blue)' : 'var(--text-muted)'} />
              }
            </div>
            <input
              id="stock-search-input"
              type="text"
              className="input-field pl-9 pr-4 text-base font-semibold"
              placeholder="e.g. Reliance Industries, Apple, HDFC Bank…"
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setOpen(true)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck={false}
            />
            {/* Ticker badge */}
            {isSelected && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[11px] font-bold font-mono tracking-widest"
                style={{ background: 'rgba(56,189,248,0.15)', color: 'var(--neon-blue)', border: '1px solid rgba(56,189,248,0.3)' }}>
                {inputs.ticker}
              </span>
            )}
          </div>

          {/* ── Autocomplete dropdown ── */}
          <AnimatePresence>
            {open && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 mt-1 w-full max-w-xl rounded-xl overflow-hidden shadow-2xl"
                style={{
                  background: 'rgba(5, 13, 26, 0.98)',
                  border: '1px solid rgba(56,189,248,0.25)',
                  backdropFilter: 'blur(24px)',
                }}
              >
                {suggestions.map((s, i) => (
                  <button
                    key={s.symbol}
                    onMouseDown={() => selectStock(s.symbol, s.shortname || s.longname)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all cursor-pointer group"
                    style={{
                      borderBottom: i < suggestions.length - 1 ? '1px solid rgba(56,189,248,0.07)' : 'none',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Symbol chip */}
                    <span className="flex-shrink-0 w-20 text-center px-1.5 py-0.5 rounded text-[11px] font-bold font-mono tracking-wider truncate"
                      style={{ background: 'rgba(56,189,248,0.12)', color: 'var(--neon-blue)', border: '1px solid rgba(56,189,248,0.2)' }}>
                      {s.symbol}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {s.shortname || s.longname}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] truncate">
                        {s.exchange} · {s.quoteType}
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick-pick chips */}
          <div className="flex flex-wrap gap-2 mt-2.5">
            {QUICK_PICKS.map(q => (
              <button
                key={q.symbol}
                onClick={() => selectStock(q.symbol, q.name)}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide transition-all cursor-pointer"
                style={{
                  background: inputs.ticker === q.symbol
                    ? 'rgba(56,189,248,0.2)'
                    : 'rgba(56,189,248,0.06)',
                  border: inputs.ticker === q.symbol
                    ? '1px solid rgba(56,189,248,0.55)'
                    : '1px solid rgba(56,189,248,0.15)',
                  color: inputs.ticker === q.symbol ? 'var(--neon-blue)' : 'var(--text-secondary)',
                }}
              >
                {q.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px self-stretch bg-[rgba(56,189,248,0.1)]" />

        {/* Days slider */}
        <div className="w-full lg:w-56">
          <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            <span className="flex items-center gap-1.5">
              <TrendingUp size={11} />
              Prediction Days
            </span>
          </label>
          <div className="flex items-center gap-3">
            <input
              id="days-slider"
              type="range"
              min="7"
              max="2000"
              step="1"
              value={inputs.days}
              onChange={e => onChange('days', Number(e.target.value))}
              className="flex-1"
              style={{
                background: `linear-gradient(to right, var(--neon-blue) 0%, var(--neon-blue) ${((inputs.days - 7) / 1993) * 100}%, rgba(22,42,84,1) ${((inputs.days - 7) / 1993) * 100}%, rgba(22,42,84,1) 100%)`
              }}
            />
            <div className="min-w-[48px] text-right">
              <span className="font-mono-nums font-bold text-[var(--neon-blue)] text-lg">{inputs.days}</span>
              <span className="text-[10px] text-[var(--text-muted)] ml-0.5">d</span>
            </div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[var(--text-muted)]">7d</span>
            <span className="text-[10px] text-[var(--text-muted)]">500d</span>
            <span className="text-[10px] text-[var(--text-muted)]">1000d</span>
            <span className="text-[10px] text-[var(--text-muted)]">2000d</span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px self-stretch bg-[rgba(56,189,248,0.1)]" />

        {/* Quantity */}
        <div className="w-full lg:w-44">
          <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            <span className="flex items-center gap-1.5">
              <Hash size={11} />
              Shares
            </span>
          </label>
          <input
            id="quantity-input"
            type="number"
            className="input-field font-mono-nums font-bold text-base"
            placeholder="e.g. 100"
            min="1"
            max="100000"
            value={inputs.quantity}
            onChange={e => onChange('quantity', Math.max(1, Number(e.target.value)))}
            onKeyDown={e => e.key === 'Enter' && inputs.ticker && onGenerate()}
          />
          <p className="text-[10px] text-[var(--text-muted)] mt-1.5">Shares owned / buying</p>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px self-stretch bg-[rgba(56,189,248,0.1)]" />

        {/* CTA Button */}
        <div className="lg:w-48">
          <GenerateButton onClick={onGenerate} loading={loading} disabled={!inputs.ticker} />
          {lastUpdated && (
            <p className="text-[10px] text-[var(--text-muted)] mt-1.5 text-center">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--neon-green)] mr-1 animate-pulse" />
              Live · Updated {lastUpdated}
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 flex items-center gap-2 text-sm text-[var(--neon-red)]"
        >
          <AlertCircle size={14} />
          {error}
        </motion.div>
      )}
    </motion.section>
  )
}

function GenerateButton({ onClick, loading, disabled }) {
  return (
    <motion.button
      id="generate-btn"
      onClick={onClick}
      disabled={loading || disabled}
      whileHover={{ scale: (loading || disabled) ? 1 : 1.03 }}
      whileTap={{ scale: (loading || disabled) ? 1 : 0.97 }}
      className="w-full h-11 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 relative overflow-hidden cursor-pointer disabled:cursor-not-allowed transition-opacity"
      style={{
        background: (loading || disabled)
          ? 'rgba(56,189,248,0.15)'
          : 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 60%, #a855f7 100%)',
        color: disabled && !loading ? 'rgba(255,255,255,0.35)' : '#fff',
        boxShadow: (loading || disabled) ? 'none' : '0 0 24px rgba(56,189,248,0.45), 0 4px 15px rgba(99,102,241,0.4)',
        border: (loading || disabled) ? '1px solid rgba(56,189,248,0.2)' : 'none',
      }}
    >
      {!loading && !disabled && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />
      )}
      <Sparkles size={15} />
      {loading ? 'Fetching Live Data…' : disabled ? 'Select a Stock First' : 'Generate Prediction'}
    </motion.button>
  )
}
