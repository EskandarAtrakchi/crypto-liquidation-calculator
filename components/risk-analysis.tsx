"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Shield } from "lucide-react"
import type { Position, CalculationResult } from "./liquidation-calculator"

interface RiskAnalysisProps {
  position: Position
  result: CalculationResult
}

export function RiskAnalysis({ position, result }: RiskAnalysisProps) {
  // Fixed risk level calculation - higher leverage = higher risk
  const getRiskLevel = (leverage: number) => {
    if (leverage <= 5) return { level: "Low", color: "text-green-500", bgColor: "bg-green-500" }
    if (leverage <= 15) return { level: "Medium", color: "text-yellow-500", bgColor: "bg-yellow-500" }
    return { level: "High", color: "text-red-500", bgColor: "bg-red-500" }
  }

  // Use leverage for risk calculation instead of risk percentage
  const risk = getRiskLevel(position.leverage)
  const priceDistance = Math.abs(position.entryPrice - result.liquidationPrice)
  const priceDistancePercentage = (priceDistance / position.entryPrice) * 100

  // Calculate risk score based on leverage (0-100)
  const riskScore = Math.min(Math.max((position.leverage - 1) * 5, 0), 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Risk Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Risk Level</span>
            <span className={`font-medium ${risk.color}`}>{risk.level}</span>
          </div>
          <Progress value={riskScore} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {position.leverage}x leverage - {result.riskPercentage.toFixed(1)}% of position at risk
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Distance to Liquidation</span>
            <span className="font-medium">{priceDistancePercentage.toFixed(2)}%</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Price Movement Needed</span>
            <span className="font-medium">${priceDistance.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Profit/Loss Multiplier</span>
            <span className="font-medium">{result.profitLossRatio}x</span>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Risk Warning:</p>
              <p>
                High leverage ({position.leverage}x) significantly increases both potential profits and losses. Always
                use proper risk management and never risk more than you can afford to lose.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
