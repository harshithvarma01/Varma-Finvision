import React from 'react'
import { motion } from 'framer-motion'
import { Activity, Cpu, Zap } from 'lucide-react'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full" style={{
      background: 'rgba(5, 13, 26, 0.85)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(56, 189, 248, 0.12)',
    }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          {/* Icon mark */}
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[var(--neon-blue)] to-[var(--neon-purple)] opacity-20 blur-sm" />
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--neon-blue)] to-[var(--neon-purple)] flex items-center justify-center"
              style={{ boxShadow: '0 0 16px rgba(56,189,248,0.5)' }}>
              <Activity size={18} color="#fff" />
            </div>
          </div>
          {/* Brand text */}
          <div className="flex flex-col leading-none">
            <span className="font-bold text-xl tracking-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Varma
              <span className="bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-purple)] bg-clip-text text-transparent"> FinVision</span>
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)]">
              Stock Intelligence
            </span>
          </div>
        </motion.div>

        {/* Center pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{
            background: 'rgba(56, 189, 248, 0.06)',
            border: '1px solid rgba(56, 189, 248, 0.18)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--neon-green)]"
            style={{ boxShadow: '0 0 6px rgba(0,255,136,0.9)' }} />
          <span className="text-xs text-[var(--text-secondary)] tracking-wide">Markets Live</span>
        </motion.div>

        {/* Right actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          {/* AI badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{
              background: 'rgba(168,85,247,0.1)',
              border: '1px solid rgba(168,85,247,0.25)',
            }}>
            <Cpu size={13} color="var(--neon-purple)" />
            <span className="text-xs font-medium" style={{ color: 'var(--neon-purple)' }}>AI v2.4</span>
          </div>

          {/* Powered badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(168,85,247,0.15) 100%)',
              border: '1px solid rgba(56,189,248,0.25)',
            }}>
            <Zap size={13} color="var(--neon-blue)" />
            <span className="text-xs font-semibold text-[var(--neon-blue)]">PRO</span>
          </div>
        </motion.div>
      </div>
    </header>
  )
}
