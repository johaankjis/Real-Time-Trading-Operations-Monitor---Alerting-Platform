"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Info, XCircle } from "lucide-react"
import type { Alert } from "@/lib/db"

interface AlertListProps {
  alerts: Alert[]
  onSelectAlert?: (alert: Alert) => void
}

export function AlertList({ alerts, onSelectAlert }: AlertListProps) {
  const severityIcons = {
    critical: XCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const severityColors = {
    critical: "bg-destructive text-destructive-foreground",
    warning: "bg-warning text-warning-foreground",
    info: "bg-primary text-primary-foreground",
  }

  if (alerts.length === 0) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="text-center text-muted-foreground">
          <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No active alerts</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const Icon = severityIcons[alert.severity]
        return (
          <Card
            key={alert.id}
            className="p-4 bg-card border-border hover:border-primary/50 cursor-pointer transition-colors"
            onClick={() => onSelectAlert?.(alert)}
          >
            <div className="flex items-start gap-3">
              <Icon
                className={`h-5 w-5 mt-0.5 ${
                  alert.severity === "critical"
                    ? "text-destructive"
                    : alert.severity === "warning"
                      ? "text-warning"
                      : "text-primary"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-foreground">{alert.name}</h4>
                  <Badge className={severityColors[alert.severity]}>{alert.severity}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Triggered: {new Date(alert.triggered_at || 0).toLocaleTimeString()}</span>
                  {alert.current_value !== undefined && alert.threshold !== undefined && (
                    <span>
                      Value: {alert.current_value.toFixed(2)} / {alert.threshold}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
