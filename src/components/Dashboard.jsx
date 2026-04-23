import React from 'react'
import { motion } from 'framer-motion'
import ActionBadge from './ActionBadge.jsx'
import MetricCards from './MetricCards.jsx'
import PredictionChart from './PredictionChart.jsx'
import TechnicalBar from './TechnicalBar.jsx'

export default function Dashboard({ prediction, inputs }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Row 1: Badge + Metrics */}
      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        <ActionBadge prediction={prediction} />
        <MetricCards prediction={prediction} />
      </div>

      {/* Row 2: Chart */}
      <PredictionChart prediction={prediction} />

      {/* Row 3: Technical indicators */}
      <TechnicalBar prediction={prediction} />
    </div>
  )
}
