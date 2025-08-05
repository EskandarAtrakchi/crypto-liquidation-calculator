"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, TrendingDown, DollarSign, Target, Calculator, Percent } from "lucide-react"
import { formatPrice } from "@/lib/crypto-api"
import type { Position, CalculationResult } from "./liquidation-calculator"

interface ProfitLossCalculatorProps {
  position: Position
  result: CalculationResult
}

interface ProfitLossResult {
  exitPrice: number
  profitLoss: number
  profitLossPercentage: number
  roi: number
  totalReturn: number
}

export function ProfitLossCalculator({ position, result }: ProfitLossCalculatorProps) {
  const [exitPrice, setExitPrice] = useState("")
  const [profitLossResult, setProfitLossResult] = useState<ProfitLossResult | null>(null)
  const [quickExitPrices, setQuickExitPrices] = useState<Array<{ price: number; label: string }>>([])

  // Generate quick exit price options based on position type and entry price
  useEffect(() => {
    const entryPrice = position.entryPrice
    const isLong = position.positionType === "long"

    const percentages = [-20, -10, -5, 5, 10, 20]
    const prices = percentages.map((pct) => {
      const price = entryPrice * (1 + pct / 100)
      return {
        price: Number(price.toFixed(8)),
        label: `${pct > 0 ? "+" : ""}${pct}%`,
      }
    })

    setQuickExitPrices(prices)
  }, [position.entryPrice])

  const calculateProfitLoss = (exitPriceValue: number) => {
    const entryPrice = position.entryPrice
    const leverage = position.leverage
    const positionSize = position.positionSize
    const isLong = position.positionType === "long"

    // Calculate price change percentage
    const priceChangePercentage = ((exitPriceValue - entryPrice) / entryPrice) * 100

    // For short positions, profit/loss is inverted
    const effectivePriceChange = isLong ? priceChangePercentage : -priceChangePercentage

    // Calculate leveraged return
    const leveragedReturn = effectivePriceChange * leverage

    // Calculate actual profit/loss in USD
    const profitLoss = (positionSize * leveragedReturn) / 100

    // Calculate ROI on margin used
    const marginUsed = positionSize / leverage
    const roi = (profitLoss / marginUsed) * 100

    // Total return (initial position size + profit/loss)
    const totalReturn = positionSize + profitLoss

    return {
      exitPrice: exitPriceValue,
      profitLoss,
      profitLossPercentage: leveragedReturn,
      roi,
      totalReturn,
    }
  }

  const handleExitPriceChange = (value: string) => {
    setExitPrice(value)
    const exitPriceNum = Number.parseFloat(value)

    if (!isNaN(exitPriceNum) && exitPriceNum > 0) {
      const result = calculateProfitLoss(exitPriceNum)
      setProfitLossResult(result)
    } else {
      setProfitLossResult(null)
    }
  }

  const handleQuickPrice = (price: number) => {
    setExitPrice(price.toString())
    handleExitPriceChange(price.toString())
  }

  const isProfit = profitLossResult ? profitLossResult.profitLoss > 0 : false
  const isLiquidated = profitLossResult
    ? position.positionType === "long"
      ? profitLossResult.exitPrice <= result.liquidationPrice
      : profitLossResult.exitPrice >= result.liquidationPrice
    : false

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="h-5 w-5" />
          <span>Profit/Loss Calculator</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Exit Price Input */}
        <div className="space-y-2">
          <Label htmlFor="exitPrice">Exit Price (USD)</Label>
          <Input
            id="exitPrice"
            type="number"
            placeholder="Enter exit price"
            value={exitPrice}
            onChange={(e) => handleExitPriceChange(e.target.value)}
            step="0.00000001"
            min="0"
            className="font-mono"
          />
        </div>

        {/* Quick Price Buttons */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Quick Exit Prices:</Label>
          <div className="grid grid-cols-3 gap-2">
            {quickExitPrices.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickPrice(item.price)}
                className="text-xs"
              >
                {item.label}
                <br />${formatPrice(item.price)}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Results */}
        {profitLossResult && (
          <div className="space-y-4">
            {/* Liquidation Warning */}
            {isLiquidated && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <Target className="h-4 w-4" />
                  <span className="font-medium text-sm">Position Liquidated!</span>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  This exit price would trigger liquidation. Maximum loss: ${formatPrice(position.marginUsed)}
                </p>
              </div>
            )}

            {/* Main Results */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Profit/Loss
                  </span>
                  <div className="text-right">
                    <div className={`font-bold text-lg ${isProfit ? "text-green-500" : "text-red-500"}`}>
                      {isProfit ? "+" : ""}${formatPrice(Math.abs(profitLossResult.profitLoss))}
                    </div>
                    <div className={`text-xs ${isProfit ? "text-green-500" : "text-red-500"}`}>
                      {isProfit ? "+" : ""}
                      {profitLossResult.profitLossPercentage.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Percent className="h-4 w-4 mr-1" />
                    ROI on Margin
                  </span>
                  <span className={`font-medium ${profitLossResult.roi > 0 ? "text-green-500" : "text-red-500"}`}>
                    {profitLossResult.roi > 0 ? "+" : ""}
                    {profitLossResult.roi.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Return</span>
                  <span className="font-medium">${formatPrice(profitLossResult.totalReturn)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price Change</span>
                  <span
                    className={`font-medium ${
                      profitLossResult.exitPrice > position.entryPrice ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {(((profitLossResult.exitPrice - position.entryPrice) / position.entryPrice) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Position Summary */}
            <div className="bg-muted/30 p-3 rounded-lg space-y-2">
              <h4 className="font-medium text-sm flex items-center space-x-2">
                <span>Position Summary</span>
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
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Entry Price:</span>
                  <span className="ml-2 font-mono">${formatPrice(position.entryPrice)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Exit Price:</span>
                  <span className="ml-2 font-mono">${formatPrice(profitLossResult.exitPrice)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Position Size:</span>
                  <span className="ml-2 font-mono">${position.positionSize.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Leverage:</span>
                  <span className="ml-2 font-mono">{position.leverage}x</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Margin Used:</span>
                  <span className="ml-2 font-mono">${formatPrice(position.marginUsed)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Liquidation:</span>
                  <span className="ml-2 font-mono text-red-500">${formatPrice(result.liquidationPrice)}</span>
                </div>
              </div>
            </div>

            {/* Example Scenarios */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Example Scenarios:</Label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: "Break Even", price: position.entryPrice },
                  {
                    label: "10% Profit Target",
                    price: position.entryPrice * (position.positionType === "long" ? 1.1 : 0.9),
                  },
                  { label: "Liquidation Price", price: result.liquidationPrice },
                ].map((scenario, index) => {
                  const scenarioResult = calculateProfitLoss(scenario.price)
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded text-xs">
                      <span className="font-medium">{scenario.label}:</span>
                      <div className="text-right">
                        <span className="font-mono">${formatPrice(scenario.price)}</span>
                        <span className={`ml-2 ${scenarioResult.profitLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {scenarioResult.profitLoss >= 0 ? "+" : ""}${formatPrice(Math.abs(scenarioResult.profitLoss))}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {!profitLossResult && (
          <div className="text-center py-8 text-muted-foreground">
            <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Enter an exit price to calculate profit/loss</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
