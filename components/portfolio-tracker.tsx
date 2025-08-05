"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  X,
  Calendar,
  FileText,
  MoreVertical,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
  status: "open" | "closed"
  exitPrice?: number
  exitDate?: string
  realizedPnL?: number
  notes?: string
  closeReason?: string
}

interface PortfolioTrackerProps {
  currentPosition?: Position | null
  currentResult?: CalculationResult | null
}

const PORTFOLIO_STORAGE_KEY = "crypto-portfolio"

export function PortfolioTracker({ currentPosition, currentResult }: PortfolioTrackerProps) {
  const [positions, setPositions] = useState<PortfolioPosition[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [showPnL, setShowPnL] = useState(true)
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("")
  const [closingPosition, setClosingPosition] = useState<PortfolioPosition | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [closeData, setCloseData] = useState({
    exitPrice: "",
    notes: "",
    closeReason: "manual" as "manual" | "stop_loss" | "take_profit" | "liquidated",
  })
  const { toast } = useToast()

  // Load positions from localStorage on mount
  useEffect(() => {
    const savedPositions = localStorage.getItem(PORTFOLIO_STORAGE_KEY)
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
      localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(positions))
    }
  }, [positions])

  // Auto-update prices every 2 minutes for active positions
  useEffect(() => {
    const interval = setInterval(() => {
      const openPositions = positions.filter((p) => p.status === "open")
      if (openPositions.length > 0) {
        updateAllPrices(positions)
      }
    }, 120000) // 2 minutes

    return () => clearInterval(interval)
  }, [positions])

  const calculatePnL = useCallback((position: PortfolioPosition, currentPrice: number) => {
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
  }, [])

  const calculateRiskLevel = useCallback(
    (position: PortfolioPosition, currentPrice: number): "low" | "medium" | "high" | "critical" => {
      const distanceToLiquidation =
        position.positionType === "long"
          ? ((currentPrice - position.liquidationPrice) / currentPrice) * 100
          : ((position.liquidationPrice - currentPrice) / currentPrice) * 100

      if (distanceToLiquidation <= 5) return "critical"
      if (distanceToLiquidation <= 15) return "high"
      if (distanceToLiquidation <= 30) return "medium"
      return "low"
    },
    [],
  )

  const updateAllPrices = useCallback(
    async (positionsToUpdate: PortfolioPosition[]) => {
      if (isUpdating || positionsToUpdate.length === 0) return

      setIsUpdating(true)
      const updateStartTime = new Date().toLocaleTimeString()

      try {
        const updatedPositions = await Promise.all(
          positionsToUpdate.map(async (position) => {
            // Skip closed positions
            if (position.status === "closed") return position

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
        const criticalPositions = updatedPositions.filter((p) => p.riskLevel === "critical" && p.status === "open")
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
    },
    [isUpdating, calculatePnL, calculateRiskLevel, toast],
  )

  const addCurrentPosition = useCallback(() => {
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
        p.positionType === currentPosition.positionType &&
        p.status === "open",
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
      status: "open",
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
  }, [currentPosition, currentResult, positions, toast, updateAllPrices])

  const openCloseDialog = useCallback((position: PortfolioPosition) => {
    setClosingPosition(position)
    setCloseData({
      exitPrice: position.currentPrice.toString(),
      notes: "",
      closeReason: "manual",
    })
    setIsDialogOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false)
    // Add a small delay to ensure dialog is fully closed before clearing state
    setTimeout(() => {
      setClosingPosition(null)
      setCloseData({
        exitPrice: "",
        notes: "",
        closeReason: "manual",
      })
    }, 150)
  }, [])

  const closePosition = useCallback(() => {
    if (!closingPosition || !closeData.exitPrice) {
      toast({
        title: "❌ Invalid Exit Price",
        description: "Please enter a valid exit price",
        variant: "destructive",
      })
      return
    }

    const exitPrice = Number.parseFloat(closeData.exitPrice)
    if (isNaN(exitPrice) || exitPrice <= 0) {
      toast({
        title: "❌ Invalid Exit Price",
        description: "Please enter a valid positive number for exit price",
        variant: "destructive",
      })
      return
    }

    const { unrealizedPnL } = calculatePnL(closingPosition, exitPrice)

    const closedPosition: PortfolioPosition = {
      ...closingPosition,
      status: "closed",
      exitPrice,
      exitDate: new Date().toISOString(),
      realizedPnL: unrealizedPnL,
      notes: closeData.notes,
      closeReason: closeData.closeReason,
      lastUpdated: new Date().toLocaleTimeString(),
    }

    setPositions((prev) => prev.map((pos) => (pos.id === closingPosition.id ? closedPosition : pos)))

    // Close dialog first
    closeDialog()

    // Show success toast
    setTimeout(() => {
      toast({
        title: unrealizedPnL >= 0 ? "🎉 Position Closed - Profit!" : "📉 Position Closed - Loss",
        description: `${closingPosition.symbol} closed with ${unrealizedPnL >= 0 ? "+" : ""}$${formatPrice(Math.abs(unrealizedPnL))} P&L`,
      })
    }, 200)
  }, [closingPosition, closeData, calculatePnL, closeDialog, toast])

  const removePosition = useCallback(
    (id: string) => {
      const position = positions.find((p) => p.id === id)
      setPositions((prev) => prev.filter((pos) => pos.id !== id))

      toast({
        title: "🗑️ Position Removed",
        description: `${position?.symbol} position removed from portfolio`,
      })
    },
    [positions, toast],
  )

  const getRiskColor = useCallback((level: string) => {
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
  }, [])

  const getRiskProgress = useCallback((level: string, distance: number) => {
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
  }, [])

  // Calculate portfolio statistics
  const openPositions = positions.filter((p) => p.status === "open")
  const closedPositions = positions.filter((p) => p.status === "closed")

  const portfolioStats = {
    totalValue: openPositions.reduce((sum, pos) => sum + pos.positionSize, 0),
    totalPnL: openPositions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0),
    totalMargin: openPositions.reduce((sum, pos) => sum + pos.marginUsed, 0),
    criticalPositions: openPositions.filter((p) => p.riskLevel === "critical").length,
    highRiskPositions: openPositions.filter((p) => p.riskLevel === "high").length,
    profitablePositions: openPositions.filter((p) => p.unrealizedPnL > 0).length,
    losingPositions: openPositions.filter((p) => p.unrealizedPnL < 0).length,
    totalRealizedPnL: closedPositions.reduce((sum, pos) => sum + (pos.realizedPnL || 0), 0),
    winRate:
      closedPositions.length > 0
        ? (closedPositions.filter((p) => (p.realizedPnL || 0) > 0).length / closedPositions.length) * 100
        : 0,
  }

  return (
    <div className="space-y-4 px-2 sm:px-0">
      {/* Current Position Quick Add - Mobile Optimized */}
      {currentPosition && currentResult && (
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Plus className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Ready to Add</span>
              </div>
              <Button onClick={addCurrentPosition} size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Position
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block">Symbol</span>
                <p className="font-bold text-sm">{currentPosition.symbol}</p>
              </div>
              <div>
                <span className="text-muted-foreground block">Type</span>
                <Badge
                  variant={currentPosition.positionType === "long" ? "default" : "destructive"}
                  className="text-xs"
                >
                  {currentPosition.positionType.toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground block">Entry</span>
                <p className="font-mono font-semibold text-sm">${formatPrice(currentPosition.entryPrice)}</p>
              </div>
              <div>
                <span className="text-muted-foreground block">Leverage</span>
                <p className="font-mono font-semibold text-sm">{currentPosition.leverage}x</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Overview - Mobile Optimized */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Portfolio</span>
              <Badge variant="outline" className="text-xs">
                {openPositions.length} Open • {closedPositions.length} Closed
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setShowPnL(!showPnL)} className="p-2">
                {showPnL ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateAllPrices(positions)}
                disabled={isUpdating || openPositions.length === 0}
                className="p-2"
              >
                {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {lastUpdateTime && <p className="text-xs text-muted-foreground">Last updated: {lastUpdateTime}</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Portfolio Statistics - Mobile Grid */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">${formatPrice(portfolioStats.totalValue)}</p>
              <p className="text-xs text-muted-foreground font-medium">Position Value</p>
            </div>
            <div className="text-center">
              <p
                className={`text-lg font-bold ${
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
              <p className="text-xs text-muted-foreground font-medium">Unrealized P&L</p>
            </div>
            <div className="text-center">
              <p
                className={`text-lg font-bold ${
                  showPnL
                    ? portfolioStats.totalRealizedPnL >= 0
                      ? "text-green-500"
                      : "text-red-500"
                    : "text-muted-foreground"
                }`}
              >
                {showPnL ? (
                  <>
                    {portfolioStats.totalRealizedPnL >= 0 ? "+" : ""}$
                    {formatPrice(Math.abs(portfolioStats.totalRealizedPnL))}
                  </>
                ) : (
                  "***"
                )}
              </p>
              <p className="text-xs text-muted-foreground font-medium">Realized P&L</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{portfolioStats.winRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground font-medium">Win Rate</p>
            </div>
          </div>

          {/* Risk Alerts */}
          {portfolioStats.criticalPositions > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 rounded-lg">
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 mb-1">
                <AlertTriangle className="h-4 w-4 animate-pulse" />
                <span className="font-bold text-sm">CRITICAL RISK</span>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400">
                {portfolioStats.criticalPositions} position(s) close to liquidation!
              </p>
            </div>
          )}

          {portfolioStats.highRiskPositions > 0 && portfolioStats.criticalPositions === 0 && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400 rounded-lg">
              <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400 mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold text-sm">High Risk</span>
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                {portfolioStats.highRiskPositions} position(s) at high risk.
              </p>
            </div>
          )}

          {/* Positions List - Mobile Optimized */}
          {positions.length > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold">Positions</h3>
                <Badge variant="secondary" className="text-xs">
                  {positions.length}
                </Badge>
              </div>

              {positions.map((position) => (
                <Card
                  key={position.id}
                  className={`border-l-4 ${
                    position.status === "closed"
                      ? "border-gray-400 opacity-75"
                      : position.riskLevel === "critical"
                        ? "border-red-500"
                        : position.riskLevel === "high"
                          ? "border-orange-500"
                          : position.riskLevel === "medium"
                            ? "border-yellow-500"
                            : "border-green-500"
                  }`}
                >
                  <CardContent className="p-4">
                    {/* Mobile Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-lg">{position.symbol}</h3>
                          <Badge
                            variant={position.positionType === "long" ? "default" : "destructive"}
                            className="text-xs px-2 py-1"
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
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={position.status === "open" ? "default" : "secondary"} className="text-xs">
                            {position.status.toUpperCase()}
                          </Badge>
                          {position.status === "open" && (
                            <Badge className={`text-xs px-2 py-1 ${getRiskColor(position.riskLevel)}`}>
                              {position.leverage}x • {position.riskLevel.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Mobile Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {position.status === "open" && (
                            <DropdownMenuItem onClick={() => openCloseDialog(position)} className="cursor-pointer">
                              <X className="h-4 w-4 mr-2" />
                              Close Position
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => removePosition(position.id)}
                            className="text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Mobile Price Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <span className="text-xs text-muted-foreground block mb-1">Entry</span>
                        <p className="font-mono font-bold text-sm">${formatPrice(position.entryPrice)}</p>
                      </div>
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <span className="text-xs text-muted-foreground block mb-1">
                          {position.status === "open" ? "Current" : "Exit"}
                        </span>
                        <p className="font-mono font-bold text-sm">
                          ${formatPrice(position.status === "open" ? position.currentPrice : position.exitPrice || 0)}
                        </p>
                      </div>
                      {position.status === "open" && (
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <span className="text-xs text-muted-foreground block mb-1">Liquidation</span>
                          <p className="font-mono font-bold text-sm text-red-600">
                            ${formatPrice(position.liquidationPrice)}
                          </p>
                        </div>
                      )}
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <span className="text-xs text-muted-foreground block mb-1">Size</span>
                        <p className="font-mono font-bold text-sm">${(position.positionSize / 1000).toFixed(1)}k</p>
                      </div>
                    </div>

                    {/* Mobile P&L Section */}
                    <div className="grid grid-cols-1 gap-3 mb-4">
                      <div
                        className={`p-3 rounded-lg border ${
                          showPnL
                            ? position.status === "open"
                              ? position.unrealizedPnL >= 0
                                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                              : (position.realizedPnL || 0) >= 0
                                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                            : "bg-muted/30"
                        }`}
                      >
                        <span className="text-xs text-muted-foreground block mb-1">
                          {position.status === "open" ? "Unrealized P&L" : "Realized P&L"}
                        </span>
                        <p
                          className={`font-bold text-lg ${
                            showPnL
                              ? position.status === "open"
                                ? position.unrealizedPnL >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                                : (position.realizedPnL || 0) >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {showPnL ? (
                            <>
                              {position.status === "open" ? (
                                <>
                                  {position.unrealizedPnL >= 0 ? "+" : ""}$
                                  {formatPrice(Math.abs(position.unrealizedPnL))}
                                  <span className="text-xs ml-2 opacity-75">
                                    ({position.unrealizedPnLPercentage >= 0 ? "+" : ""}
                                    {position.unrealizedPnLPercentage.toFixed(1)}%)
                                  </span>
                                </>
                              ) : (
                                <>
                                  {(position.realizedPnL || 0) >= 0 ? "+" : ""}$
                                  {formatPrice(Math.abs(position.realizedPnL || 0))}
                                </>
                              )}
                            </>
                          ) : (
                            "***"
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Risk Progress Bar for Open Positions */}
                    {position.status === "open" && (
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Distance to Liquidation</span>
                          <div className="flex items-center space-x-1">
                            <span
                              className={`text-xs font-bold ${
                                position.riskLevel === "critical"
                                  ? "text-red-500"
                                  : position.riskLevel === "high"
                                    ? "text-orange-500"
                                    : position.riskLevel === "medium"
                                      ? "text-yellow-500"
                                      : "text-green-500"
                              }`}
                            >
                              {position.distanceToLiquidation.toFixed(1)}%
                            </span>
                            {position.riskLevel === "critical" && (
                              <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />
                            )}
                          </div>
                        </div>
                        <div className="relative">
                          <Progress
                            value={getRiskProgress(position.riskLevel, position.distanceToLiquidation)}
                            className={`h-2 ${
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
                                ? "DANGER"
                                : position.riskLevel === "high"
                                  ? "HIGH RISK"
                                  : position.riskLevel === "medium"
                                    ? "MEDIUM"
                                    : "SAFE"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Closed Position Details */}
                    {position.status === "closed" && (
                      <div className="space-y-2 mb-4">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground">Close Date:</span>
                            <p className="font-medium">{new Date(position.exitDate || "").toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Reason:</span>
                            <p className="font-medium capitalize">{position.closeReason?.replace("_", " ")}</p>
                          </div>
                        </div>
                        {position.notes && (
                          <div className="p-2 bg-muted/20 rounded-lg">
                            <div className="flex items-center space-x-1 mb-1">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-medium">Notes:</span>
                            </div>
                            <p className="text-xs">{position.notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Critical Warning */}
                    {position.status === "open" && position.riskLevel === "critical" && (
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg mb-3">
                        <div className="flex items-center space-x-1">
                          <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />
                          <span className="text-xs text-red-600 dark:text-red-400 font-bold">LIQUIDATION RISK!</span>
                        </div>
                      </div>
                    )}

                    {/* Position Timestamps */}
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Added: {new Date(position.addedAt).toLocaleDateString()}</span>
                        </div>
                        <span>Updated: {position.lastUpdated}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Empty State - Mobile Optimized
            <Card className="border-dashed border-2">
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Positions</h3>
                <p className="text-muted-foreground text-sm mb-4 px-4">
                  Calculate positions using the Calculator tab, then add them here to track performance.
                </p>
                {currentPosition && currentResult ? (
                  <Button onClick={addCurrentPosition} size="sm" className="w-full max-w-xs">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your Position
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">Go to Calculator and calculate a position first</p>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Close Position Dialog - Mobile Optimized */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Close Position: {closingPosition?.symbol}</DialogTitle>
            <DialogDescription className="text-sm">
              Enter the exit price and details for closing this position
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exitPrice" className="text-sm">
                Exit Price
              </Label>
              <Input
                id="exitPrice"
                type="number"
                step="0.01"
                placeholder="Enter exit price"
                value={closeData.exitPrice}
                onChange={(e) => setCloseData((prev) => ({ ...prev, exitPrice: e.target.value }))}
                className="text-base h-12"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closeReason" className="text-sm">
                Close Reason
              </Label>
              <select
                id="closeReason"
                className="w-full p-3 border rounded-md text-base h-12 bg-background"
                value={closeData.closeReason}
                onChange={(e) => setCloseData((prev) => ({ ...prev, closeReason: e.target.value as any }))}
              >
                <option value="manual">Manual Close</option>
                <option value="take_profit">Take Profit</option>
                <option value="stop_loss">Stop Loss</option>
                <option value="liquidated">Liquidated</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this trade..."
                value={closeData.notes}
                onChange={(e) => setCloseData((prev) => ({ ...prev, notes: e.target.value }))}
                className="text-base min-h-[80px] resize-none"
                autoComplete="off"
              />
            </div>
            {closeData.exitPrice && closingPosition && !isNaN(Number.parseFloat(closeData.exitPrice)) && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-1">Estimated P&L:</p>
                <p
                  className={`text-xl font-bold ${
                    calculatePnL(closingPosition, Number.parseFloat(closeData.exitPrice)).unrealizedPnL >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {calculatePnL(closingPosition, Number.parseFloat(closeData.exitPrice)).unrealizedPnL >= 0 ? "+" : ""}$
                  {formatPrice(
                    Math.abs(calculatePnL(closingPosition, Number.parseFloat(closeData.exitPrice)).unrealizedPnL),
                  )}
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={closePosition}
                className="w-full h-12 text-base font-medium"
                disabled={!closeData.exitPrice || isNaN(Number.parseFloat(closeData.exitPrice))}
              >
                Close Position
              </Button>
              <Button variant="outline" onClick={closeDialog} className="w-full h-12 text-base bg-transparent">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
