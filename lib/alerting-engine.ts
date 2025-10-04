import { getDb, type Alert, type Incident } from "./db"
import type { KPIMetrics } from "./metrics-engine"

export interface AlertRule {
  alertId: string
  name: string
  severity: "critical" | "warning" | "info"
  conditionType: "threshold" | "stale" | "rate"
  threshold?: number
  checkFn: (metrics: KPIMetrics, feedHealth: any) => boolean
  message: string
}

export class AlertingEngine {
  private rules: AlertRule[] = []
  private activeAlerts: Map<string, Alert> = new Map()

  constructor() {
    this.initializeRules()
  }

  private initializeRules() {
    this.rules = [
      {
        alertId: "stale_feed",
        name: "Stale Market Data Feed",
        severity: "critical",
        conditionType: "stale",
        threshold: 3000, // 3 seconds
        checkFn: (_, feedHealth) => {
          const now = Date.now()
          return feedHealth.some((feed: any) => now - feed.last_heartbeat > 3000)
        },
        message: "Market data feed has not sent heartbeat in over 3 seconds",
      },
      {
        alertId: "high_latency",
        name: "High Order Latency",
        severity: "warning",
        conditionType: "threshold",
        threshold: 100, // 100ms
        checkFn: (metrics) => metrics.latencyP95 > 100,
        message: "Order latency P95 exceeds 100ms threshold",
      },
      {
        alertId: "high_rejects",
        name: "High Reject Rate",
        severity: "warning",
        conditionType: "rate",
        threshold: 5, // 5%
        checkFn: (metrics) => metrics.rejectRate > 5,
        message: "Order reject rate exceeds 5% baseline",
      },
      {
        alertId: "risk_breach",
        name: "Risk Limit Breach",
        severity: "critical",
        conditionType: "threshold",
        threshold: 1000000, // $1M
        checkFn: (metrics) => metrics.positionExposure > 1000000,
        message: "Position exposure exceeds $1M risk limit",
      },
    ]
  }

  async checkAlerts(metrics: KPIMetrics, feedHealth: any[]): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = []
    const db = await getDb()

    for (const rule of this.rules) {
      const isTriggered = rule.checkFn(metrics, feedHealth)
      const existingAlert = this.activeAlerts.get(rule.alertId)

      if (isTriggered && !existingAlert) {
        // New alert triggered
        const alert: Alert = {
          alert_id: rule.alertId,
          name: rule.name,
          severity: rule.severity,
          condition_type: rule.conditionType,
          threshold: rule.threshold,
          current_value: this.getCurrentValue(rule, metrics, feedHealth),
          status: "active",
          triggered_at: Date.now(),
          message: rule.message,
        }

        await db.run(
          `INSERT INTO alerts (alert_id, name, severity, condition_type, threshold, current_value, status, triggered_at, message)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          alert.alert_id,
          alert.name,
          alert.severity,
          alert.condition_type,
          alert.threshold,
          alert.current_value,
          alert.status,
          alert.triggered_at,
          alert.message,
        )

        this.activeAlerts.set(rule.alertId, alert)
        triggeredAlerts.push(alert)

        // Create incident
        await this.createIncident(alert)

        // Trigger auto-remediation
        await this.autoRemediate(alert)
      } else if (!isTriggered && existingAlert && existingAlert.status === "active") {
        // Alert resolved
        const resolvedAt = Date.now()
        await db.run(
          "UPDATE alerts SET status = ?, resolved_at = ? WHERE alert_id = ?",
          "resolved",
          resolvedAt,
          rule.alertId,
        )

        // Update incident
        await this.resolveIncident(existingAlert, resolvedAt)

        this.activeAlerts.delete(rule.alertId)
      }
    }

    return triggeredAlerts
  }

  private getCurrentValue(rule: AlertRule, metrics: KPIMetrics, feedHealth: any[]): number {
    switch (rule.alertId) {
      case "high_latency":
        return metrics.latencyP95
      case "high_rejects":
        return metrics.rejectRate
      case "risk_breach":
        return metrics.positionExposure
      case "stale_feed":
        const now = Date.now()
        const stalest = feedHealth.reduce((max, feed) => Math.max(max, now - feed.last_heartbeat), 0)
        return stalest
      default:
        return 0
    }
  }

  private async createIncident(alert: Alert) {
    const db = await getDb()
    const incidentId = `INC-${Date.now()}`

    await db.run(
      `INSERT INTO incidents (incident_id, alert_id, title, description, severity, status, started_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      incidentId,
      alert.alert_id,
      alert.name,
      alert.message,
      alert.severity,
      "open",
      alert.triggered_at,
    )
  }

  private async resolveIncident(alert: Alert, resolvedAt: number) {
    const db = await getDb()
    const mttd = alert.triggered_at ? (alert.triggered_at - (alert.created_at || alert.triggered_at)) / 1000 : 0
    const mttr = alert.triggered_at ? (resolvedAt - alert.triggered_at) / 1000 : 0

    await db.run(
      `UPDATE incidents 
       SET status = ?, resolved_at = ?, mttd_seconds = ?, mttr_seconds = ?
       WHERE alert_id = ? AND status != ?`,
      "resolved",
      resolvedAt,
      mttd,
      mttr,
      alert.alert_id,
      "resolved",
    )
  }

  private async autoRemediate(alert: Alert) {
    const db = await getDb()
    let action = ""
    let status = "pending"

    switch (alert.alert_id) {
      case "stale_feed":
        action = "Attempting automatic reconnection to market data feed"
        status = "in_progress"
        // Simulate remediation
        setTimeout(async () => {
          await db.run(
            "UPDATE incidents SET remediation_action = ?, remediation_status = ? WHERE alert_id = ? AND status = ?",
            "Feed reconnection successful",
            "completed",
            alert.alert_id,
            "open",
          )
        }, 5000)
        break

      case "high_latency":
        action = "Switching to backup order gateway"
        status = "in_progress"
        break

      case "risk_breach":
        action = "KILL-SWITCH ACTIVATED: All trading halted"
        status = "completed"
        break

      case "high_rejects":
        action = "Reducing order rate by 50%"
        status = "in_progress"
        break
    }

    await db.run(
      "UPDATE incidents SET remediation_action = ?, remediation_status = ? WHERE alert_id = ? AND status = ?",
      action,
      status,
      alert.alert_id,
      "open",
    )
  }

  async getActiveAlerts(): Promise<Alert[]> {
    const db = await getDb()
    return db.all("SELECT * FROM alerts WHERE status = ? ORDER BY triggered_at DESC", "active")
  }

  async getRecentIncidents(hours = 24): Promise<Incident[]> {
    const db = await getDb()
    const cutoff = Date.now() - hours * 60 * 60 * 1000
    return db.all("SELECT * FROM incidents WHERE started_at > ? ORDER BY started_at DESC", cutoff)
  }
}
