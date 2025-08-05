"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { AlertTriangle, Bell, BellOff, Settings, Target } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RiskAlert {
  id: string
  type: "liquidation" | "profit" | "loss"
  symbol: string
  threshold: number
  enabled: boolean
  message: string
}

export function RiskAlerts() {
  const [alerts, setAlerts] = useState<RiskAlert[]>([])
  const [newAlert, setNewAlert] = useState({
    type: "liquidation" as const,
    symbol: "",
    threshold: 0,
    message: "",
  })
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check notification permission
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted")
    }

    // Load alerts from localStorage
    const savedAlerts = localStorage.getItem("crypto-alerts")
    if (savedAlerts) {
      try {
        setAlerts(JSON.parse(savedAlerts))
      } catch (error) {
        console.error("Failed to load alerts:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("crypto-alerts", JSON.stringify(alerts))
  }, [alerts])

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === "granted")

      if (permission === "granted") {
        toast({
          title: "🔔 Notifications Enabled",
          description: "You'll receive alerts when your thresholds are reached",
        })
      }
    }
  }

  const addAlert = () => {
    if (!newAlert.symbol || !newAlert.threshold) {
      toast({
        title: "❌ Invalid Alert",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const alert: RiskAlert = {
      id: Date.now().toString(),
      ...newAlert,
      enabled: true,
    }

    setAlerts((prev) => [...prev, alert])
    setNewAlert({ type: "liquidation", symbol: "", threshold: 0, message: "" })

    toast({
      title: "🚨 Alert Created",
      description: `${alert.type} alert set for ${alert.symbol}`,
    })
  }

  const toggleAlert = (id: string) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, enabled: !alert.enabled } : alert)))
  }

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id))
    toast({
      title: "🗑️ Alert Removed",
      description: "Alert has been deleted",
    })
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "liquidation":
        return "text-red-500 bg-red-50 dark:bg-red-900/20"
      case "profit":
        return "text-green-500 bg-green-50 dark:bg-green-900/20"
      case "loss":
        return "text-orange-500 bg-orange-50 dark:bg-orange-900/20"
      default:
        return "text-gray-500"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span>Risk Alerts</span>
          <Badge variant="outline" className="ml-auto">
            {alerts.filter((a) => a.enabled).length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Settings */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-3">
            {notificationsEnabled ? (
              <Bell className="h-5 w-5 text-green-500" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-500" />
            )}
            <div>
              <p className="font-medium">Browser Notifications</p>
              <p className="text-sm text-muted-foreground">Get alerts even when tab is closed</p>
            </div>
          </div>
          {!notificationsEnabled && (
            <Button onClick={requestNotificationPermission} size="sm">
              Enable
            </Button>
          )}
        </div>

        {/* Add New Alert */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Create New Alert</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Alert Type</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={newAlert.type}
                onChange={(e) => setNewAlert((prev) => ({ ...prev, type: e.target.value as any }))}
              >
                <option value="liquidation">Liquidation Warning</option>
                <option value="profit">Profit Target</option>
                <option value="loss">Stop Loss</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Symbol</Label>
              <Input
                placeholder="e.g., BTC"
                value={newAlert.symbol}
                onChange={(e) => setNewAlert((prev) => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Price Threshold</Label>
              <Input
                type="number"
                placeholder="e.g., 50000"
                value={newAlert.threshold || ""}
                onChange={(e) => setNewAlert((prev) => ({ ...prev, threshold: Number(e.target.value) }))}
              />
            </div>
          </div>

          <Button onClick={addAlert} className="w-full">
            <Target className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 ? (
          <div className="space-y-3">
            <h3 className="font-semibold">Active Alerts</h3>
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Switch checked={alert.enabled} onCheckedChange={() => toggleAlert(alert.id)} />
                  <div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getAlertColor(alert.type)}>{alert.type}</Badge>
                      <span className="font-medium">{alert.symbol}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Alert when price {alert.type === "liquidation" ? "approaches" : "reaches"} $
                      {alert.threshold.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAlert(alert.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No alerts configured</p>
            <p className="text-sm">Create alerts to monitor your positions</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
