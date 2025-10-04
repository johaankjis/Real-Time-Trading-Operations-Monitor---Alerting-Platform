import { NextResponse } from "next/server"
import { MarketSimulator } from "@/lib/simulator"
import { MetricsEngine } from "@/lib/metrics-engine"
import { getDb } from "@/lib/db"

// Global simulator instance
let simulator: MarketSimulator | null = null
let metricsEngine: MetricsEngine | null = null
let simulationInterval: NodeJS.Timeout | null = null

export async function POST(request: Request) {
  const { action, config } = await request.json()

  if (!simulator) {
    simulator = new MarketSimulator()
    metricsEngine = new MetricsEngine()
  }

  try {
    switch (action) {
      case "start":
        simulator.start()
        startSimulation()
        return NextResponse.json({ success: true, message: "Simulator started" })

      case "stop":
        simulator.stop()
        stopSimulation()
        return NextResponse.json({ success: true, message: "Simulator stopped" })

      case "chaos_latency":
        if (config.enabled) {
          simulator.enableLatencySpike(config.latencyMs)
        } else {
          simulator.disableLatencySpike()
        }
        return NextResponse.json({ success: true, message: "Latency chaos updated" })

      case "chaos_stale":
        if (config.enabled) {
          simulator.enableStaleData()
        } else {
          simulator.disableStaleData()
        }
        return NextResponse.json({ success: true, message: "Stale data chaos updated" })

      case "chaos_rejects":
        if (config.enabled) {
          simulator.enableRejects(config.rate)
        } else {
          simulator.disableRejects()
        }
        return NextResponse.json({ success: true, message: "Reject chaos updated" })

      case "status":
        return NextResponse.json({ success: true, status: simulator.getStatus() })

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Simulator error:", error)
    return NextResponse.json({ success: false, error: "Simulator error" }, { status: 500 })
  }
}

function startSimulation() {
  if (simulationInterval) return

  simulationInterval = setInterval(async () => {
    if (!simulator || !metricsEngine) return

    // Generate market data
    const marketData = simulator.generateMarketData()
    await metricsEngine.recordMetric("market_data", marketData.type, 1, {
      symbol: marketData.symbol,
      latency_ms: marketData.latency_ms,
    })

    if (marketData.latency_ms) {
      await metricsEngine.recordMetric("latency", "latency", marketData.latency_ms)
    }

    const db = await getDb()
    const { saveDb } = await import("@/lib/db")

    db.run(
      `INSERT OR REPLACE INTO feed_health (feed_name, feed_type, last_heartbeat, status, latency_ms, message_count)
       VALUES (?, ?, ?, ?, ?, COALESCE((SELECT message_count FROM feed_health WHERE feed_name = ?) + 1, 1))`,
      ["primary_feed", "market_data", Date.now(), "healthy", marketData.latency_ms, "primary_feed"],
    )

    await saveDb()

    // Generate order events (less frequently)
    if (Math.random() < 0.3) {
      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      const orderEvent = simulator.generateOrderEvent(orderId)

      await metricsEngine.recordMetric("order", orderEvent.type, 1, {
        order_id: orderEvent.order_id,
        symbol: orderEvent.symbol,
        latency_ms: orderEvent.latency_ms,
      })

      if (orderEvent.latency_ms) {
        await metricsEngine.recordMetric("latency", "latency", orderEvent.latency_ms)
      }

      // Update position exposure (simulated)
      const currentExposure = Math.random() * 1200000 // Random exposure up to $1.2M
      await metricsEngine.recordMetric("position", "position_exposure", currentExposure)
    }
  }, 50) // 20 messages per second
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval)
    simulationInterval = null
  }
}

export async function GET() {
  if (!simulator) {
    return NextResponse.json({ success: true, status: { isRunning: false } })
  }

  return NextResponse.json({ success: true, status: simulator.getStatus() })
}
