"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell, Trash2, AlertTriangle, BellOff, Settings, Target } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

interface RiskAlert {
  id: string
  type: "liquidation" | "profit" | "loss"
  symbol: string
  threshold: number
  enabled: boolean
  message: string
}

const ALERTS_STORAGE_KEY = "crypto-alerts"

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
    const savedAlerts = localStorage.getItem(ALERTS_STORAGE_KEY)
    if (savedAlerts) {
      try {
        setAlerts(JSON.parse(savedAlerts))
      } catch (error) {
        console.error("Failed to load alerts:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts))
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-primary" />
            <span>Risk Alerts</span>
            <Badge variant="secondary" className="ml-auto">
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

          {/* Add New Alert Form */}
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
                <Label htmlFor="alert-symbol">Symbol</Label>
                <Input
                  id="alert-symbol"
                  placeholder="BTC, ETH, etc."
                  value={newAlert.symbol}
                  onChange={(e) => setNewAlert((prev) => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert-price">Price Threshold</Label>
                <Input
                  id="alert-price"
                  type="number"
                  placeholder="0.00"
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

          {/* Alerts List */}
          {alerts.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold">Your Alerts</h3>
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    alert.enabled ? "bg-background" : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Badge className={getAlertColor(alert.type)}>{alert.type}</Badge>
                      <span className="font-semibold">{alert.symbol}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Alert when price {alert.type === "liquidation" ? "approaches" : "reaches"} $
                      {alert.threshold.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={alert.enabled} onCheckedChange={() => toggleAlert(alert.id)} />
                    <Button variant="ghost" size="sm" onClick={() => removeAlert(alert.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No price alerts set</p>
              <p className="text-sm text-muted-foreground">
                Create your first alert to get notified when prices reach your targets
              </p>
            </div>
          )}

          {/* Alert Info */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Price alerts are stored locally in your browser. For real-time notifications, you
              would need to integrate with a notification service or exchange API.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

// export default RiskAlerts
