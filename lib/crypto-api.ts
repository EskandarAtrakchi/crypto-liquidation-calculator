export interface CryptoData {
  id: number
  name: string
  symbol: string
  rank: number
  quotes: {
    USD: {
      price: number
      volume_24h: number
      market_cap: number
      percentage_change_1h: number | null
      percentage_change_24h: number | null
      percentage_change_7d: number | null
    }
  }
  last_updated: number
}

export interface ApiResponse {
  data: Record<string, CryptoData>
}

// Popular crypto mappings for better UX
export const POPULAR_CRYPTOS = [
  { id: "1", symbol: "BTC", name: "Bitcoin" },
  { id: "1027", symbol: "ETH", name: "Ethereum" },
  { id: "2010", symbol: "ADA", name: "Cardano" },
  { id: "825", symbol: "USDT", name: "Tether" },
  { id: "1839", symbol: "BNB", name: "BNB" },
  { id: "5426", symbol: "SOL", name: "Solana" },
  { id: "52", symbol: "XRP", name: "XRP" },
  { id: "74", symbol: "DOGE", name: "Dogecoin" },
  { id: "3408", symbol: "USDC", name: "USD Coin" },
  { id: "5805", symbol: "AVAX", name: "Avalanche" },
]

// Cache for API responses
let cachedData: CryptoData[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

export async function fetchCryptoData(): Promise<CryptoData[]> {
  // Return cached data if still fresh
  if (cachedData && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedData
  }

  try {
    const response = await fetch("https://api.alternative.me/v2/ticker/")

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: ApiResponse = await response.json()

    // Convert the data object to an array and sort by rank
    const cryptoArray = Object.values(data.data)
      .filter((crypto) => crypto && crypto.quotes && crypto.quotes.USD) // Filter out invalid data
      .sort((a, b) => (a.rank || 999999) - (b.rank || 999999))

    // Update cache
    cachedData = cryptoArray
    cacheTimestamp = Date.now()

    return cryptoArray
  } catch (error) {
    console.error("Error fetching crypto data:", error)

    // Return cached data if available, even if stale
    if (cachedData) {
      console.warn("Using stale cached data due to fetch error")
      return cachedData
    }

    throw error
  }
}

export async function fetchCryptoBySymbol(symbol: string): Promise<CryptoData | null> {
  try {
    const allData = await fetchCryptoData()
    const crypto = allData.find((coin) => coin.symbol.toLowerCase() === symbol.toLowerCase())
    return crypto || null
  } catch (error) {
    console.error("Error fetching crypto by symbol:", error)
    return null
  }
}

export async function searchCryptoByName(query: string, limit = 50): Promise<CryptoData[]> {
  try {
    const allData = await fetchCryptoData()
    const queryLower = query.toLowerCase().trim()

    if (!queryLower) return allData.slice(0, limit)

    const filtered = allData.filter(
      (coin) =>
        coin.name.toLowerCase().includes(queryLower) ||
        coin.symbol.toLowerCase().includes(queryLower) ||
        coin.symbol.toLowerCase().startsWith(queryLower),
    )

    return filtered.slice(0, limit)
  } catch (error) {
    console.error("Error searching crypto:", error)
    return []
  }
}

export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || isNaN(price)) {
    return "N/A"
  }

  if (price >= 1) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  } else {
    return price.toFixed(6)
  }
}

export function formatPercentage(percentage: number | null | undefined): string {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return "N/A"
  }
  return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`
}

export function formatLargeNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) {
    return "N/A"
  }

  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
  return `$${num.toLocaleString()}`
}

export function safeGetValue<T>(value: T | null | undefined, fallback: T): T {
  return value !== null && value !== undefined ? value : fallback
}

// Clear cache function for manual refresh
export function clearCache(): void {
  cachedData = null
  cacheTimestamp = 0
}
