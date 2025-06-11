"use client"

import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts"
import { formatPrice } from "@/lib/crypto-api"
import { useState, useEffect } from "react"
import { TrendingUp, AlertTriangle } from "lucide-react"

interface PriceChartProps {
  data: Array<{ time: string; price: number }>
  liquidationPrice?: number
  entryPrice?: number
  symbol?: string
  positionType?: "long" | "short"
}

// Generate realistic price simulation around a base price
const generatePriceSimulation = (basePrice: number, symbol = "BTC", points = 20) => {
  const data = []
  let currentPrice = basePrice
  const volatility = symbol === "BTC" ? 0.02 : symbol === "ETH" ? 0.03 : 0.05 // Different volatility for different assets

  for (let i = 0; i < points; i++) {
    const timeAgo = new Date(Date.now() - (points - i) * 60000) // 1 minute intervals
    const timeString = timeAgo.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    })

    // Generate realistic price movement
    const change = (Math.random() - 0.5) * volatility * currentPrice
    currentPrice = Math.max(currentPrice + change, basePrice * 0.8) // Prevent price from going too low

    data.push({
      time: timeString,
      price: Number(currentPrice.toFixed(8)),
    })
  }

  return data
}

export function PriceChart({
  data,
  liquidationPrice,
  entryPrice,
  symbol = "BTC",
  positionType = "long",
}: PriceChartProps) {
  const [chartData, setChartData] = useState<Array<{ time: string; price: number }>>([])
  const [isSimulated, setIsSimulated] = useState(false)

  useEffect(() => {
    if (data && data.length > 0) {
      setChartData(data)
      setIsSimulated(false)
    } else if (entryPrice && entryPrice > 0) {
      // Generate simulated data around entry price
      const simulatedData = generatePriceSimulation(entryPrice, symbol)
      setChartData(simulatedData)
      setIsSimulated(true)
    } else {
      setChartData([])
      setIsSimulated(false)
    }
  }, [data, entryPrice, symbol])

  if (chartData.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center border rounded-lg bg-gradient-to-br from-muted/20 to-muted/40">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-2">No price data available</p>
          <p className="text-sm text-muted-foreground">Calculate a position or enable live price to see the chart</p>
        </div>
      </div>
    )
  }

  const currentPrice = chartData[chartData.length - 1]?.price || 0
  const prices = chartData.map((d) => d.price)
  const minPrice = Math.min(
    ...prices,
    liquidationPrice || Number.POSITIVE_INFINITY,
    entryPrice || Number.POSITIVE_INFINITY,
  )
  const maxPrice = Math.max(...prices, liquidationPrice || 0, entryPrice || 0)
  const padding = (maxPrice - minPrice) * 0.15 || 1

  // Calculate risk zones
  const liquidationZone = liquidationPrice
    ? {
        start: positionType === "long" ? minPrice - padding : liquidationPrice,
        end: positionType === "long" ? liquidationPrice : maxPrice + padding,
      }
    : null

  // Determine if current price is in danger zone
  const isDangerZone = liquidationPrice && Math.abs(currentPrice - liquidationPrice) / currentPrice < 0.1

  // Custom tooltip component to fix the display issues
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium mb-1">Time: {label}</p>
          <p className="text-sm text-primary">
            Price: <span className="font-mono">${formatPrice(payload[0].value)}</span>
          </p>
          {liquidationPrice && (
            <p className="text-sm text-red-500 mt-1">
              Liquidation: <span className="font-mono">${formatPrice(liquidationPrice)}</span>
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-card to-muted/20 rounded-lg border">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isSimulated ? "bg-yellow-500" : "bg-green-500"} animate-pulse`} />
            <span className="text-sm font-medium">{isSimulated ? "Simulated Data" : "Live Data"}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {symbol} • {chartData.length} points
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Current Price</p>
            <p className="text-lg font-bold">${formatPrice(currentPrice)}</p>
          </div>
          {isDangerZone && (
            <div className="flex items-center space-x-1 text-red-500">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">DANGER ZONE</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-80 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="dangerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis
              domain={[minPrice - padding, maxPrice + padding]}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value >= 1 ? value.toFixed(0) : value.toFixed(4)}`}
            />

            {/* Use custom tooltip component */}
            <Tooltip content={<CustomTooltip />} />

            {/* Liquidation Zone */}
            {liquidationZone && (
              <Area
                dataKey="price"
                stroke="none"
                fill="url(#dangerGradient)"
                domain={[liquidationZone.start, liquidationZone.end]}
              />
            )}

            {/* Main Price Line */}
            <Area
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{
                r: 6,
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2,
              }}
            />

            {/* Reference Lines */}
            {liquidationPrice && liquidationPrice > 0 && (
              <ReferenceLine
                y={liquidationPrice}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="8 4"
                label={{
                  value: `⚠️ Liquidation: $${formatPrice(liquidationPrice)}`,
                  position: "topRight",
                  style: {
                    fontSize: "12px",
                    fill: "#ef4444",
                    fontWeight: "bold",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    padding: "4px 8px",
                    borderRadius: "4px",
                  },
                }}
              />
            )}

            {entryPrice && entryPrice > 0 && (
              <ReferenceLine
                y={entryPrice}
                stroke="#22c55e"
                strokeWidth={2}
                strokeDasharray="8 4"
                label={{
                  value: `🎯 Entry: $${formatPrice(entryPrice)}`,
                  position: "topLeft",
                  style: {
                    fontSize: "12px",
                    fill: "#22c55e",
                    fontWeight: "bold",
                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                    padding: "4px 8px",
                    borderRadius: "4px",
                  },
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-primary rounded-full" />
          <span className="text-sm">Price Movement</span>
        </div>
        {entryPrice && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm">Entry Price</span>
          </div>
        )}
        {liquidationPrice && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-sm">Liquidation Level</span>
          </div>
        )}
        {isSimulated && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-sm">Simulated Data</span>
          </div>
        )}
      </div>
    </div>
  )
}
