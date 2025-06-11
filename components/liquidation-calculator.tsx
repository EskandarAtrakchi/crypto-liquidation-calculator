"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalculatorForm } from "./calculator-form"
import { PriceChart } from "./price-chart"
import { RiskAnalysis } from "./risk-analysis"
import { PositionSummary } from "./position-summary"
import { MarketOverview } from "./market-overview"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, BarChart3, Shield, Target } from "lucide-react"

export interface CalculationResult {
  liquidationPrice: number
  marginRequired: number
  riskPercentage: number
  profitLossRatio: number
  positionSize: number
}

export interface Position {
  symbol: string
  entryPrice: number
  leverage: number
  positionType: "long" | "short"
  positionSize: number
  marginUsed: number
}

export function LiquidationCalculator() {
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const [priceData, setPriceData] = useState<Array<{ time: string; price: number }>>([])

  return (
    <div className="space-y-8" id="calculator">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Overview */}
        <div className="lg:col-span-3">
          <MarketOverview />
        </div>

        {/* Main Calculator */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="gradient-border relative z-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-6 w-6 text-primary" />
                <span>Liquidation Calculator</span>
                <Badge variant="secondary" className="ml-auto">
                  Pro
                </Badge>
              </CardTitle>
              <CardDescription>
                Calculate liquidation prices and analyze your trading positions with advanced risk management
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <CalculatorForm
                onCalculate={(calc, pos) => {
                  setResult(calc)
                  setPosition(pos)
                }}
                onPriceUpdate={setPriceData}
              />
            </CardContent>
          </Card>

          {/* Enhanced Price Chart - Always show */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Price Chart & Analysis</span>
                {result && (
                  <Badge variant="outline" className="ml-auto">
                    {position?.positionType === "long" ? "📈 Long" : "📉 Short"}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {priceData.length > 0 || (position && result)
                  ? "Interactive price movement with liquidation levels and risk zones"
                  : "Calculate a position to see dynamic price simulation and risk analysis"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PriceChart
                data={priceData}
                liquidationPrice={result?.liquidationPrice}
                entryPrice={position?.entryPrice}
                symbol={position?.symbol}
                positionType={position?.positionType}
              />
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Results Panel */}
        <div className="space-y-6">
          {result && position ? (
            <>
              <PositionSummary position={position} result={result} />
              <RiskAnalysis position={position} result={result} />
            </>
          ) : (
            <Card className="border-dashed border-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-muted-foreground">
                  <Shield className="h-5 w-5" />
                  <span>Position Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">No position calculated yet</p>
                  <p className="text-sm text-muted-foreground">
                    Enter your trading parameters and calculate to see detailed risk analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Enhanced Additional Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🚀 Advanced Features</span>
            <Badge variant="outline">New</Badge>
          </CardTitle>
          <CardDescription>Explore additional tools and educational resources</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="features" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="features">✨ Features</TabsTrigger>
              <TabsTrigger value="education">📚 Education</TabsTrigger>
              <TabsTrigger value="api">🔌 API Info</TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:shadow-md transition-all duration-200">
                  <h3 className="font-semibold mb-2 flex items-center space-x-2">
                    <span>🌐 Multi-Asset Support</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Calculate liquidation prices for Bitcoin, Ethereum, and 100+ major cryptocurrencies with real-time
                    data
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:shadow-md transition-all duration-200">
                  <h3 className="font-semibold mb-2 flex items-center space-x-2">
                    <span>📊 Dynamic Charts</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Interactive price charts with simulated data, liquidation zones, and real-time risk visualization
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:shadow-md transition-all duration-200">
                  <h3 className="font-semibold mb-2 flex items-center space-x-2">
                    <span>🛡️ Risk Management</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced risk analysis, position sizing recommendations, and danger zone alerts
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="education" className="mt-6">
              <div className="prose dark:prose-invert max-w-none">
                <h3>🎓 Understanding Liquidation</h3>
                <p>
                  Liquidation occurs when your position's losses approach your margin balance. Understanding liquidation
                  prices helps you manage risk effectively and protect your capital.
                </p>
                <h4>🔑 Key Concepts:</h4>
                <ul>
                  <li>
                    <strong>📈 Leverage:</strong> Amplifies both profits and losses - use with caution!
                  </li>
                  <li>
                    <strong>💰 Margin:</strong> The collateral required to open a leveraged position
                  </li>
                  <li>
                    <strong>⚠️ Liquidation Price:</strong> The price at which your position gets automatically closed
                  </li>
                  <li>
                    <strong>🎯 Risk Management:</strong> Never risk more than you can afford to lose
                  </li>
                </ul>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mt-4">
                  <p className="text-sm">
                    <strong>⚠️ Warning:</strong> This calculator is for educational purposes only. Always do your own
                    research and consider consulting with a financial advisor before making trading decisions.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="api" className="mt-6">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center space-x-2">
                    <span>🔌 API Information</span>
                    <Badge variant="outline">Live</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    This application uses reliable APIs for real-time cryptocurrency data:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Alternative.me API for comprehensive cryptocurrency data</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>Support for 100+ major cryptocurrencies</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      <span>Rate limiting and error handling implemented</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      <span>Real-time price updates every 30 seconds</span>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
