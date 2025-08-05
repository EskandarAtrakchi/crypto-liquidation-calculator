"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BookOpen, Plus, Edit, Trash2, TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react"

interface JournalEntry {
  id: string
  date: string
  symbol: string
  type: "long" | "short"
  entryPrice: number
  exitPrice?: number
  quantity: number
  leverage: number
  pnl?: number
  status: "open" | "closed"
  notes: string
  emotions: string
  lessons: string
  createdAt: string
  updatedAt: string
}

const JOURNAL_STORAGE_KEY = "crypto-trading-journal"

export function TradingJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isAddingEntry, setIsAddingEntry] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split("T")[0],
    symbol: "",
    type: "long" as "long" | "short",
    entryPrice: "",
    exitPrice: "",
    quantity: "",
    leverage: "",
    status: "open" as "open" | "closed",
    notes: "",
    emotions: "",
    lessons: "",
  })

  // Load journal entries from localStorage on component mount
  useEffect(() => {
    try {
      const savedEntries = localStorage.getItem(JOURNAL_STORAGE_KEY)
      if (savedEntries) {
        const parsedEntries = JSON.parse(savedEntries)
        setEntries(parsedEntries)
      }
    } catch (error) {
      console.error("Failed to load journal entries from localStorage:", error)
    }
  }, [])

  // Save journal entries to localStorage whenever entries change
  useEffect(() => {
    try {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries))
    } catch (error) {
      console.error("Failed to save journal entries to localStorage:", error)
    }
  }, [entries])

  const calculatePnL = (entry: typeof newEntry) => {
    if (!entry.exitPrice || entry.status === "open") return 0

    const entryPrice = Number.parseFloat(entry.entryPrice)
    const exitPrice = Number.parseFloat(entry.exitPrice)
    const quantity = Number.parseFloat(entry.quantity)
    const leverage = Number.parseFloat(entry.leverage)

    if (entry.type === "long") {
      return ((exitPrice - entryPrice) / entryPrice) * quantity * leverage
    } else {
      return ((entryPrice - exitPrice) / entryPrice) * quantity * leverage
    }
  }

  const addEntry = () => {
    if (!newEntry.symbol || !newEntry.entryPrice || !newEntry.quantity) return

    const pnl = calculatePnL(newEntry)

    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: newEntry.date,
      symbol: newEntry.symbol.toUpperCase(),
      type: newEntry.type,
      entryPrice: Number.parseFloat(newEntry.entryPrice),
      exitPrice: newEntry.exitPrice ? Number.parseFloat(newEntry.exitPrice) : undefined,
      quantity: Number.parseFloat(newEntry.quantity),
      leverage: Number.parseFloat(newEntry.leverage) || 1,
      pnl: newEntry.status === "closed" ? pnl : undefined,
      status: newEntry.status,
      notes: newEntry.notes,
      emotions: newEntry.emotions,
      lessons: newEntry.lessons,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setEntries((prev) => [entry, ...prev])
    resetForm()
    setIsAddingEntry(false)
  }

  const updateEntry = () => {
    if (!editingEntry || !newEntry.symbol || !newEntry.entryPrice || !newEntry.quantity) return

    const pnl = calculatePnL(newEntry)

    const updatedEntry: JournalEntry = {
      ...editingEntry,
      date: newEntry.date,
      symbol: newEntry.symbol.toUpperCase(),
      type: newEntry.type,
      entryPrice: Number.parseFloat(newEntry.entryPrice),
      exitPrice: newEntry.exitPrice ? Number.parseFloat(newEntry.exitPrice) : undefined,
      quantity: Number.parseFloat(newEntry.quantity),
      leverage: Number.parseFloat(newEntry.leverage) || 1,
      pnl: newEntry.status === "closed" ? pnl : undefined,
      status: newEntry.status,
      notes: newEntry.notes,
      emotions: newEntry.emotions,
      lessons: newEntry.lessons,
      updatedAt: new Date().toISOString(),
    }

    setEntries((prev) => prev.map((entry) => (entry.id === editingEntry.id ? updatedEntry : entry)))
    resetForm()
    setEditingEntry(null)
  }

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  const startEdit = (entry: JournalEntry) => {
    setNewEntry({
      date: entry.date,
      symbol: entry.symbol,
      type: entry.type,
      entryPrice: entry.entryPrice.toString(),
      exitPrice: entry.exitPrice?.toString() || "",
      quantity: entry.quantity.toString(),
      leverage: entry.leverage.toString(),
      status: entry.status,
      notes: entry.notes,
      emotions: entry.emotions,
      lessons: entry.lessons,
    })
    setEditingEntry(entry)
  }

  const resetForm = () => {
    setNewEntry({
      date: new Date().toISOString().split("T")[0],
      symbol: "",
      type: "long",
      entryPrice: "",
      exitPrice: "",
      quantity: "",
      leverage: "",
      status: "open",
      notes: "",
      emotions: "",
      lessons: "",
    })
  }

  const totalPnL = entries
    .filter((entry) => entry.status === "closed" && entry.pnl !== undefined)
    .reduce((sum, entry) => sum + (entry.pnl || 0), 0)

  const winRate =
    entries.filter((entry) => entry.status === "closed").length > 0
      ? (entries.filter((entry) => entry.status === "closed" && (entry.pnl || 0) > 0).length /
          entries.filter((entry) => entry.status === "closed").length) *
        100
      : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span>Trading Journal</span>
            </div>
            <Dialog open={isAddingEntry} onOpenChange={setIsAddingEntry}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Trade Entry</DialogTitle>
                  <DialogDescription>Record your trade details, emotions, and lessons learned</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol</Label>
                    <Input
                      id="symbol"
                      placeholder="BTC, ETH, etc."
                      value={newEntry.symbol}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, symbol: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Position Type</Label>
                    <Select
                      value={newEntry.type}
                      onValueChange={(value: "long" | "short") => setNewEntry((prev) => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="long">Long</SelectItem>
                        <SelectItem value="short">Short</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newEntry.status}
                      onValueChange={(value: "open" | "closed") => setNewEntry((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entryPrice">Entry Price</Label>
                    <Input
                      id="entryPrice"
                      type="number"
                      placeholder="0.00"
                      value={newEntry.entryPrice}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, entryPrice: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exitPrice">Exit Price (if closed)</Label>
                    <Input
                      id="exitPrice"
                      type="number"
                      placeholder="0.00"
                      value={newEntry.exitPrice}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, exitPrice: e.target.value }))}
                      disabled={newEntry.status === "open"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="0.00"
                      value={newEntry.quantity}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leverage">Leverage</Label>
                    <Input
                      id="leverage"
                      type="number"
                      placeholder="1"
                      value={newEntry.leverage}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, leverage: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="notes">Trade Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Why did you enter this trade? What was your strategy?"
                      value={newEntry.notes}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="emotions">Emotions & Psychology</Label>
                    <Textarea
                      id="emotions"
                      placeholder="How did you feel during this trade? Any emotional challenges?"
                      value={newEntry.emotions}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, emotions: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="lessons">Lessons Learned</Label>
                    <Textarea
                      id="lessons"
                      placeholder="What did you learn from this trade? What would you do differently?"
                      value={newEntry.lessons}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, lessons: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddingEntry(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addEntry}>Add Entry</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Track your trades, analyze performance, and learn from your trading decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Total P&L</span>
                </div>
                <p className={`text-2xl font-bold ${totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                  ${totalPnL.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Win Rate</span>
                </div>
                <p className="text-2xl font-bold">{winRate.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Total Trades</span>
                </div>
                <p className="text-2xl font-bold">{entries.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Entries List */}
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No journal entries yet</p>
                <p className="text-sm text-muted-foreground">
                  Start documenting your trades to improve your trading performance
                </p>
              </div>
            ) : (
              entries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          {entry.type === "long" ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-semibold">{entry.symbol}</span>
                          <Badge variant={entry.status === "open" ? "default" : "secondary"}>{entry.status}</Badge>
                          <Badge variant="outline">{entry.type.toUpperCase()}</Badge>
                          {entry.pnl !== undefined && (
                            <Badge variant={entry.pnl >= 0 ? "default" : "destructive"}>
                              {entry.pnl >= 0 ? "+" : ""}${entry.pnl.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Entry: ${entry.entryPrice.toLocaleString()} |
                          {entry.exitPrice && ` Exit: $${entry.exitPrice.toLocaleString()} |`}
                          {` Qty: ${entry.quantity} | Leverage: ${entry.leverage}x | ${entry.date}`}
                        </div>
                        {entry.notes && <p className="text-sm">{entry.notes}</p>}
                      </div>
                      <div className="flex space-x-2">
                        <Dialog
                          open={editingEntry?.id === entry.id}
                          onOpenChange={(open) => !open && setEditingEntry(null)}
                        >
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => startEdit(entry)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Trade Entry</DialogTitle>
                              <DialogDescription>
                                Update your trade details, emotions, and lessons learned
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-date">Date</Label>
                                <Input
                                  id="edit-date"
                                  type="date"
                                  value={newEntry.date}
                                  onChange={(e) => setNewEntry((prev) => ({ ...prev, date: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-symbol">Symbol</Label>
                                <Input
                                  id="edit-symbol"
                                  placeholder="BTC, ETH, etc."
                                  value={newEntry.symbol}
                                  onChange={(e) => setNewEntry((prev) => ({ ...prev, symbol: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-type">Position Type</Label>
                                <Select
                                  value={newEntry.type}
                                  onValueChange={(value: "long" | "short") =>
                                    setNewEntry((prev) => ({ ...prev, type: value }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="long">Long</SelectItem>
                                    <SelectItem value="short">Short</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-status">Status</Label>
                                <Select
                                  value={newEntry.status}
                                  onValueChange={(value: "open" | "closed") =>
                                    setNewEntry((prev) => ({ ...prev, status: value }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-entryPrice">Entry Price</Label>
                                <Input
                                  id="edit-entryPrice"
                                  type="number"
                                  placeholder="0.00"
                                  value={newEntry.entryPrice}
                                  onChange={(e) => setNewEntry((prev) => ({ ...prev, entryPrice: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-exitPrice">Exit Price (if closed)</Label>
                                <Input
                                  id="edit-exitPrice"
                                  type="number"
                                  placeholder="0.00"
                                  value={newEntry.exitPrice}
                                  onChange={(e) => setNewEntry((prev) => ({ ...prev, exitPrice: e.target.value }))}
                                  disabled={newEntry.status === "open"}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-quantity">Quantity</Label>
                                <Input
                                  id="edit-quantity"
                                  type="number"
                                  placeholder="0.00"
                                  value={newEntry.quantity}
                                  onChange={(e) => setNewEntry((prev) => ({ ...prev, quantity: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-leverage">Leverage</Label>
                                <Input
                                  id="edit-leverage"
                                  type="number"
                                  placeholder="1"
                                  value={newEntry.leverage}
                                  onChange={(e) => setNewEntry((prev) => ({ ...prev, leverage: e.target.value }))}
                                />
                              </div>
                              <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="edit-notes">Trade Notes</Label>
                                <Textarea
                                  id="edit-notes"
                                  placeholder="Why did you enter this trade? What was your strategy?"
                                  value={newEntry.notes}
                                  onChange={(e) => setNewEntry((prev) => ({ ...prev, notes: e.target.value }))}
                                />
                              </div>
                              <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="edit-emotions">Emotions & Psychology</Label>
                                <Textarea
                                  id="edit-emotions"
                                  placeholder="How did you feel during this trade? Any emotional challenges?"
                                  value={newEntry.emotions}
                                  onChange={(e) => setNewEntry((prev) => ({ ...prev, emotions: e.target.value }))}
                                />
                              </div>
                              <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="edit-lessons">Lessons Learned</Label>
                                <Textarea
                                  id="edit-lessons"
                                  placeholder="What did you learn from this trade? What would you do differently?"
                                  value={newEntry.lessons}
                                  onChange={(e) => setNewEntry((prev) => ({ ...prev, lessons: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                              <Button variant="outline" onClick={() => setEditingEntry(null)}>
                                Cancel
                              </Button>
                              <Button onClick={updateEntry}>Update Entry</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm" onClick={() => deleteEntry(entry.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
