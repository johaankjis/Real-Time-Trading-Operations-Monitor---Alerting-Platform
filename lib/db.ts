import initSqlJs, { type Database as SqlJsDatabase } from "sql.js"

let db: SqlJsDatabase | null = null
let SQL: any = null

export async function getDb(): Promise<SqlJsDatabase> {
  if (db) return db

  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    })
  }

  // Try to load existing database from localStorage
  const savedDb = localStorage.getItem("trading-ops-db")
  if (savedDb) {
    const buffer = Uint8Array.from(atob(savedDb), (c) => c.charCodeAt(0))
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  return db
}

export async function saveDb() {
  if (!db) return
  const data = db.export()
  const base64 = btoa(String.fromCharCode(...data))
  localStorage.setItem("trading-ops-db", base64)
}

export interface Metric {
  id?: number
  timestamp: number
  metric_type: string
  metric_name: string
  value: number
  metadata?: string
  created_at?: number
}

export interface Alert {
  id?: number
  alert_id: string
  name: string
  severity: "critical" | "warning" | "info"
  condition_type: string
  threshold?: number
  current_value?: number
  status: "active" | "resolved" | "acknowledged"
  triggered_at?: number
  resolved_at?: number
  message?: string
  metadata?: string
  created_at?: number
}

export interface Incident {
  id?: number
  incident_id: string
  alert_id?: string
  title: string
  description?: string
  severity: "critical" | "warning" | "info"
  status: "open" | "investigating" | "resolved"
  remediation_action?: string
  remediation_status?: string
  started_at: number
  resolved_at?: number
  mttd_seconds?: number
  mttr_seconds?: number
  metadata?: string
  created_at?: number
}

export interface Runbook {
  id?: number
  runbook_id: string
  title: string
  alert_type: string
  severity: string
  description: string
  triage_steps: string
  remediation_steps: string
  rollback_steps?: string
  related_alerts?: string
  created_at?: number
  updated_at?: number
}

export interface FeedHealth {
  id?: number
  feed_name: string
  feed_type: "market_data" | "order_gateway"
  last_heartbeat: number
  status: "healthy" | "degraded" | "down"
  latency_ms?: number
  message_count?: number
  error_count?: number
  updated_at?: number
}
