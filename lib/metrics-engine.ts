import { getDb, type Metric } from "./db"

export interface KPIMetrics {
  fillRate: number
  cancelRate: number
  rejectRate: number
  latencyP50: number
  latencyP95: number
  latencyP99: number
  positionExposure: number
  orderCount: number
  messageRate: number
}

export class MetricsEngine {
  private metricsBuffer: Metric[] = []
  private readonly BUFFER_SIZE = 1000
  private readonly FLUSH_INTERVAL = 5000 // 5 seconds

  constructor() {
    // Flush metrics periodically
    setInterval(() => this.flushMetrics(), this.FLUSH_INTERVAL)
  }

  async recordMetric(metricType: string, metricName: string, value: number, metadata?: Record<string, any>) {
    const metric: Metric = {
      timestamp: Date.now(),
      metric_type: metricType,
      metric_name: metricName,
      value,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    }

    this.metricsBuffer.push(metric)

    if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
      await this.flushMetrics()
    }
  }

  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) return

    const db = await getDb()
    const metrics = [...this.metricsBuffer]
    this.metricsBuffer = []

    const stmt = await db.prepare(
      "INSERT INTO metrics (timestamp, metric_type, metric_name, value, metadata) VALUES (?, ?, ?, ?, ?)",
    )

    for (const metric of metrics) {
      await stmt.run(metric.timestamp, metric.metric_type, metric.metric_name, metric.value, metric.metadata)
    }

    await stmt.finalize()
  }

  async getRecentMetrics(metricType: string, minutes = 60): Promise<Metric[]> {
    const db = await getDb()
    const cutoff = Date.now() - minutes * 60 * 1000

    return db.all(
      "SELECT * FROM metrics WHERE metric_type = ? AND timestamp > ? ORDER BY timestamp DESC",
      metricType,
      cutoff,
    )
  }

  async calculateKPIs(minutes = 60): Promise<KPIMetrics> {
    const db = await getDb()
    const cutoff = Date.now() - minutes * 60 * 1000

    // Get order metrics
    const orderMetrics = await db.all(
      "SELECT metric_name, value FROM metrics WHERE metric_type = ? AND timestamp > ?",
      "order",
      cutoff,
    )

    const fills = orderMetrics.filter((m) => m.metric_name === "fill").length
    const cancels = orderMetrics.filter((m) => m.metric_name === "cancel").length
    const rejects = orderMetrics.filter((m) => m.metric_name === "reject").length
    const total = orderMetrics.length || 1

    // Get latency metrics
    const latencyMetrics = await db.all(
      "SELECT value FROM metrics WHERE metric_name = ? AND timestamp > ? ORDER BY value",
      "latency",
      cutoff,
    )

    const latencies = latencyMetrics.map((m) => m.value)
    const p50 = this.percentile(latencies, 50)
    const p95 = this.percentile(latencies, 95)
    const p99 = this.percentile(latencies, 99)

    // Get position exposure
    const positionMetrics = await db.all(
      "SELECT value FROM metrics WHERE metric_name = ? AND timestamp > ? ORDER BY timestamp DESC LIMIT 1",
      "position_exposure",
      cutoff,
    )

    const exposure = positionMetrics[0]?.value || 0

    // Get message rate
    const messageCount = await db.get(
      "SELECT COUNT(*) as count FROM metrics WHERE metric_type = ? AND timestamp > ?",
      "market_data",
      cutoff,
    )

    const messageRate = (messageCount?.count || 0) / (minutes * 60)

    return {
      fillRate: (fills / total) * 100,
      cancelRate: (cancels / total) * 100,
      rejectRate: (rejects / total) * 100,
      latencyP50: p50,
      latencyP95: p95,
      latencyP99: p99,
      positionExposure: exposure,
      orderCount: total,
      messageRate,
    }
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)] || 0
  }
}
