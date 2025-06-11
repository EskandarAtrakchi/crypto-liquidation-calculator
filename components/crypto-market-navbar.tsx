"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
} from "lucide-react"
import { fetchCryptoData, formatPrice, formatPercentage, formatLargeNumber, safeGetValue } from "@/lib/crypto-api"
import type { CryptoData } from "@/lib/crypto-api"
import { useToast } from "@/hooks/use-toast"

export function CryptoMarketNavbar() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"rank" | "price" | "change24h" | "marketCap" | "volume">("rank")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [filterBy, setFilterBy] = useState<"all" | "gainers" | "losers" | "favorites">("all")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { toast } = useToast()

  // Fetch crypto data with error handling
  const fetchMarketData = async () => {
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

      setCryptoData(validData.slice(0, 100)) // Show top 100 cryptocurrencies
      setLastUpdated(new Date())

      if (validData.length > 0) {
        toast({
          title: "📊 Market Data Updated",
          description: `Loaded ${validData.length} cryptocurrencies`,
        })
      }
    } catch (error) {
      console.error("Failed to fetch market data:", error)
      setError("Failed to fetch market data. Please try again.")
      toast({
        title: "❌ Error",
        description: "Failed to fetch market data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh data every 2 minutes
  useEffect(() => {
    fetchMarketData()
    const interval = setInterval(fetchMarketData, 120000) // 2 minutes
    return () => clearInterval(interval)
  }, [])

  // Toggle favorite
  const toggleFavorite = (symbol: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(symbol)) {
      newFavorites.delete(symbol)
    } else {
      newFavorites.add(symbol)
    }
    setFavorites(newFavorites)

    // Save to localStorage
    try {
      localStorage.setItem("crypto-favorites", JSON.stringify(Array.from(newFavorites)))
    } catch (error) {
      console.error("Failed to save favorites:", error)
    }
  }

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

  // Filter and sort data with safe value access
  const filteredAndSortedData = useMemo(() => {
    const filtered = cryptoData.filter((crypto) => {
      if (!crypto || !crypto.symbol || !crypto.name) return false

      const matchesSearch =
        crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())

      const change24h = safeGetValue(crypto.quotes?.USD?.percentage_change_24h, 0)
      const matchesFilter =
        filterBy === "all" ||
        (filterBy === "gainers" && change24h > 0) ||
        (filterBy === "losers" && change24h < 0) ||
        (filterBy === "favorites" && favorites.has(crypto.symbol))

      return matchesSearch && matchesFilter
    })

    // Sort data with safe value access
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

    return filtered
  }, [cryptoData, searchTerm, sortBy, sortOrder, filterBy, favorites])

  // Error state
  if (error && !isLoading && cryptoData.length === 0) {
    return (
      <div className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-16 z-40">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h3 className="text-lg font-semibold">Failed to Load Market Data</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Unable to fetch cryptocurrency market data. Please check your internet connection and try again.
            </p>
            <Button onClick={fetchMarketData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-16 z-40">
      <div className="container mx-auto px-4 py-4">
        {/* Header Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Live Crypto Market</h2>
            <Badge variant="outline" className="animate-pulse">
              {cryptoData.length} Coins
            </Badge>
            {error && (
              <Badge variant="destructive" className="text-xs">
                Connection Issues
              </Badge>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 lg:ml-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search crypto (e.g., Bitcoin, BTC)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>

            {/* Filter */}
            <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
              <SelectTrigger className="w-full sm:w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="gainers">📈 Gainers</SelectItem>
                <SelectItem value="losers">📉 Losers</SelectItem>
                <SelectItem value="favorites">⭐ Favorites</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-36">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">Rank</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="change24h">24h Change</SelectItem>
                <SelectItem value="marketCap">Market Cap</SelectItem>
                <SelectItem value="volume">Volume</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="w-full sm:w-auto"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchMarketData}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Market Data Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {[...Array(20)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-6 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
              {filteredAndSortedData.map((crypto) => {
                if (!crypto || !crypto.symbol || !crypto.quotes?.USD) return null

                const change24h = safeGetValue(crypto.quotes.USD.percentage_change_24h, 0)
                const isPositive = change24h >= 0
                const isFavorite = favorites.has(crypto.symbol)
                const price = safeGetValue(crypto.quotes.USD.price, 0)
                const marketCap = safeGetValue(crypto.quotes.USD.market_cap, 0)
                const volume = safeGetValue(crypto.quotes.USD.volume_24h, 0)

                return (
                  <Card
                    key={crypto.id}
                    className="hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer group relative"
                    onClick={() => {
                      // Copy symbol to clipboard and show toast
                      try {
                        navigator.clipboard.writeText(crypto.symbol)
                        toast({
                          title: "📋 Copied to Clipboard",
                          description: `${crypto.symbol} symbol copied for calculator`,
                        })
                      } catch (error) {
                        console.error("Failed to copy to clipboard:", error)
                      }
                    }}
                  >
                    <CardContent className="p-3">
                      {/* Header with rank and favorite */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            #{safeGetValue(crypto.rank, "N/A")}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">{crypto.symbol}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(crypto.symbol)
                          }}
                        >
                          <Star
                            className={`h-3 w-3 ${isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                          />
                        </Button>
                      </div>

                      {/* Name */}
                      <h3 className="font-medium text-sm mb-2 truncate" title={crypto.name}>
                        {crypto.name}
                      </h3>

                      {/* Price */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="font-bold text-sm">${formatPrice(price)}</span>
                        </div>

                        {/* 24h Change */}
                        <div className="flex items-center justify-between">
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span className={`text-xs font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
                            {formatPercentage(change24h)}
                          </span>
                        </div>

                        {/* Market Cap */}
                        <div className="flex items-center justify-between">
                          <BarChart3 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{formatLargeNumber(marketCap)}</span>
                        </div>

                        {/* Volume */}
                        <div className="flex items-center justify-between">
                          <Activity className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{formatLargeNumber(volume)}</span>
                        </div>
                      </div>

                      {/* Hover tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                        Click to copy {crypto.symbol} to calculator
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* No results message */}
            {filteredAndSortedData.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2">No cryptocurrencies found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search terms or filters</p>
              </div>
            )}

            {/* Footer Info */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t text-xs text-muted-foreground">
              <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                <span className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Last updated: {lastUpdated?.toLocaleTimeString() || "Never"}</span>
                </span>
                <span>•</span>
                <span>
                  {filteredAndSortedData.length} of {cryptoData.length} coins shown
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  Auto-refresh: 2min
                </Badge>
                <span>•</span>
                <span>Data by Alternative.me</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
