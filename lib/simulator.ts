// Market data and order event simulator
export interface MarketDataEvent {
  type: "quote" | "trade" | "heartbeat"
  symbol: string
  timestamp: number
  bid?: number
  ask?: number
  price?: number
  volume?: number
  latency_ms?: number
}

export interface OrderEvent {
  type: "new" | "ack" | "fill" | "reject" | "cancel"
  order_id: string
  symbol: string
  timestamp: number
  side: "buy" | "sell"
  quantity: number
  price?: number
  status: "pending" | "acknowledged" | "filled" | "rejected" | "cancelled"
  latency_ms?: number
  reject_reason?: string
}

export class MarketSimulator {
  private symbols = ["BTC/USD", "ETH/USD", "SOL/USD", "AAPL", "TSLA"]
  private prices: Map<string, number> = new Map()
  private isRunning = false
  private messageRate = 20 // messages per second

  // Chaos engineering flags
  private injectLatency = false
  private injectStaleData = false
  private injectRejects = false
  private latencySpike = 0
  private rejectRate = 0

  constructor() {
    // Initialize prices
    this.prices.set("BTC/USD", 45000)
    this.prices.set("ETH/USD", 2500)
    this.prices.set("SOL/USD", 100)
    this.prices.set("AAPL", 180)
    this.prices.set("TSLA", 250)
  }

  start() {
    this.isRunning = true
  }

  stop() {
    this.isRunning = false
  }

  // Chaos engineering methods
  enableLatencySpike(latencyMs: number) {
    this.injectLatency = true
    this.latencySpike = latencyMs
  }

  disableLatencySpike() {
    this.injectLatency = false
    this.latencySpike = 0
  }

  enableStaleData() {
    this.injectStaleData = true
  }

  disableStaleData() {
    this.injectStaleData = false
  }

  enableRejects(rate: number) {
    this.injectRejects = true
    this.rejectRate = rate
  }

  disableRejects() {
    this.injectRejects = false
    this.rejectRate = 0
  }

  generateMarketData(): MarketDataEvent {
    const symbol = this.symbols[Math.floor(Math.random() * this.symbols.length)]
    const currentPrice = this.prices.get(symbol) || 100

    // Random walk price movement
    const change = (Math.random() - 0.5) * currentPrice * 0.001
    const newPrice = currentPrice + change
    this.prices.set(symbol, newPrice)

    const spread = newPrice * 0.0005 // 5 bps spread
    const latency = this.injectLatency ? this.latencySpike : Math.random() * 10 + 1 // 1-11ms normal latency

    if (Math.random() < 0.1) {
      // 10% heartbeats
      return {
        type: "heartbeat",
        symbol: "SYSTEM",
        timestamp: Date.now(),
        latency_ms: latency,
      }
    } else if (Math.random() < 0.3) {
      // 30% trades
      return {
        type: "trade",
        symbol,
        timestamp: Date.now(),
        price: newPrice,
        volume: Math.floor(Math.random() * 100) + 1,
        latency_ms: latency,
      }
    } else {
      // 60% quotes
      return {
        type: "quote",
        symbol,
        timestamp: Date.now(),
        bid: newPrice - spread,
        ask: newPrice + spread,
        latency_ms: latency,
      }
    }
  }

  generateOrderEvent(orderId: string): OrderEvent {
    const symbol = this.symbols[Math.floor(Math.random() * this.symbols.length)]
    const latency = this.injectLatency ? this.latencySpike : Math.random() * 20 + 5 // 5-25ms normal latency

    const shouldReject = this.injectRejects && Math.random() < this.rejectRate

    if (shouldReject) {
      return {
        type: "reject",
        order_id: orderId,
        symbol,
        timestamp: Date.now(),
        side: Math.random() < 0.5 ? "buy" : "sell",
        quantity: Math.floor(Math.random() * 100) + 1,
        status: "rejected",
        latency_ms: latency,
        reject_reason: "INSUFFICIENT_MARGIN",
      }
    }

    return {
      type: "ack",
      order_id: orderId,
      symbol,
      timestamp: Date.now(),
      side: Math.random() < 0.5 ? "buy" : "sell",
      quantity: Math.floor(Math.random() * 100) + 1,
      price: this.prices.get(symbol),
      status: "acknowledged",
      latency_ms: latency,
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      messageRate: this.messageRate,
      chaos: {
        latencySpike: this.injectLatency ? this.latencySpike : 0,
        staleData: this.injectStaleData,
        rejectRate: this.injectRejects ? this.rejectRate : 0,
      },
    }
  }
}
