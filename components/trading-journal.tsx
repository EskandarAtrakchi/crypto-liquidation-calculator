"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { BookOpen, TrendingUp, TrendingDown, Calendar, FileText, Download } from "lucide-react"
import { formatPrice } from "@/lib/crypto-api"
import { useToast } from "@/hooks/use-toast"

interface JournalEntry {
  id: string
  date: string
  symbol: string
  positionType: "long" | "short"
  entryPrice: number
  exitPrice?: number
  leverage: number
  positionSize: number
  pnl?: number
  status: "open" | "closed"
  notes: string
  tags: string[]
  lessons: string
}

export function TradingJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [newEntry, setNewEntry] = useState<Partial<JournalEntry>>({
    symbol: "",
    positionType: "long",
    entryPrice: 0,
    leverage: 1,
    positionSize: 0,
    notes: "",
    lessons: "",
    tags: [],
  })
  const [filter, setFilter] = useState<"all" | "open" | "closed" | "profitable" | "losses">("all")
  const { toast } = useToast()

  useEffect(() => {
    const savedEntries = localStorage.getItem("trading-journal")
    if (savedEntries) {
      try {
        setEntries(JSON.parse(savedEntries))
      } catch (error) {
        console.error("Failed to load journal:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("trading-journal", JSON.stringify(entries))
  }, [entries])

  const addEntry = () => {
    if (!newEntry.symbol || !newEntry.entryPrice || !newEntry.positionSize) {
      toast({
        title: "❌ Invalid Entry",
        description: "Please fill in required fields",
        variant: "destructive",
      })
      return
    }

    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      status: "open",
      tags: [],
      ...(newEntry as JournalEntry),
    }

    setEntries((prev) => [entry, ...prev])
    setNewEntry({
      symbol: "",
      positionType: "long",
      entryPrice: 0,
      leverage: 1,
      positionSize: 0,
      notes: "",
      lessons: "",
      tags: [],
    })

    toast({
      title: "📝 Entry Added",
      description: `${entry.symbol} trade logged in journal`,
    })
  }

  const closePosition = (id: string, exitPrice: number) => {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id === id) {
          const priceChange = exitPrice - entry.entryPrice
          const pnl =
            entry.positionType === "long"
              ? (priceChange / entry.entryPrice) * entry.positionSize * entry.leverage
              : -(priceChange / entry.entryPrice) * entry.positionSize * entry.leverage

          return {
            ...entry,
            exitPrice,
            pnl,
            status: "closed" as const,
          }
        }
        return entry
      }),
    )
  }

  const filteredEntries = entries.filter((entry) => {
    switch (filter) {
      case "open":
        return entry.status === "open"
      case "closed":
        return entry.status === "closed"
      case "profitable":
        return entry.pnl && entry.pnl > 0
      case "losses":
        return entry.pnl && entry.pnl < 0
      default:
        return true
    }
  })

  const stats = {
    totalTrades: entries.filter((e) => e.status === "closed").length,
    profitable: entries.filter((e) => e.pnl && e.pnl > 0).length,
    totalPnL: entries.reduce((sum, e) => sum + (e.pnl || 0), 0),
    winRate:
      entries.filter((e) => e.status === "closed").length > 0
        ? (entries.filter((e) => e.pnl && e.pnl > 0).length / entries.filter((e) => e.status === "closed").length) * 100
        : 0,
  }

  const exportJournal = () => {
    const dataStr = JSON.stringify(entries, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `trading-journal-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "📥 Journal Exported",
      description: "Your trading journal has been downloaded",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5" />
          <span>Trading Journal</span>
          <Badge variant="outline" className="ml-auto">
            {entries.length} Entries
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.totalTrades}</p>
            <p className="text-sm text-muted-foreground">Total Trades</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{stats.winRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Win Rate</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${stats.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
              {stats.totalPnL >= 0 ? "+" : ""}${formatPrice(Math.abs(stats.totalPnL))}
            </p>
            <p className="text-sm text-muted-foreground">Total P&L</p>
          </div>
          <div className="text-center">
            <Button onClick={exportJournal} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Add New Entry */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold">Log New Trade</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Symbol</Label>
              <Input
                placeholder="e.g., BTC"
                value={newEntry.symbol || ""}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Position Type</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={newEntry.positionType}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, positionType: e.target.value as any }))}
              >
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Entry Price</Label>
              <Input
                type="number"
                placeholder="Entry price"
                value={newEntry.entryPrice || ""}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, entryPrice: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Leverage</Label>
              <Input
                type="number"
                placeholder="e.g., 10"
                value={newEntry.leverage || ""}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, leverage: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Position Size (USD)</Label>
              <Input
                type="number"
                placeholder="e.g., 1000"
                value={newEntry.positionSize || ""}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, positionSize: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Trade Notes</Label>
            <Textarea
              placeholder="Why did you enter this trade? What's your strategy?"
              value={newEntry.notes || ""}
              onChange={(e) => setNewEntry((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <Button onClick={addEntry} className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            Log Trade
          </Button>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {["all", "open", "closed", "profitable", "losses"].map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(filterType as any)}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Button>
          ))}
        </div>

        {/* Journal Entries */}
        {filteredEntries.length > 0 ? (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold">{entry.symbol}</h3>
                    <Badge variant={entry.positionType === "long" ? "default" : "destructive"}>
                      {entry.positionType === "long" ? (
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
                    <Badge variant={entry.status === "open" ? "secondary" : "outline"}>{entry.status}</Badge>
                    {entry.pnl && (
                      <Badge variant={entry.pnl > 0 ? "default" : "destructive"}>
                        {entry.pnl > 0 ? "+" : ""}${formatPrice(Math.abs(entry.pnl))}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{entry.date}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">Entry Price</span>
                    <p className="font-mono">${formatPrice(entry.entryPrice)}</p>
                  </div>
                  {entry.exitPrice && (
                    <div>
                      <span className="text-muted-foreground">Exit Price</span>
                      <p className="font-mono">${formatPrice(entry.exitPrice)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Leverage</span>
                    <p className="font-mono">{entry.leverage}x</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Size</span>
                    <p className="font-mono">${entry.positionSize.toLocaleString()}</p>
                  </div>
                </div>

                {entry.notes && (
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                    <p className="text-sm bg-muted/30 p-2 rounded">{entry.notes}</p>
                  </div>
                )}

                {entry.status === "open" && (
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      placeholder="Exit price"
                      className="w-32"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          const exitPrice = Number((e.target as HTMLInputElement).value)
                          if (exitPrice > 0) {
                            closePosition(entry.id, exitPrice)
                          }
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const input = document.querySelector(`input[placeholder="Exit price"]`) as HTMLInputElement
                        const exitPrice = Number(input?.value)
                        if (exitPrice > 0) {
                          closePosition(entry.id, exitPrice)
                        }
                      }}
                    >
                      Close Position
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No journal entries found</p>
            <p className="text-sm">Start logging your trades to track performance</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
