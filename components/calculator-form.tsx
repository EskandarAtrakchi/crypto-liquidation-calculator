"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, RefreshCw, Search, TrendingUp, TrendingDown, Zap, Calculator } from "lucide-react"
import { fetchCryptoBySymbol, POPULAR_CRYPTOS, formatPrice, formatPercentage } from "@/lib/crypto-api"
import type { CalculationResult, Position } from "./liquidation-calculator"
import type { CryptoData } from "@/lib/crypto-api"

interface CalculatorFormProps {
  onCalculate: (result: CalculationResult, position: Position) => void
  onPriceUpdate: (data: Array<{ time: string; price: number }>) => void
}

export function CalculatorForm({ onCalculate, onPriceUpdate }: CalculatorFormProps) {
  const [cryptoSymbol, setCryptoSymbol] = useState("BTC")
  const [entryPrice, setEntryPrice] = useState("")
  const [leverage, setLeverage] = useState("")
  const [positionType, setPositionType] = useState<"long" | "short">("long")
  const [positionSize, setPositionSize] = useState("1000")
  const [useLivePrice, setUseLivePrice] = useState(false)
  const [useCustomPrice, setUseCustomPrice] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)
  const [cryptoData, setCryptoData] = useState<CryptoData | null>(null)
  const [symbolNotFound, setSymbolNotFound] = useState(false)
  const [priceHistory, setPriceHistory] = useState<Array<{ time: string; price: number }>>([])
  const [isCalculated, setIsCalculated] = useState(false)
  const { toast } = useToast()

  const shouldUpdateParent = useRef(true)

  useEffect(() => {
    if (shouldUpdateParent.current) {
      onPriceUpdate(priceHistory)
    }
  }, [priceHistory, onPriceUpdate])

  const addPriceToHistory = useCallback((price: number) => {
    const now = new Date()
    const timeString = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })

    const newDataPoint = { time: timeString, price }

    setPriceHistory((prev) => {
      const updated = [...prev, newDataPoint].slice(-20)
      return updated
    })
  }, [])

  const fetchLivePrice = async (symbol: string = cryptoSymbol) => {
    if (useCustomPrice) return

    setIsLoadingPrice(true)
    setSymbolNotFound(false)

    try {
      const data = await fetchCryptoBySymbol(symbol)

      if (data) {
        setCryptoData(data)
        const price = data.quotes.USD.price
        setEntryPrice(price.toString())
        addPriceToHistory(price)

        toast({
          title: "🚀 Price Updated",
          description: `Latest ${data.symbol} price: $${formatPrice(price)}`,
        })
      } else {
        setSymbolNotFound(true)
        setCryptoData(null)
        toast({
          title: "❌ Symbol Not Found",
          description: `Could not find cryptocurrency with symbol "${symbol}". You can still enter a custom price.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "⚠️ Error",
        description: "Failed to fetch live price. You can enter a custom price instead.",
        variant: "destructive",
      })
      setSymbolNotFound(true)
    } finally {
      setIsLoadingPrice(false)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (useLivePrice && !useCustomPrice && cryptoSymbol) {
      fetchLivePrice()
      interval = setInterval(() => {
        fetchLivePrice()
      }, 30000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [useLivePrice, cryptoSymbol, useCustomPrice])

  const handleSymbolChange = (value: string) => {
    const newSymbol = value.toUpperCase()
    setCryptoSymbol(newSymbol)
    setSymbolNotFound(false)
    setCryptoData(null)
    setIsCalculated(false)

    shouldUpdateParent.current = false
    setPriceHistory([])

    setTimeout(() => {
      shouldUpdateParent.current = true
      onPriceUpdate([])
    }, 0)

    if (useLivePrice && !useCustomPrice) {
      fetchLivePrice(newSymbol)
    }
  }

  const handleCustomPriceToggle = () => {
    const newValue = !useCustomPrice
    setUseCustomPrice(newValue)
    if (newValue) {
      setUseLivePrice(false)
      setCryptoData(null)
      shouldUpdateParent.current = false
      setPriceHistory([])

      setTimeout(() => {
        shouldUpdateParent.current = true
        onPriceUpdate([])
      }, 0)
    }
  }

  const handleLivePriceToggle = () => {
    const newValue = !useLivePrice
    setUseLivePrice(newValue)
    if (newValue) {
      setUseCustomPrice(false)
      if (cryptoSymbol) {
        fetchLivePrice()
      }
    } else {
      setCryptoData(null)
      shouldUpdateParent.current = false
      setPriceHistory([])

      setTimeout(() => {
        shouldUpdateParent.current = true
        onPriceUpdate([])
      }, 0)
    }
  }

  const calculateLiquidation = () => {
    setIsLoading(true)

    // Add a small delay for better UX
    setTimeout(() => {
      try {
        const entryPriceNum = Number.parseFloat(entryPrice)
        const leverageNum = Number.parseFloat(leverage)
        const positionSizeNum = Number.parseFloat(positionSize) || 1000

        if (isNaN(entryPriceNum) || isNaN(leverageNum) || leverageNum <= 1) {
          throw new Error("Please enter valid numbers. Leverage must be greater than 1.")
        }

        if (entryPriceNum <= 0) {
          throw new Error("Entry price must be greater than 0.")
        }

        // Calculate liquidation price
        let liquidationPrice: number
        if (positionType === "long") {
          liquidationPrice = entryPriceNum * (1 - 1 / leverageNum)
        } else {
          liquidationPrice = entryPriceNum * (1 + 1 / leverageNum)
        }

        // Calculate other metrics
        const marginRequired = positionSizeNum / leverageNum
        const riskPercentage = (1 / leverageNum) * 100
        const profitLossRatio = leverageNum

        const result: CalculationResult = {
          liquidationPrice: Number.parseFloat(liquidationPrice.toFixed(8)),
          marginRequired,
          riskPercentage,
          profitLossRatio,
          positionSize: positionSizeNum,
        }

        const position: Position = {
          symbol: cryptoSymbol,
          entryPrice: entryPriceNum,
          leverage: leverageNum,
          positionType,
          positionSize: positionSizeNum,
          marginUsed: marginRequired,
        }

        onCalculate(result, position)
        setIsCalculated(true)

        // If no live price data, add entry price for chart visualization
        if (!useLivePrice && priceHistory.length === 0) {
          addPriceToHistory(entryPriceNum)
        }

        toast({
          title: "🎯 Calculation Complete!",
          description: `${positionType.toUpperCase()} position - Liquidation price: $${formatPrice(result.liquidationPrice)}`,
        })
      } catch (error) {
        toast({
          title: "❌ Calculation Error",
          description: error instanceof Error ? error.message : "Invalid input values",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }, 500)
  }

  const getRiskColor = () => {
    const lev = Number.parseFloat(leverage)
    if (lev <= 5) return "text-green-500"
    if (lev <= 10) return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <div className="space-y-6 relative z-10">
      {/* Enhanced Header */}
      <div className="text-center p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl border">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Calculator className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Position Calculator</h2>
        </div>
        <p className="text-sm text-muted-foreground">Calculate your liquidation price and analyze risk in real-time</p>
      </div>

      {/* Crypto Symbol and Position Type */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="crypto-symbol" className="flex items-center space-x-2">
              <span>Cryptocurrency Symbol</span>
              <Zap className="h-4 w-4 text-primary" />
            </Label>
            <div className="flex space-x-2">
              <Input
                id="crypto-symbol"
                type="text"
                placeholder="e.g., BTC, ETH, ADA"
                value={cryptoSymbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="uppercase font-mono transition-all duration-200 focus:scale-105"
                autoComplete="off"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchLivePrice()}
                disabled={isLoadingPrice}
                title="Search for cryptocurrency"
                type="button"
                className="transition-all duration-200 hover:scale-110"
              >
                {isLoadingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {/* Enhanced Popular cryptos */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground mr-2 self-center">Popular:</span>
              {POPULAR_CRYPTOS.slice(0, 6).map((crypto) => (
                <Button
                  key={crypto.symbol}
                  variant={cryptoSymbol === crypto.symbol ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-3 text-xs transition-all duration-200 hover:scale-105"
                  onClick={() => handleSymbolChange(crypto.symbol)}
                  type="button"
                >
                  {crypto.symbol}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="positionType">Position Type</Label>
            <Select value={positionType} onValueChange={(value: "long" | "short") => setPositionType(value)}>
              <SelectTrigger id="positionType" className="transition-all duration-200 focus:scale-105">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="long">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">Long (Buy) 📈</span>
                  </div>
                </SelectItem>
                <SelectItem value="short">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-red-600 font-medium">Short (Sell) 📉</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Position Type Indicator */}
            <div className="text-xs text-muted-foreground">
              {positionType === "long" ? (
                <span className="text-green-600">✓ Profit when price goes UP</span>
              ) : (
                <span className="text-red-600">✓ Profit when price goes DOWN</span>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced crypto data display */}
        {cryptoData && !useCustomPrice && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800 animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">
                {cryptoData.name} ({cryptoData.symbol})
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">Rank #{cryptoData.rank}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-2 bg-white/50 dark:bg-black/20 rounded">
                <span className="text-muted-foreground block">Price:</span>
                <p className="font-bold text-lg">${formatPrice(cryptoData.quotes.USD.price)}</p>
              </div>
              <div className="p-2 bg-white/50 dark:bg-black/20 rounded">
                <span className="text-muted-foreground block">24h Change:</span>
                <p
                  className={`font-bold ${cryptoData.quotes.USD.percentage_change_24h >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatPercentage(cryptoData.quotes.USD.percentage_change_24h)}
                </p>
              </div>
              <div className="p-2 bg-white/50 dark:bg-black/20 rounded">
                <span className="text-muted-foreground block">7d Change:</span>
                <p
                  className={`font-bold ${cryptoData.quotes.USD.percentage_change_7d >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatPercentage(cryptoData.quotes.USD.percentage_change_7d)}
                </p>
              </div>
              <div className="p-2 bg-white/50 dark:bg-black/20 rounded">
                <span className="text-muted-foreground block">Market Cap:</span>
                <p className="font-bold">${(cryptoData.quotes.USD.market_cap / 1e9).toFixed(2)}B</p>
              </div>
            </div>

            {priceHistory.length > 0 && (
              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                <div className="text-xs text-muted-foreground flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span>Chart data: {priceHistory.length} price points collected</span>
                </div>
              </div>
            )}
          </div>
        )}

        {symbolNotFound && !useCustomPrice && (
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg animate-in slide-in-from-top duration-300">
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Symbol "{cryptoSymbol}" not found in our database. You can still use a custom price below.
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Price Input Options */}
      <div className="space-y-4">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
            <button
              type="button"
              role="switch"
              aria-checked={useLivePrice}
              className={`h-6 w-11 rounded-full cursor-pointer relative transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                useLivePrice ? "bg-primary shadow-lg" : "bg-input"
              }`}
              onClick={handleLivePriceToggle}
            >
              <div
                className={`absolute h-5 w-5 rounded-full bg-background shadow-lg top-0.5 transition-transform duration-300 ${
                  useLivePrice ? "translate-x-5 left-0" : "translate-x-0 left-0.5"
                }`}
              />
            </button>
            <Label className="cursor-pointer flex items-center space-x-2 font-medium" onClick={handleLivePriceToggle}>
              <span>🔴 Use Live Price</span>
              {isLoadingPrice && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </Label>
            {useLivePrice && !useCustomPrice && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLivePrice()}
                disabled={isLoadingPrice}
                type="button"
                className="ml-auto transition-all duration-200 hover:scale-110"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
            <button
              type="button"
              role="switch"
              aria-checked={useCustomPrice}
              className={`h-6 w-11 rounded-full cursor-pointer relative transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                useCustomPrice ? "bg-primary shadow-lg" : "bg-input"
              }`}
              onClick={handleCustomPriceToggle}
            >
              <div
                className={`absolute h-5 w-5 rounded-full bg-background shadow-lg top-0.5 transition-transform duration-300 ${
                  useCustomPrice ? "translate-x-5 left-0" : "translate-x-0 left-0.5"
                }`}
              />
            </button>
            <Label className="cursor-pointer font-medium" onClick={handleCustomPriceToggle}>
              ✏️ Use Custom Price
            </Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="entryPrice" className="flex items-center space-x-2">
              <span>Entry Price (USD)</span>
              {useCustomPrice && <span className="text-primary text-xs">(Custom)</span>}
              {useLivePrice && <span className="text-green-500 text-xs">(Live)</span>}
            </Label>
            <Input
              id="entryPrice"
              type="number"
              placeholder="Enter price"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              disabled={useLivePrice && !useCustomPrice}
              step="0.00000001"
              min="0"
              autoComplete="off"
              className="font-mono transition-all duration-200 focus:scale-105"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leverage" className="flex items-center space-x-2">
              <span>Leverage</span>
              {leverage && <span className={`text-xs ${getRiskColor()}`}>({leverage}x)</span>}
            </Label>
            <Input
              id="leverage"
              type="number"
              placeholder="e.g., 10"
              value={leverage}
              onChange={(e) => setLeverage(e.target.value)}
              min="1.1"
              max="125"
              step="0.1"
              autoComplete="off"
              className="font-mono transition-all duration-200 focus:scale-105"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="positionSize">Position Size (USD)</Label>
            <Input
              id="positionSize"
              type="number"
              placeholder="e.g., 1000"
              value={positionSize}
              onChange={(e) => setPositionSize(e.target.value)}
              min="1"
              step="1"
              autoComplete="off"
              className="font-mono transition-all duration-200 focus:scale-105"
            />
          </div>
        </div>
      </div>

      {/* Enhanced Calculate Button */}
      <Button
        onClick={calculateLiquidation}
        className={`w-full h-14 text-lg font-bold transition-all duration-300 ${
          isCalculated ? "bg-green-600 hover:bg-green-700" : ""
        } ${isLoading ? "animate-pulse" : "hover:scale-105 active:scale-95"}`}
        disabled={isLoading || !entryPrice || !leverage}
        size="lg"
        type="button"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            Calculating Magic... ✨
          </>
        ) : isCalculated ? (
          <>
            <Calculator className="mr-3 h-5 w-5" />✅ Recalculate Position
          </>
        ) : (
          <>
            <Calculator className="mr-3 h-5 w-5" />🚀 Calculate Liquidation Price
          </>
        )}
      </Button>
    </div>
  )
}
