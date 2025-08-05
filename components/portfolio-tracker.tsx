"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trash2, TrendingUp, TrendingDown, DollarSign, AlertTriangle, RefreshCw, Eye, EyeOff, Plus } from "lucide-react"
import { formatPrice, fetchCryptoBySymbol } from "@/lib/crypto-api"
import { useToast } from "@/hooks/use-toast"
import type { Position, CalculationResult } from "./liquidation-calculator"

interface PortfolioPosition extends Position {
  id: string
  currentPrice: number
  liquidationPrice: number
  unrealizedPnL: number
  unrealizedPnLPercentage: number
  riskLevel: "low" | "medium" | "high" | "critical"
  distanceToLiquidation: number
  lastUpdated: string
  addedAt: string
}

interface PortfolioTrackerProps {
  currentPosition?: Position | null
  currentResult?: CalculationResult | null
}

export function PortfolioTracker({ currentPosition, currentResult }: PortfolioTrackerProps) {
  const [positions, setPositions] = useState<PortfolioPosition[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [showPnL, setShowPnL] = useState(true)
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("")
  const { toast } = useToast()

  // Load positions from localStorage on mount
  useEffect(() => {
    const savedPositions = localStorage.getItem("crypto-portfolio")
    if (savedPositions) {
      try {
        const parsed = JSON.parse(savedPositions)
        setPositions(parsed)
        // Update prices immediately after loading
        if (parsed.length > 0) {
          updateAllPrices(parsed)
        }
      } catch (error) {
        console.error("Failed to load portfolio:", error)
        setPositions([])
      }
    }
  }, [])

  // Save positions to localStorage whenever positions change
  useEffect(() => {
    if (positions.length >= 0) {
      localStorage.setItem("crypto-portfolio", JSON.stringify(positions))
    }
  }, [positions])

  // Auto-update prices every 2 minutes for active positions
  useEffect(() => {
    const interval = setInterval(() => {
      if (positions.length > 0) {
        updateAllPrices(positions)
      }
    }, 120000) // 2 minutes

    return () => clearInterval(interval)
  }, [positions])

  const calculatePnL = (position: PortfolioPosition, currentPrice: number) => {
    const priceChange = currentPrice - position.entryPrice
    const priceChangePercentage = (priceChange / position.entryPrice) * 100

    // For short positions, profit/loss is inverted
    const effectivePriceChange = position.positionType === "long" ? priceChangePercentage : -priceChangePercentage

    // Calculate leveraged return
    const leveragedReturn = effectivePriceChange * position.leverage

    // Calculate actual profit/loss in USD
    const unrealizedPnL = (position.positionSize * leveragedReturn) / 100

    return {
      unrealizedPnL,
      unrealizedPnLPercentage: leveragedReturn,
    }
  }

  const calculateRiskLevel = (
    position: PortfolioPosition,
    currentPrice: number,
  ): "low" | "medium" | "high" | "critical" => {
    const distanceToLiquidation =
      position.positionType === "long"
        ? ((currentPrice - position.liquidationPrice) / currentPrice) * 100
        : ((position.liquidationPrice - currentPrice) / currentPrice) * 100

    if (distanceToLiquidation <= 5) return "critical"
    if (distanceToLiquidation <= 15) return "high"
    if (distanceToLiquidation <= 30) return "medium"
    return "low"
  }

  const updateAllPrices = async (positionsToUpdate: PortfolioPosition[]) => {
    if (isUpdating || positionsToUpdate.length === 0) return

    setIsUpdating(true)
    const updateStartTime = new Date().toLocaleTimeString()

    try {
      const updatedPositions = await Promise.all(
        positionsToUpdate.map(async (position) => {
          try {
            const cryptoData = await fetchCryptoBySymbol(position.symbol)
            if (cryptoData && cryptoData.quotes?.USD) {
              const currentPrice = cryptoData.quotes.USD.price
              const { unrealizedPnL, unrealizedPnLPercentage } = calculatePnL(position, currentPrice)
              const riskLevel = calculateRiskLevel(position, currentPrice)

              const distanceToLiquidation =
                position.positionType === "long"
                  ? ((currentPrice - position.liquidationPrice) / currentPrice) * 100
                  : ((position.liquidationPrice - currentPrice) / currentPrice) * 100

              return {
                ...position,
                currentPrice,
                unrealizedPnL,
                unrealizedPnLPercentage,
                riskLevel,
                distanceToLiquidation: Math.max(0, distanceToLiquidation),
                lastUpdated: new Date().toLocaleTimeString(),
              }
            }
            return position
          } catch (error) {
            console.error(`Failed to update ${position.symbol}:`, error)
            return position
          }
        }),
      )

      setPositions(updatedPositions)
      setLastUpdateTime(updateStartTime)

      // Check for critical positions and alert
      const criticalPositions = updatedPositions.filter((p) => p.riskLevel === "critical")
      if (criticalPositions.length > 0) {
        toast({
          title: "🚨 LIQUIDATION RISK",
          description: `${criticalPositions.length} position(s) critically close to liquidation!`,
          variant: "destructive",
        })

        // Browser notification if available
        if (Notification.permission === "granted") {
          new Notification("CRITICAL LIQUIDATION RISK", {
            body: `${criticalPositions.length} position(s) need immediate attention!`,
            icon: "/logo-tab.jpg",
          })
        }
      }

      toast({
        title: "✅ Prices Updated",
        description: `Portfolio updated with latest market prices`,
      })
    } catch (error) {
      console.error("Failed to update prices:", error)
      toast({
        title: "❌ Update Failed",
        description: "Could not fetch latest prices. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const addCurrentPosition = () => {
    if (!currentPosition || !currentResult) {
      toast({
        title: "❌ No Position to Add",
        description: "Please calculate a position first using the calculator tab",
        variant: "destructive",
      })
      return
    }

    // Check if similar position already exists
    const existingPosition = positions.find(
      (p) =>
        p.symbol === currentPosition.symbol &&
        Math.abs(p.entryPrice - currentPosition.entryPrice) < 0.01 &&
        p.leverage === currentPosition.leverage &&
        p.positionType === currentPosition.positionType,
    )

    if (existingPosition) {
      toast({
        title: "⚠️ Similar Position Exists",
        description: `A similar ${currentPosition.symbol} position already exists in your portfolio`,
        variant: "destructive",
      })
      return
    }

    const newPosition: PortfolioPosition = {
      ...currentPosition,
      id: `pos_${Date.now()}`,
      currentPrice: currentPosition.entryPrice,
      liquidationPrice: currentResult.liquidationPrice,
      unrealizedPnL: 0,
      unrealizedPnLPercentage: 0,
      riskLevel: currentPosition.leverage <= 5 ? "low" : currentPosition.leverage <= 15 ? "medium" : "high",
      distanceToLiquidation: (1 / currentPosition.leverage) * 100,
      lastUpdated: new Date().toLocaleTimeString(),
      addedAt: new Date().toISOString(),
    }

    setPositions((prev) => [newPosition, ...prev])

    // Update price immediately for the new position
    setTimeout(() => {
      updateAllPrices([newPosition, ...positions])
    }, 500)

    toast({
      title: "✅ Position Added",
      description: `${currentPosition.symbol} ${currentPosition.positionType.toUpperCase()} position added to portfolio`,
    })
  }

  const removePosition = (id: string) => {
    const position = positions.find((p) => p.id === id)
    setPositions((prev) => prev.filter((pos) => pos.id !== id))

    toast({
      title: "🗑️ Position Removed",
      description: `${position?.symbol} position removed from portfolio`,
    })
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200"
      case "medium":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200"
      case "high":
        return "text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200"
      case "critical":
        return "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 animate-pulse"
      default:
        return "text-gray-500"
    }
  }

  const getRiskProgress = (level: string, distance: number) => {
    switch (level) {
      case "critical":
        return Math.min((distance / 5) * 100, 100)
      case "high":
        return Math.min((distance / 15) * 100, 100)
      case "medium":
        return Math.min((distance / 30) * 100, 100)
      default:
        return 100
    }
  }

  // Calculate portfolio statistics
  const portfolioStats = {
    totalValue: positions.reduce((sum, pos) => sum + pos.positionSize, 0),
    totalPnL: positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0),
    totalMargin: positions.reduce((sum, pos) => sum + pos.marginUsed, 0),
    criticalPositions: positions.filter((p) => p.riskLevel === "critical").length,
    highRiskPositions: positions.filter((p) => p.riskLevel === "high").length,
    profitablePositions: positions.filter((p) => p.unrealizedPnL > 0).length,
    losingPositions: positions.filter((p) => p.unrealizedPnL < 0).length,
  }

  return (
    <div className="space-y-6">
      {/* Current Position Quick Add */}
      {currentPosition && currentResult && (
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-primary" />
                <span>Ready to Add to Portfolio</span>
              </span>
              <Button onClick={addCurrentPosition} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Position
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">Symbol</span>
                <p className="font-bold text-lg">{currentPosition.symbol}</p>
              </div>
              <div>
                <span className="text-muted-foreground block">Type</span>
                <Badge variant={currentPosition.positionType === "long" ? "default" : "destructive"}>
                  {currentPosition.positionType.toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground block">Entry</span>
                <p className="font-mono font-semibold">${formatPrice(currentPosition.entryPrice)}</p>
              </div>
              <div>
                <span className="text-muted-foreground block">Leverage</span>
                <p className="font-mono font-semibold">{currentPosition.leverage}x</p>
              </div>
              <div>
                <span className="text-muted-foreground block">Liquidation</span>
                <p className="font-mono font-semibold text-red-500">${formatPrice(currentResult.liquidationPrice)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span>Portfolio Dashboard</span>
              <Badge variant="outline" className="ml-2">
                {positions.length} Active Position{positions.length !== 1 ? "s" : ""}
              </Badge>
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPnL(!showPnL)}
                title={showPnL ? "Hide P&L" : "Show P&L"}
              >
                {showPnL ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateAllPrices(positions)}
                disabled={isUpdating || positions.length === 0}
                title="Update all prices"
              >
                {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {!isUpdating && <span className="ml-2 hidden sm:inline">Update</span>}
              </Button>
            </div>
          </CardTitle>
          {lastUpdateTime && <p className="text-sm text-muted-foreground">Last updated: {lastUpdateTime}</p>}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Portfolio Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl border">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">${formatPrice(portfolioStats.totalValue)}</p>
              <p className="text-sm text-muted-foreground font-medium">Total Position Size</p>
            </div>
            <div className="text-center">
              <p
                className={`text-2xl font-bold ${
                  showPnL ? (portfolioStats.totalPnL >= 0 ? "text-green-500" : "text-red-500") : "text-muted-foreground"
                }`}
              >
                {showPnL ? (
                  <>
                    {portfolioStats.totalPnL >= 0 ? "+" : ""}${formatPrice(Math.abs(portfolioStats.totalPnL))}
                  </>
                ) : (
                  "***"
                )}
              </p>
              <p className="text-sm text-muted-foreground font-medium">Unrealized P&L</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">${formatPrice(portfolioStats.totalMargin)}</p>
              <p className="text-sm text-muted-foreground font-medium">Total Margin Used</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">
                {portfolioStats.criticalPositions + portfolioStats.highRiskPositions}
              </p>
              <p className="text-sm text-muted-foreground font-medium">High Risk Positions</p>
            </div>
          </div>

          {/* Risk Alerts */}
          {portfolioStats.criticalPositions > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 rounded-lg">
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 mb-2">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
                <span className="font-bold">CRITICAL LIQUIDATION RISK</span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                {portfolioStats.criticalPositions} position(s) are dangerously close to liquidation! Consider reducing
                position size or adding margin immediately.
              </p>
            </div>
          )}

          {portfolioStats.highRiskPositions > 0 && portfolioStats.criticalPositions === 0 && (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400 rounded-lg">
              <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">High Risk Warning</span>
              </div>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                {portfolioStats.highRiskPositions} position(s) are at high risk. Monitor closely.
              </p>
            </div>
          )}

          {/* Positions List */}
          {positions.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <span>Active Positions</span>
                <Badge variant="secondary">{positions.length}</Badge>
              </h3>

              {positions.map((position) => (
                <Card
                  key={position.id}
                  className={`border-l-4 ${
                    position.riskLevel === "critical"
                      ? "border-red-500"
                      : position.riskLevel === "high"
                        ? "border-orange-500"
                        : position.riskLevel === "medium"
                          ? "border-yellow-500"
                          : "border-green-500"
                  }`}
                >
                  <CardContent className="p-6">
                    {/* Position Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-bold text-xl">{position.symbol}</h3>
                        <Badge
                          variant={position.positionType === "long" ? "default" : "destructive"}
                          className="px-3 py-1"
                        >
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
                        <Badge className={`px-3 py-1 font-semibold ${getRiskColor(position.riskLevel)}`}>
                          {position.leverage}x · {position.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">Updated: {position.lastUpdated}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePosition(position.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Price Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground block mb-1">Entry Price</span>
                        <p className="font-mono font-bold text-lg">${formatPrice(position.entryPrice)}</p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground block mb-1">Current Price</span>
                        <p className="font-mono font-bold text-lg">${formatPrice(position.currentPrice)}</p>
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <span className="text-sm text-muted-foreground block mb-1">Liquidation Price</span>
                        <p className="font-mono font-bold text-lg text-red-600">
                          ${formatPrice(position.liquidationPrice)}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground block mb-1">Position Size</span>
                        <p className="font-mono font-bold text-lg">${position.positionSize.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* P&L Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div
                        className={`p-4 rounded-lg border ${
                          showPnL
                            ? position.unrealizedPnL >= 0
                              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                            : "bg-muted/30"
                        }`}
                      >
                        <span className="text-sm text-muted-foreground block mb-2">Unrealized P&L</span>
                        <p
                          className={`font-bold text-2xl ${
                            showPnL
                              ? position.unrealizedPnL >= 0
                                ? "text-green-600"
                                : "text-red-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {showPnL ? (
                            <>
                              {position.unrealizedPnL >= 0 ? "+" : ""}${formatPrice(Math.abs(position.unrealizedPnL))}
                              <span className="text-sm ml-3 opacity-75">
                                ({position.unrealizedPnLPercentage >= 0 ? "+" : ""}
                                {position.unrealizedPnLPercentage.toFixed(2)}%)
                              </span>
                            </>
                          ) : (
                            "***"
                          )}
                        </p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground block mb-2">Margin Used</span>
                        <p className="font-bold text-2xl">${formatPrice(position.marginUsed)}</p>
                      </div>
                    </div>

                    {/* Risk Progress Bar */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Distance to Liquidation</span>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-sm font-bold ${
                              position.riskLevel === "critical"
                                ? "text-red-500"
                                : position.riskLevel === "high"
                                  ? "text-orange-500"
                                  : position.riskLevel === "medium"
                                    ? "text-yellow-500"
                                    : "text-green-500"
                            }`}
                          >
                            {position.distanceToLiquidation.toFixed(2)}%
                          </span>
                          {position.riskLevel === "critical" && (
                            <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
                          )}
                        </div>
                      </div>
                      <div className="relative">
                        <Progress
                          value={getRiskProgress(position.riskLevel, position.distanceToLiquidation)}
                          className={`h-3 ${
                            position.riskLevel === "critical"
                              ? "bg-red-100"
                              : position.riskLevel === "high"
                                ? "bg-orange-100"
                                : position.riskLevel === "medium"
                                  ? "bg-yellow-100"
                                  : "bg-green-100"
                          }`}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-700">
                            {position.riskLevel === "critical"
                              ? "DANGER ZONE"
                              : position.riskLevel === "high"
                                ? "HIGH RISK"
                                : position.riskLevel === "medium"
                                  ? "MEDIUM RISK"
                                  : "SAFE ZONE"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Critical Warning */}
                    {position.riskLevel === "critical" && (
                      <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
                          <span className="text-sm text-red-600 dark:text-red-400 font-bold">
                            IMMEDIATE ACTION REQUIRED: This position may be liquidated very soon!
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Empty State
            <Card className="border-dashed border-2">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                  <DollarSign className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">No Positions in Portfolio</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start by calculating positions using the Calculator tab, then add them here to track their performance
                  with real-time price updates and risk monitoring.
                </p>
                {currentPosition && currentResult ? (
                  <Button onClick={addCurrentPosition} size="lg" className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your Calculated Position
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Go to the Calculator tab and calculate a position first
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
