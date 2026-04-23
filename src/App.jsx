import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/Header.jsx'
import InputPanel from './components/InputPanel.jsx'
import Dashboard from './components/Dashboard.jsx'
import { fetchLivePrediction } from './utils/yahooFinance.js'

const REFRESH_INTERVAL_MS = 60 * 1000  // auto-refresh every 60 seconds

export default function App() {
  const [inputs, setInputs] = useState({
    ticker: '',
    stockName: '',
    days: 30,
    quantity: 10,
  })
  const [loading, setLoading]     = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [error, setError]         = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const refreshTimerRef           = useRef(null)

  const handleChange = useCallback((field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }))
    setError('')
  }, [])

  const handleGenerate = useCallback(async (silent = false) => {
    if (!inputs.ticker?.trim()) {
      setError('Please search and select a stock first.')
      return
    }
    if (!silent) {
      setLoading(true)
      setPrediction(null)
      setError('')
    }

    try {
      const result = await fetchLivePrediction(
        inputs.ticker.trim(),
        inputs.stockName || inputs.ticker,
        inputs.days,
        inputs.quantity
      )
      setPrediction(result)
      setLastUpdated(result.lastUpdated)
      setError('')
    } catch (err) {
      console.error(err)
      if (!silent) {
        setError(`Failed to fetch data for "${inputs.ticker}": ${err.message}. Check the ticker and try again.`)
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [inputs])

  // Auto-refresh live data every 60 seconds when a prediction is visible
  useEffect(() => {
    clearInterval(refreshTimerRef.current)
    if (prediction && inputs.ticker) {
      refreshTimerRef.current = setInterval(() => {
        handleGenerate(true)  // silent refresh (no spinner)
      }, REFRESH_INTERVAL_MS)
    }
    return () => clearInterval(refreshTimerRef.current)
  }, [prediction, inputs.ticker, handleGenerate])

  return (
    <div className="min-h-screen bg-mesh bg-dots flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col gap-6 px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto w-full">
        <InputPanel
          inputs={inputs}
          onChange={handleChange}
          onGenerate={() => handleGenerate(false)}
          loading={loading}
          error={error}
          lastUpdated={lastUpdated}
        />
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-6"
            >
              <LoadingSpinner />
              <p className="text-[var(--text-secondary)] text-sm tracking-widest uppercase">
                Fetching live market data…
              </p>
              <p className="text-[var(--text-muted)] text-xs">
                Pulling real-time Yahoo Finance data for {inputs.stockName || inputs.ticker}
              </p>
            </motion.div>
          )}
          {!loading && prediction && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <Dashboard prediction={prediction} inputs={inputs} />
            </motion.div>
          )}
          {!loading && !prediction && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-4 text-center"
            >
              <EmptyState />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-[var(--neon-blue)] border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-3 rounded-full border-2 border-[var(--neon-purple)] border-b-transparent"
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="w-4 h-4 rounded-full bg-[var(--neon-blue)]"
        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        style={{ boxShadow: '0 0 16px rgba(56,189,248,0.9)' }}
      />
    </div>
  )
}

function EmptyState() {
  return (
    <>
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-24 h-24 rounded-full glass-panel flex items-center justify-center mb-2"
        style={{ border: '1px solid rgba(56,189,248,0.25)' }}
      >
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <path d="M4 32 L14 18 L22 24 L30 10 L40 20" stroke="rgba(56,189,248,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="40" cy="20" r="3" fill="rgba(56,189,248,0.8)" />
          <path d="M30 10 L36 10 L36 16" stroke="rgba(0,255,136,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
      <h2 className="text-xl font-semibold text-[var(--text-secondary)]">No Prediction Yet</h2>
      <p className="text-[var(--text-muted)] text-sm max-w-xs">
        Search for any stock by <span className="text-[var(--neon-blue)]">full company name</span> or ticker symbol, set your parameters, and click <span className="text-[var(--neon-blue)]">Generate Prediction</span> for live AI forecasts in <span className="text-[var(--neon-green)]">₹ INR</span>.
      </p>
    </>
  )
}
