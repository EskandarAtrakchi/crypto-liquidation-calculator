"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react"
import { formatPrice } from "@/lib/crypto-api"
import { useToast } from "@/hooks/use-toast"

interface PortfolioPosition {
  id: string
  symbol: string
  entryPrice: number
  currentPrice: number
  leverage: number
  positionType: "long" | "short"
  positionSize: number
  liquidationPrice: number
  marginUsed: number
  unrealizedPnL: number
  riskLevel: "low" | "medium" | "high"
}

export function PortfolioTracker() {
  const [positions, setPositions] = useState<PortfolioPosition[]>([])
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0)
  const [totalUnrealizedPnL, setTotalUnrealizedPnL] = useState(0)
  const { toast } = useToast()

  // Load positions from localStorage
  useEffect(() => {
    const savedPositions = localStorage.getItem("crypto-portfolio")
    if (savedPositions) {
      try {
        setPositions(JSON.parse(savedPositions))
      } catch (error) {
        console.error("Failed to load portfolio:", error)
      }
    }
  }, [])

  // Save positions to localStorage
  useEffect(() => {
    localStorage.setItem("crypto-portfolio", JSON.stringify(positions))

    // Calculate totals
    const totalValue = positions.reduce((sum, pos) => sum + pos.positionSize, 0)
    const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0)

    setTotalPortfolioValue(totalValue)
    setTotalUnrealizedPnL(totalPnL)
  }, [positions])

  const addPosition = (position: Omit<PortfolioPosition, "id" | "currentPrice" | "unrealizedPnL" | "riskLevel">) => {
    const newPosition: PortfolioPosition = {
      ...position,
      id: Date.now().toString(),
      currentPrice: position.entryPrice, // Will be updated with live data
      unrealizedPnL: 0,
      riskLevel: position.leverage <= 5 ? "low" : position.leverage <= 15 ? "medium" : "high",
    }

    setPositions((prev) => [...prev, newPosition])
    toast({
      title: "📊 Position Added",
      description: `${position.symbol} ${position.positionType} position added to portfolio`,
    })
  }

  const removePosition = (id: string) => {
    setPositions((prev) => prev.filter((pos) => pos.id !== id))
    toast({
      title: "🗑️ Position Removed",
      description: "Position removed from portfolio",
    })
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-500 bg-green-50 dark:bg-green-900/20"
      case "medium":
        return "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
      case "high":
        return "text-red-500 bg-red-50 dark:bg-red-900/20"
      default:
        return "text-gray-500"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5" />
          <span>Portfolio Tracker</span>
          <Badge variant="outline" className="ml-auto">
            {positions.length} Positions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Portfolio Summary */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <span className="text-sm text-muted-foreground">Total Portfolio Value</span>
            <p className="text-2xl font-bold">${formatPrice(totalPortfolioValue)}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Unrealized P&L</span>
            <p className={`text-2xl font-bold ${totalUnrealizedPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
              {totalUnrealizedPnL >= 0 ? "+" : ""}${formatPrice(Math.abs(totalUnrealizedPnL))}
            </p>
          </div>
        </div>

        {/* Positions List */}
        {positions.length > 0 ? (
          <div className="space-y-3">
            {positions.map((position) => (
              <div key={position.id} className="p-4 border rounded-lg bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold">{position.symbol}</h3>
                    <Badge variant={position.positionType === "long" ? "default" : "destructive"}>
                      {position.positionType === "long" ? (
                        <>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          LONG
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3 mr-1" />
                          SHORT
                        </>
                      )}
                    </Badge>
                    <Badge className={getRiskColor(position.riskLevel)}>{position.leverage}x</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePosition(position.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Entry Price</span>
                    <p className="font-mono">${formatPrice(position.entryPrice)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Position Size</span>
                    <p className="font-mono">${position.positionSize.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Liquidation</span>
                    <p className="font-mono text-red-500">${formatPrice(position.liquidationPrice)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Margin Used</span>
                    <p className="font-mono">${formatPrice(position.marginUsed)}</p>
                  </div>
                </div>

                {/* Risk Warning */}
                {position.riskLevel === "high" && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-red-600 dark:text-red-400">High risk position - Monitor closely</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No positions in portfolio</p>
            <p className="text-sm">Calculate positions to add them here</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
