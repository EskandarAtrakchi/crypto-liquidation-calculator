"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalculatorForm } from "./calculator-form"
import { PriceChart } from "./price-chart"
import { RiskAnalysis } from "./risk-analysis"
import { PositionSummary } from "./position-summary"
import { MarketOverview } from "./market-overview"
import { PortfolioTracker } from "./portfolio-tracker"
import { RiskAlerts } from "./risk-alerts"
import { TradingJournal } from "./trading-journal"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, BarChart3, Shield, Target, DollarSign, Bell, BookOpen } from "lucide-react"
import { ProfitLossCalculator } from "./profit-loss-calculator"

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
  const [activeTab, setActiveTab] = useState("calculator")

  const handleCalculate = (calcResult: CalculationResult, calcPosition: Position) => {
    setResult(calcResult)
    setPosition(calcPosition)
    console.log("New position calculated:", calcPosition, calcResult)
  }

  return (
    <div className="space-y-8" id="calculator">
      {/* Enhanced Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1">
          <TabsTrigger value="calculator" className="flex items-center space-x-2 py-3">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Calculator</span>
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="flex items-center space-x-2 py-3">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Portfolio</span>
            {position && result && (
              <Badge variant="destructive" className="ml-1 text-xs animate-pulse">
                NEW
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center space-x-2 py-3">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="journal" className="flex items-center space-x-2 py-3">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Journal</span>
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center space-x-2 py-3">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Learn</span>
          </TabsTrigger>
        </TabsList>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
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
                  <CalculatorForm onCalculate={handleCalculate} onPriceUpdate={setPriceData} />
                </CardContent>
              </Card>

              {/* Enhanced Price Chart */}
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
                  <ProfitLossCalculator position={position} result={result} />
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
        </TabsContent>

        {/* Portfolio Tab - Now properly integrated */}
        <TabsContent value="portfolio" className="space-y-6">
          <PortfolioTracker currentPosition={position} currentResult={result} />
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <RiskAlerts />
        </TabsContent>

        {/* Journal Tab */}
        <TabsContent value="journal" className="space-y-6">
          <TradingJournal />
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <span>Risk Management 101</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">🎯 Position Sizing</h4>
                    <p className="text-sm text-muted-foreground">
                      Never risk more than 1-2% of your total capital on a single trade. This ensures you can survive
                      losing streaks.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">📊 Leverage Guidelines</h4>
                    <p className="text-sm text-muted-foreground">
                      Start with low leverage (2-5x). Higher leverage amplifies both gains and losses exponentially.
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">🛑 Stop Losses</h4>
                    <p className="text-sm text-muted-foreground">
                      Always set stop losses before entering a trade. Stick to your plan and don't move stops against
                      you.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span>Trading Psychology</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">🧠 Emotional Control</h4>
                    <p className="text-sm text-muted-foreground">
                      Fear and greed are your biggest enemies. Stick to your trading plan and avoid emotional decisions.
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">📝 Keep a Journal</h4>
                    <p className="text-sm text-muted-foreground">
                      Document every trade with reasons, emotions, and outcomes. Learn from both wins and losses.
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">⏰ Patience Pays</h4>
                    <p className="text-sm text-muted-foreground">
                      Wait for high-probability setups. It's better to miss a trade than to force a bad one.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  <span>Common Liquidation Scenarios</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
                    <h4 className="font-semibold text-sm mb-2 text-red-600">⚠️ Over-Leveraging</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Using 50x+ leverage means a 2% price move against you = liquidation
                    </p>
                    <Badge variant="destructive" className="text-xs">
                      High Risk
                    </Badge>
                  </div>
                  <div className="p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                    <h4 className="font-semibold text-sm mb-2 text-yellow-600">📉 Market Volatility</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Crypto markets can move 10-20% in hours, especially during news events
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      Medium Risk
                    </Badge>
                  </div>
                  <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <h4 className="font-semibold text-sm mb-2 text-blue-600">🎯 Proper Sizing</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Using 2-5x leverage with proper position sizing gives you room to breathe
                    </p>
                    <Badge variant="default" className="text-xs">
                      Low Risk
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
