import { NextResponse } from "next/server"
import { MetricsEngine } from "@/lib/metrics-engine"
import { AlertingEngine } from "@/lib/alerting-engine"
import { getDb } from "@/lib/db"

const metricsEngine = new MetricsEngine()
const alertingEngine = new AlertingEngine()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")

  try {
    if (type === "kpis") {
      const kpis = await metricsEngine.calculateKPIs(60)
      return NextResponse.json({ success: true, data: kpis })
    }

    if (type === "timeseries") {
      const metricName = searchParams.get("metric") || "latency"
      const minutes = Number.parseInt(searchParams.get("minutes") || "60")
      const metrics = await metricsEngine.getRecentMetrics("latency", minutes)

      return NextResponse.json({ success: true, data: metrics })
    }

    if (type === "alerts") {
      const alerts = await alertingEngine.getActiveAlerts()
      return NextResponse.json({ success: true, data: alerts })
    }

    if (type === "incidents") {
      const hours = Number.parseInt(searchParams.get("hours") || "24")
      const incidents = await alertingEngine.getRecentIncidents(hours)
      return NextResponse.json({ success: true, data: incidents })
    }

    if (type === "feed_health") {
      const db = await getDb()
      const result = db.exec("SELECT * FROM feed_health")

      const feeds =
        result.length > 0
          ? result[0].values.map((row) => {
              const obj: any = {}
              result[0].columns.forEach((col, idx) => {
                obj[col] = row[idx]
              })
              return obj
            })
          : []

      return NextResponse.json({ success: true, data: feeds })
    }

    return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Metrics API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch metrics" }, { status: 500 })
  }
}

// Check alerts endpoint
export async function POST() {
  try {
    const kpis = await metricsEngine.calculateKPIs(5) // Last 5 minutes

    const db = await getDb()
    const result = db.exec("SELECT * FROM feed_health")

    const feedHealth =
      result.length > 0
        ? result[0].values.map((row) => {
            const obj: any = {}
            result[0].columns.forEach((col, idx) => {
              obj[col] = row[idx]
            })
            return obj
          })
        : []

    const triggeredAlerts = await alertingEngine.checkAlerts(kpis, feedHealth)

    return NextResponse.json({
      success: true,
      data: {
        triggeredAlerts,
        kpis,
        feedHealth,
      },
    })
  } catch (error) {
    console.error("[v0] Alert check error:", error)
    return NextResponse.json({ success: false, error: "Failed to check alerts" }, { status: 500 })
  }
}
