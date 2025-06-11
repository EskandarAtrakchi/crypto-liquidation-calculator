"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"
import { fetchCryptoData, formatPrice, POPULAR_CRYPTOS } from "@/lib/crypto-api"
import type { CryptoData } from "@/lib/crypto-api"

export function MarketOverview() {
  const [marketData, setMarketData] = useState<CryptoData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMarketOverview = async () => {
      try {
        const allData = await fetchCryptoData()

        // Filter to show only popular cryptocurrencies
        const popularData = POPULAR_CRYPTOS.map((popular) =>
          allData.find((crypto) => crypto.symbol === popular.symbol),
        ).filter(Boolean) as CryptoData[]

        setMarketData(popularData.slice(0, 8)) // Show top 8
      } catch (error) {
        console.error("Failed to fetch market data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMarketOverview()
    const interval = setInterval(fetchMarketOverview, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Market Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-6 bg-muted rounded mb-1"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Market Overview</span>
          <Badge variant="outline" className="ml-auto">
            Live Data
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {marketData.map((item) => {
            const isPositive = item.quotes.USD.percentage_change_24h >= 0

            return (
              <div
                key={item.id}
                className="text-center p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="font-medium text-sm text-muted-foreground mb-1">
                  {item.symbol}
                  <span className="block text-xs opacity-75">#{item.rank}</span>
                </div>
                <div className="font-bold text-sm mb-1">${formatPrice(item.quotes.USD.price)}</div>
                <Badge variant={isPositive ? "default" : "destructive"} className="text-xs px-1 py-0">
                  {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {Math.abs(item.quotes.USD.percentage_change_24h).toFixed(1)}%
                </Badge>
              </div>
            )
          })}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">Data provided by Alternative.me • Updated every minute</p>
        </div>
      </CardContent>
    </Card>
  )
}
