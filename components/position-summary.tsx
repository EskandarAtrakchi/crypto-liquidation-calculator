"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Target, Coins } from "lucide-react"
import { formatPrice } from "@/lib/crypto-api"
import type { Position, CalculationResult } from "./liquidation-calculator"

interface PositionSummaryProps {
  position: Position
  result: CalculationResult
}

export function PositionSummary({ position, result }: PositionSummaryProps) {
  const isLong = position.positionType === "long"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {isLong ? (
            <TrendingUp className="h-5 w-5 text-green-500" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-500" />
          )}
          <span>Position Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Position Type</span>
          <Badge variant={isLong ? "default" : "destructive"}>{isLong ? "LONG 📈" : "SHORT 📉"}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center">
            <Coins className="h-4 w-4 mr-1" />
            Asset
          </span>
          <span className="font-medium">{position.symbol}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Entry Price</span>
          <span className="font-medium">${formatPrice(position.entryPrice)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Leverage</span>
          <span
            className={`font-medium ${position.leverage > 10 ? "text-red-500" : position.leverage > 5 ? "text-yellow-500" : "text-green-500"}`}
          >
            {position.leverage}x
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Position Size</span>
          <span className="font-medium">${position.positionSize.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Margin Used</span>
          <span className="font-medium">${formatPrice(position.marginUsed)}</span>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center space-x-1">
              <Target className="h-4 w-4" />
              <span>Liquidation Price</span>
            </span>
            <span className="font-bold text-lg text-destructive">${formatPrice(result.liquidationPrice)}</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            <p>
              Your position will be liquidated if {position.symbol} price {isLong ? "falls to" : "rises to"} $
              {formatPrice(result.liquidationPrice)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
