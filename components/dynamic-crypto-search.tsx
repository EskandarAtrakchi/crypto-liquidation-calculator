"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Star,
  Activity,
  DollarSign,
  BarChart3,
  Clock,
  Filter,
  ArrowUpDown,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react"
import { fetchCryptoData, formatPrice, formatPercentage, formatLargeNumber, safeGetValue } from "@/lib/crypto-api"
import type { CryptoData } from "@/lib/crypto-api"
import { useToast } from "@/hooks/use-toast"

export function DynamicCryptoSearch() {
  const [allCryptoData, setAllCryptoData] = useState<CryptoData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"rank" | "price" | "change24h" | "marketCap" | "volume">("rank")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [filterBy, setFilterBy] = useState<"all" | "gainers" | "losers" | "favorites">("all")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [displayLimit, setDisplayLimit] = useState(50)
  const { toast } = useToast()

  // Fetch all crypto data from API
  const fetchAllCryptoData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await fetchCryptoData()

      // Filter out any invalid data
      const validData = data.filter((crypto) => {
        return (
          crypto &&
          crypto.symbol &&
          crypto.name &&
          crypto.quotes &&
          crypto.quotes.USD &&
          typeof crypto.quotes.USD.price === "number" &&
          !isNaN(crypto.quotes.USD.price)
        )
      })

      setAllCryptoData(validData)
      setLastUpdated(new Date())

      toast({
        title: "📊 Market Data Loaded",
        description: `${validData.length} cryptocurrencies available for search`,
      })
    } catch (error) {
      console.error("Failed to fetch crypto data:", error)
      setError("Failed to fetch cryptocurrency data. Please try again.")
      toast({
        title: "❌ Error",
        description: "Failed to fetch market data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Auto-refresh data every 3 minutes
  useEffect(() => {
    fetchAllCryptoData()
    const interval = setInterval(fetchAllCryptoData, 180000) // 3 minutes
    return () => clearInterval(interval)
  }, [fetchAllCryptoData])

  // Dynamic search and filter
  const searchResults = useMemo(() => {
    setIsSearching(true)

    let filtered = allCryptoData

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = allCryptoData.filter((crypto) => {
        return (
          crypto.name.toLowerCase().includes(searchLower) ||
          crypto.symbol.toLowerCase().includes(searchLower) ||
          crypto.symbol.toLowerCase().startsWith(searchLower)
        )
      })
    }

    // Apply category filter
    filtered = filtered.filter((crypto) => {
      const change24h = safeGetValue(crypto.quotes?.USD?.percentage_change_24h, 0)
      switch (filterBy) {
        case "gainers":
          return change24h > 0
        case "losers":
          return change24h < 0
        case "favorites":
          return favorites.has(crypto.symbol)
        default:
          return true
      }
    })

    // Sort results
    filtered.sort((a, b) => {
      let aValue: number, bValue: number

      switch (sortBy) {
        case "rank":
          aValue = safeGetValue(a.rank, 999999)
          bValue = safeGetValue(b.rank, 999999)
          break
        case "price":
          aValue = safeGetValue(a.quotes?.USD?.price, 0)
          bValue = safeGetValue(b.quotes?.USD?.price, 0)
          break
        case "change24h":
          aValue = safeGetValue(a.quotes?.USD?.percentage_change_24h, 0)
          bValue = safeGetValue(b.quotes?.USD?.percentage_change_24h, 0)
          break
        case "marketCap":
          aValue = safeGetValue(a.quotes?.USD?.market_cap, 0)
          bValue = safeGetValue(b.quotes?.USD?.market_cap, 0)
          break
        case "volume":
          aValue = safeGetValue(a.quotes?.USD?.volume_24h, 0)
          bValue = safeGetValue(b.quotes?.USD?.volume_24h, 0)
          break
        default:
          aValue = safeGetValue(a.rank, 999999)
          bValue = safeGetValue(b.rank, 999999)
      }

      return sortOrder === "asc" ? aValue - bValue : bValue - aValue
    })

    setIsSearching(false)
    return filtered.slice(0, displayLimit)
  }, [allCryptoData, searchTerm, filterBy, sortBy, sortOrder, favorites, displayLimit])

  // Toggle favorite
  const toggleFavorite = useCallback((symbol: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol)
      } else {
        newFavorites.add(symbol)
      }

      try {
        localStorage.setItem("crypto-favorites", JSON.stringify(Array.from(newFavorites)))
      } catch (error) {
        console.error("Failed to save favorites:", error)
      }

      return newFavorites
    })
  }, [])

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem("crypto-favorites")
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)))
      }
    } catch (error) {
      console.error("Failed to load favorites:", error)
    }
  }, [])

  // Copy symbol to clipboard
  const copySymbol = useCallback(
    (symbol: string, name: string) => {
      try {
        navigator.clipboard.writeText(symbol)
        toast({
          title: "📋 Copied to Clipboard",
          description: `${symbol} (${name}) copied for calculator`,
        })
      } catch (error) {
        console.error("Failed to copy to clipboard:", error)
        toast({
          title: "❌ Copy Failed",
          description: "Unable to copy to clipboard",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  // Error state
  if (error && !isLoading && allCryptoData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <AlertCircle className="h-16 w-16 text-red-500" />
        <h3 className="text-xl font-semibold">Failed to Load Market Data</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Unable to fetch cryptocurrency market data. Please check your internet connection and try again.
        </p>
        <Button onClick={fetchAllCryptoData} variant="outline" size="lg">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Loading
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-primary" />
            <span>Dynamic Crypto Search</span>
            <Badge variant="outline" className="ml-auto">
              {allCryptoData.length} Available
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search any cryptocurrency (e.g., Bitcoin, BTC, Ethereum, DOGE)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-base"
              disabled={isLoading}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
            )}
          </div>

          {/* Filter and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)} disabled={isLoading}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Coins</SelectItem>
                <SelectItem value="gainers">📈 Gainers</SelectItem>
                <SelectItem value="losers">📉 Losers</SelectItem>
                <SelectItem value="favorites">⭐ Favorites</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)} disabled={isLoading}>
              <SelectTrigger className="w-full sm:w-40">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">Market Rank</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="change24h">24h Change</SelectItem>
                <SelectItem value="marketCap">Market Cap</SelectItem>
                <SelectItem value="volume">Volume</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
            </Button>

            <Button variant="outline" onClick={fetchAllCryptoData} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {isLoading ? "Loading..." : "Refresh"}
            </Button>
          </div>

          {/* Results Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>
                Showing {searchResults.length} of {allCryptoData.length} cryptocurrencies
              </span>
              {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchTerm}"
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3" />
              <span>Updated: {lastUpdated?.toLocaleTimeString() || "Never"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-16"></div>
                      <div className="h-5 bg-muted rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-muted rounded w-8"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 bg-muted rounded w-20"></div>
                    <div className="h-4 bg-muted rounded w-16"></div>
                    <div className="h-4 bg-muted rounded w-18"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : searchResults.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No Results Found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchTerm
                  ? `No cryptocurrencies found matching "${searchTerm}". Try a different search term.`
                  : "No cryptocurrencies match your current filters. Try adjusting your filter settings."}
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear Search
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {searchResults.map((crypto) => {
              const change24h = safeGetValue(crypto.quotes.USD.percentage_change_24h, 0)
              const isPositive = change24h >= 0
              const isFavorite = favorites.has(crypto.symbol)
              const price = safeGetValue(crypto.quotes.USD.price, 0)
              const marketCap = safeGetValue(crypto.quotes.USD.market_cap, 0)
              const volume = safeGetValue(crypto.quotes.USD.volume_24h, 0)

              return (
                <Card
                  key={crypto.id}
                  className="hover:shadow-lg transition-all duration-200 hover:scale-105 group relative border-2 hover:border-primary/20"
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs px-2 py-0">
                            #{safeGetValue(crypto.rank, "N/A")}
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground">{crypto.symbol}</span>
                        </div>
                        <h3 className="font-semibold text-sm leading-tight" title={crypto.name}>
                          {crypto.name}
                        </h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => toggleFavorite(crypto.symbol)}
                      >
                        <Star
                          className={`h-4 w-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                        />
                      </Button>
                    </div>

                    {/* Price and Change */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold text-lg">${formatPrice(price)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
                          {formatPercentage(change24h)}
                        </span>
                      </div>
                    </div>

                    {/* Market Data */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Market Cap
                        </span>
                        <span className="font-medium">{formatLargeNumber(marketCap)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center">
                          <Activity className="h-3 w-3 mr-1" />
                          Volume 24h
                        </span>
                        <span className="font-medium">{formatLargeNumber(volume)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => copySymbol(crypto.symbol, crypto.name)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
                        <a
                          href={`https://coinmarketcap.com/currencies/${crypto.name.toLowerCase().replace(/\s+/g, "-")}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Info
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Load More Button */}
          {searchResults.length >= displayLimit && displayLimit < allCryptoData.length && (
            <div className="text-center">
              <Button variant="outline" onClick={() => setDisplayLimit((prev) => prev + 50)} size="lg">
                Load More Cryptocurrencies
                <span className="ml-2 text-xs text-muted-foreground">
                  ({displayLimit} of {allCryptoData.length})
                </span>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
