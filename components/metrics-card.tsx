import { Card } from "@/components/ui/card"
import { ArrowUp, ArrowDown, Minus } from "lucide-react"

interface MetricsCardProps {
  title: string
  value: string | number
  unit?: string
  change?: number
  trend?: "up" | "down" | "neutral"
  status?: "healthy" | "warning" | "critical"
}

export function MetricsCard({ title, value, unit, change, trend, status }: MetricsCardProps) {
  const statusColors = {
    healthy: "text-success",
    warning: "text-warning",
    critical: "text-destructive",
  }

  const trendIcons = {
    up: ArrowUp,
    down: ArrowDown,
    neutral: Minus,
  }

  const TrendIcon = trend ? trendIcons[trend] : null

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-semibold ${status ? statusColors[status] : "text-foreground"}`}>
              {typeof value === "number" ? value.toFixed(2) : value}
            </span>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>
          {change !== undefined && TrendIcon && (
            <div className="flex items-center gap-1 mt-1">
              <TrendIcon className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {change > 0 ? "+" : ""}
                {change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        {status && (
          <div
            className={`h-2 w-2 rounded-full ${
              status === "healthy" ? "bg-success" : status === "warning" ? "bg-warning" : "bg-destructive"
            }`}
          />
        )}
      </div>
    </Card>
  )
}
