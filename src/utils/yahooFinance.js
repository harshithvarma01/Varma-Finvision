/**
 * yahooFinance.js
 * Fetches real stock data from Yahoo Finance via the Vite dev proxy (/api/yahoo).
 * All prices are converted to INR using a live USD/INR exchange rate.
 */

// ─── Exchange rate ────────────────────────────────────────────────────────────
let cachedINRRate = null
let rateTimestamp = 0

function getYahooUrl(path) {
  if (import.meta.env.PROD) {
    return `/api/proxy?url=${encodeURIComponent('https://query1.finance.yahoo.com' + path)}`;
  }
  return `/api/yahoo${path}`;
}

function getYfSearchUrl(path) {
  if (import.meta.env.PROD) {
    return `/api/proxy?url=${encodeURIComponent('https://query2.finance.yahoo.com' + path)}`;
  }
  return `/api/yfsearch${path}`;
}

async function getUSDINRRate() {
  const now = Date.now()
  // Cache for 10 minutes
  if (cachedINRRate && now - rateTimestamp < 10 * 60 * 1000) return cachedINRRate

  try {
    // Use Yahoo Finance to get USD/INR pair
    const url = getYahooUrl('/v8/finance/chart/USDINR=X?interval=1d&range=1d')
    const res = await fetch(url)
    if (!res.ok) throw new Error('Rate fetch failed')
    const json = await res.json()
    const rate = json?.chart?.result?.[0]?.meta?.regularMarketPrice
    if (rate && rate > 0) {
      cachedINRRate = rate
      rateTimestamp = now
      return rate
    }
  } catch (e) {
    console.warn('USD/INR rate fetch failed, using fallback:', e)
  }
  // Fallback rate (approximate)
  return 83.5
}

// ─── Stock autocomplete search ────────────────────────────────────────────────
export async function searchStocks(query) {
  if (!query || query.trim().length < 1) return []
  try {
    // Yahoo Finance v1 search — response has quotes directly at top level
    const url = getYfSearchUrl(`/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&enableFuzzyQuery=true&enableCb=true&enableNavLinks=false&enableEnhancedTriviaQuery=false`)
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      }
    })
    if (!res.ok) {
      console.warn('YF search HTTP', res.status)
      return []
    }
    const json = await res.json()

    // The API returns quotes in different shapes depending on version
    // Shape A: { quotes: [...] }  (most common)
    // Shape B: { finance: { result: [{ quotes: [...] }] } }
    let quotes = []
    if (Array.isArray(json?.quotes)) {
      quotes = json.quotes
    } else if (Array.isArray(json?.finance?.result?.[0]?.quotes)) {
      quotes = json.finance.result[0].quotes
    }

    return quotes
      .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'MUTUALFUND')
      .map(q => ({
        symbol: q.symbol,
        shortname: q.shortname || q.longname || q.symbol,
        longname: q.longname || q.shortname || q.symbol,
        exchange: q.exchange || q.exchDisp || '',
        quoteType: q.quoteType,
      }))
  } catch (e) {
    console.error('Stock search error:', e)
    return []
  }
}

// ─── Main data fetcher ────────────────────────────────────────────────────────
/**
 * Fetches historical + current price data, builds live predictions in INR.
 * @param {string} ticker  - Yahoo Finance ticker symbol (e.g. "AAPL", "RELIANCE.NS")
 * @param {string} name    - Company display name
 * @param {number} days    - Number of days to predict forward
 * @param {number} quantity - Shares owned
 */
export async function fetchLivePrediction(ticker, name, days, quantity) {
  // Parallel fetch: historical chart + quote summary
  const [rate, chartJson, quoteJson] = await Promise.all([
    getUSDINRRate(),
    fetchChart(ticker),
    fetchQuote(ticker),
  ])

  const isINR = ticker.endsWith('.NS') || ticker.endsWith('.BO')
  const fxRate = isINR ? 1 : rate  // Indian stocks already in INR

  const chartResult = chartJson?.chart?.result?.[0]
  if (!chartResult) throw new Error(`No chart data found for "${ticker}"`)

  const meta = chartResult.meta
  const timestamps = chartResult.timestamp ?? []
  const closes = chartResult.indicators?.quote?.[0]?.close ?? []

  // Build clean historical array (skip nulls)
  const rawHistory = []
  for (let i = 0; i < timestamps.length; i++) {
    if (closes[i] != null) {
      rawHistory.push({
        ts: timestamps[i],
        price: closes[i] * fxRate,
      })
    }
  }

  if (rawHistory.length < 5) throw new Error(`Insufficient data for "${ticker}"`)

  // Format as date labels
  const historical = rawHistory.map(d => ({
    date: formatDate(d.ts * 1000),
    price: parseFloat(d.price.toFixed(2)),
    type: 'historical',
  }))

  // Use the last daily OHLCV close as the reference price.
  // This matches what NSE/Groww report as the official closing price.
  // meta.regularMarketPrice can be a live intraday tick that differs from the close.
  const lastClose = rawHistory[rawHistory.length - 1].price
  const currentPrice = parseFloat(lastClose.toFixed(2))

  // ─── Prediction model ─────────────────────────────────────────────────────
  // Use trailing 30-day price data to estimate daily drift & volatility
  const recent = rawHistory.slice(-30)
  const returns = []
  for (let i = 1; i < recent.length; i++) {
    returns.push((recent[i].price - recent[i - 1].price) / recent[i - 1].price)
  }
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((a, b) => a + (b - meanReturn) ** 2, 0) / returns.length
  const dailyVol = Math.sqrt(variance)

  // Monte-Carlo-style prediction with confidence band
  const predicted = []
  let midPrice = currentPrice
  const bandGrowthRate = dailyVol * 1.5  // widen with vol

  // Simple seeded noise using closing prices as deterministic seed
  let noiseState = Math.round(currentPrice * 1000) % 2147483647

  function nextNoise() {
    noiseState = (noiseState * 1664525 + 1013904223) & 0x7fffffff
    return noiseState / 0x7fffffff  // [0, 1)
  }

  for (let i = 1; i <= days; i++) {
    const noise = (nextNoise() - 0.5) * 2 * dailyVol * midPrice
    midPrice = Math.max(midPrice + meanReturn * midPrice + noise, 0.01)

    const spreadFactor = bandGrowthRate * Math.sqrt(i)
    const upper = parseFloat((midPrice * (1 + spreadFactor)).toFixed(2))
    const lower = parseFloat((midPrice * (1 - spreadFactor * 0.7)).toFixed(2))
    const mid   = parseFloat(midPrice.toFixed(2))

    const futTs = Date.now() + i * 86400 * 1000
    predicted.push({
      date: formatDate(futTs),
      upper,
      lower,
      mid,
      type: 'predicted',
    })
  }

  // ─── Summary metrics ──────────────────────────────────────────────────────
  const lastPredicted  = predicted[predicted.length - 1]
  const projectedUpper = lastPredicted.upper
  const projectedLower = lastPredicted.lower
  const projectedMid   = lastPredicted.mid
  const priceDiff      = parseFloat((projectedMid - currentPrice).toFixed(2))
  const totalPnL       = parseFloat((priceDiff * quantity).toFixed(2))
  const pctChange      = parseFloat(((priceDiff / currentPrice) * 100).toFixed(2))

  let signal = 'HOLD'
  if (pctChange > 4)       signal = 'BUY'
  else if (pctChange < -2) signal = 'SELL'

  // RSI (14-period)
  const rsi = computeRSI(rawHistory.map(d => d.price), 14)

  // MACD (simplified)
  const ema12 = computeEMA(rawHistory.map(d => d.price), 12)
  const ema26 = computeEMA(rawHistory.map(d => d.price), 26)
  const macd  = parseFloat((ema12 - ema26).toFixed(2))

  // Volume
  const quoteResult = quoteJson?.quoteResponse?.result?.[0]
  const rawVol = quoteResult?.regularMarketVolume ?? meta.regularMarketVolume ?? 0
  const volume = rawVol >= 1e7 ? `${(rawVol / 1e7).toFixed(1)}Cr`
               : rawVol >= 1e5 ? `${(rawVol / 1e5).toFixed(1)}L`
               : rawVol >= 1e3 ? `${(rawVol / 1e3).toFixed(0)}K`
               : String(rawVol)

  // 52-week hi/lo
  const hi52 = quoteResult?.fiftyTwoWeekHigh
  const lo52 = quoteResult?.fiftyTwoWeekLow
  const confidence = Math.min(92, Math.max(52, Math.round(70 - dailyVol * 500)))

  return {
    ticker,
    companyName: name,
    signal,
    confidence,
    currentPrice,
    projectedUpper,
    projectedLower,
    projectedMid,
    priceDiff,
    pctChange,
    totalPnL,
    quantity,
    days,
    rsi,
    macd,
    volume,
    hi52: hi52 ? parseFloat((hi52 * fxRate).toFixed(2)) : null,
    lo52: lo52 ? parseFloat((lo52 * fxRate).toFixed(2)) : null,
    dailyVol: parseFloat((dailyVol * 100).toFixed(2)),
    historical,
    predicted,
    isINR,
    lastUpdated: new Date().toLocaleTimeString('en-IN', { hour12: false }),
  }
}

// ─── Chart fetch (5y daily) ───────────────────────────────────────────────────
async function fetchChart(ticker) {
  const url = getYahooUrl(`/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=10y`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Chart fetch failed: ${res.status}`)
  return res.json()
}

// ─── Quote summary ────────────────────────────────────────────────────────────
async function fetchQuote(ticker) {
  try {
    const url = getYahooUrl(`/v7/finance/quote?symbols=${encodeURIComponent(ticker)}`)
    const res = await fetch(url)
    if (!res.ok) return {}
    return res.json()
  } catch {
    return {}
  }
}

// ─── Technical helpers ────────────────────────────────────────────────────────
function computeRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50
  let gains = 0, losses = 0
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1]
    if (diff > 0) gains += diff
    else losses -= diff
  }
  const avgGain = gains / period
  const avgLoss = losses / period
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return Math.round(100 - 100 / (1 + rs))
}

function computeEMA(prices, period) {
  const k = 2 / (period + 1)
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k)
  }
  return ema
}

function formatDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}
