/**
 * Generates realistic mock prediction data for a given ticker.
 * Prices are seeded deterministically from the ticker string so the
 * same ticker always produces consistent (plausible) numbers.
 */

/**
 * Well-known stock price ranges for realistic seeding.
 */
const KNOWN_STOCKS = {
  AAPL: { base: 182, vol: 0.018, name: 'Apple Inc.' },
  TSLA: { base: 195, vol: 0.04,  name: 'Tesla Inc.' },
  MSFT: { base: 410, vol: 0.015, name: 'Microsoft Corp.' },
  GOOGL: { base: 172, vol: 0.02,  name: 'Alphabet Inc.' },
  AMZN: { base: 185, vol: 0.022, name: 'Amazon.com Inc.' },
  NVDA: { base: 875, vol: 0.045, name: 'NVIDIA Corp.' },
  META: { base: 490, vol: 0.028, name: 'Meta Platforms' },
  NFLX: { base: 625, vol: 0.032, name: 'Netflix Inc.' },
  AMD:  { base: 165, vol: 0.038, name: 'Advanced Micro Devices' },
  COIN: { base: 220, vol: 0.055, name: 'Coinbase Global' },
  SPY:  { base: 510, vol: 0.012, name: 'SPDR S&P 500 ETF' },
  QQQ:  { base: 437, vol: 0.016, name: 'Invesco QQQ Trust' },
}

/** Simple deterministic hash from a string → integer */
function hashStr(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/** Seeded pseudo-random number generator (mulberry32) */
function seededRng(seed) {
  let s = seed >>> 0
  return () => {
    s += 0x6d2b79f5
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateMockPrediction(ticker, days, quantity) {
  const seed = hashStr(ticker + days)
  const rng  = seededRng(seed)

  const known = KNOWN_STOCKS[ticker.toUpperCase()]
  const basePrice = known ? known.base : 50 + (hashStr(ticker) % 450)
  const dailyVol  = known ? known.vol  : 0.02 + (rng() * 0.03)
  const companyName = known ? known.name : `${ticker} Corp.`

  // Trend bias: slightly bullish, can vary by seed
  const trendBias = (rng() - 0.42) * 0.003  // -0.0013 to +0.0017 per day

  // ---------- Historical data (90 days back) ----------
  const histDays = 90
  const historical = []
  let price = basePrice * (0.88 + rng() * 0.24)

  for (let i = histDays; i >= 0; i--) {
    const dayLabel = pastDate(i)
    const change = (rng() - 0.5) * 2 * dailyVol * price
    price = Math.max(price + change, 1)
    historical.push({
      date: dayLabel,
      price: parseFloat(price.toFixed(2)),
      type: 'historical',
    })
  }

  const lastHistPrice = historical[historical.length - 1].price

  // ---------- Predicted data ----------
  // Confidence band widens as we go further into the future
  const predicted = []
  let midPrice = lastHistPrice
  const bandGrowthRate = 0.008  // 0.8% per day extra spread

  for (let i = 1; i <= days; i++) {
    const dayLabel = futureDate(i)
    const drift = trendBias * midPrice
    const noise = (rng() - 0.5) * 2 * dailyVol * midPrice
    midPrice = Math.max(midPrice + drift + noise, 1)

    const spreadFactor = bandGrowthRate * i
    const upper = parseFloat((midPrice * (1 + spreadFactor)).toFixed(2))
    const lower = parseFloat((midPrice * (1 - spreadFactor * 0.7)).toFixed(2))
    const mid   = parseFloat(midPrice.toFixed(2))

    predicted.push({
      date: dayLabel,
      upper,
      lower,
      mid,
      type: 'predicted',
    })
  }

  // ---------- Final prediction values ----------
  const lastPredicted   = predicted[predicted.length - 1]
  const projectedUpper  = lastPredicted.upper
  const projectedLower  = lastPredicted.lower
  const projectedMid    = lastPredicted.mid
  const priceDiff       = projectedMid - lastHistPrice
  const totalPnL        = parseFloat((priceDiff * quantity).toFixed(2))
  const pctChange       = parseFloat(((priceDiff / lastHistPrice) * 100).toFixed(2))

  // ---------- Signal ----------
  let signal
  if (pctChange > 4)        signal = 'BUY'
  else if (pctChange < -2)  signal = 'SELL'
  else                      signal = 'HOLD'

  // ---------- Confidence & extra metrics ----------
  const confidence = Math.min(95, Math.max(55, Math.round(75 + (rng() - 0.5) * 30)))
  const rsi        = Math.round(30 + rng() * 50)
  const macd       = parseFloat(((rng() - 0.5) * 4).toFixed(2))
  const volume     = Math.round((500000 + rng() * 9500000) / 1000) + 'K'

  return {
    ticker,
    companyName,
    signal,
    confidence,
    currentPrice: lastHistPrice,
    projectedUpper,
    projectedLower,
    projectedMid,
    priceDiff: parseFloat(priceDiff.toFixed(2)),
    pctChange,
    totalPnL,
    quantity,
    days,
    rsi,
    macd,
    volume,
    historical,
    predicted,
  }
}

function pastDate(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function futureDate(daysAhead) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
