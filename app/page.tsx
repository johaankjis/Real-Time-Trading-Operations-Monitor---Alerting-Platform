"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { MetricsCard } from "@/components/metrics-card"
import { TimeSeriesChart } from "@/components/time-series-chart"
import { AlertList } from "@/components/alert-list"
import { IncidentTimeline } from "@/components/incident-timeline"
import { RunbookViewer } from "@/components/runbook-viewer"
import { ChaosControls } from "@/components/chaos-controls"
import { Play, Square, Activity, Database } from "lucide-react"
import type { Alert, Incident, Runbook } from "@/lib/db"
import type { KPIMetrics } from "@/lib/metrics-engine"
import { useToast } from "@/hooks/use-toast"

export default function TradingOpsMonitor() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [kpis, setKpis] = useState<KPIMetrics | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null)
  const [latencyData, setLatencyData] = useState<Array<{ timestamp: number; value: number }>>([])
  const { toast } = useToast()

  useEffect(() => {
    initializeDatabase()
  }, [])

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        fetchMetrics()
        checkAlerts()
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [isRunning])

  const initializeDatabase = async () => {
    try {
      const response = await fetch("/api/init", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        setIsInitialized(true)
        toast({
          title: "Database Initialized",
          description: "Trading operations monitor is ready",
        })
      }
    } catch (error) {
      console.error("[v0] Initialization error:", error)
      toast({
        title: "Initialization Failed",
        description: "Could not initialize database",
        variant: "destructive",
      })
    }
  }

  const startSimulator = async () => {
    try {
      const response = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      })

      const data = await response.json()
      if (data.success) {
        setIsRunning(true)
        toast({
          title: "Simulator Started",
          description: "Market data simulation is now running",
        })
      }
    } catch (error) {
      console.error("[v0] Start simulator error:", error)
    }
  }

  const stopSimulator = async () => {
    try {
      const response = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      })

      const data = await response.json()
      if (data.success) {
        setIsRunning(false)
        toast({
          title: "Simulator Stopped",
          description: "Market data simulation has been stopped",
        })
      }
    } catch (error) {
      console.error("[v0] Stop simulator error:", error)
    }
  }

  const fetchMetrics = async () => {
    try {
      const [kpisRes, latencyRes, incidentsRes] = await Promise.all([
        fetch("/api/metrics?type=kpis"),
        fetch("/api/metrics?type=timeseries&metric=latency&minutes=10"),
        fetch("/api/metrics?type=incidents&hours=24"),
      ])

      const [kpisData, latencyData, incidentsData] = await Promise.all([
        kpisRes.json(),
        latencyRes.json(),
        incidentsRes.json(),
      ])

      if (kpisData.success) setKpis(kpisData.data)
      if (latencyData.success) {
        const formattedData = latencyData.data.map((m: any) => ({
          timestamp: m.timestamp,
          value: m.value,
        }))
        setLatencyData(formattedData)
      }
      if (incidentsData.success) setIncidents(incidentsData.data)
    } catch (error) {
      console.error("[v0] Fetch metrics error:", error)
    }
  }

  const checkAlerts = async () => {
    try {
      const response = await fetch("/api/metrics", { method: "POST" })
      const data = await response.json()

      if (data.success && data.data.triggeredAlerts.length > 0) {
        setAlerts(data.data.triggeredAlerts)

        for (const alert of data.data.triggeredAlerts) {
          toast({
            title: `Alert: ${alert.name}`,
            description: alert.message,
            variant: alert.severity === "critical" ? "destructive" : "default",
          })
        }
      }

      // Fetch all active alerts
      const alertsRes = await fetch("/api/metrics?type=alerts")
      const alertsData = await alertsRes.json()
      if (alertsData.success) setAlerts(alertsData.data)
    } catch (error) {
      console.error("[v0] Check alerts error:", error)
    }
  }

  const handleAlertSelect = async (alert: Alert) => {
    try {
      const response = await fetch(`/api/runbooks?alert_type=${alert.alert_id}`)
      const data = await response.json()

      if (data.success && data.data) {
        setSelectedRunbook(data.data)
      }
    } catch (error) {
      console.error("[v0] Fetch runbook error:", error)
    }
  }

  const handleChaosChange = async (type: string, config: any) => {
    try {
      await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: type, config }),
      })
    } catch (error) {
      console.error("[v0] Chaos control error:", error)
    }
  }

  const getLatencyStatus = () => {
    if (!kpis) return "healthy"
    if (kpis.latencyP95 > 100) return "critical"
    if (kpis.latencyP95 > 50) return "warning"
    return "healthy"
  }

  const getRejectStatus = () => {
    if (!kpis) return "healthy"
    if (kpis.rejectRate > 5) return "warning"
    return "healthy"
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Trading Operations Monitor</h1>
            <p className="text-muted-foreground">Real-time monitoring, alerting, and incident response</p>
          </div>
          <div className="flex items-center gap-3">
            {!isInitialized ? (
              <Button onClick={initializeDatabase} variant="outline">
                <Database className="h-4 w-4 mr-2" />
                Initialize Database
              </Button>
            ) : (
              <>
                {!isRunning ? (
                  <Button onClick={startSimulator}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Simulator
                  </Button>
                ) : (
                  <Button onClick={stopSimulator} variant="destructive">
                    <Square className="h-4 w-4 mr-2" />
                    Stop Simulator
                  </Button>
                )}
                <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg">
                  <Activity
                    className={`h-4 w-4 ${isRunning ? "text-success animate-pulse" : "text-muted-foreground"}`}
                  />
                  <span className="text-sm text-foreground">{isRunning ? "Running" : "Stopped"}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <MetricsCard title="Fill Rate" value={kpis?.fillRate || 0} unit="%" status="healthy" />
          <MetricsCard title="Reject Rate" value={kpis?.rejectRate || 0} unit="%" status={getRejectStatus()} />
          <MetricsCard title="Latency P50" value={kpis?.latencyP50 || 0} unit="ms" />
          <MetricsCard title="Latency P95" value={kpis?.latencyP95 || 0} unit="ms" status={getLatencyStatus()} />
          <MetricsCard
            title="Position Exposure"
            value={kpis ? (kpis.positionExposure / 1000).toFixed(0) : 0}
            unit="K"
          />
          <MetricsCard title="Message Rate" value={kpis?.messageRate || 0} unit="msg/s" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TimeSeriesChart
            title="Order Latency (P95)"
            data={latencyData}
            color="hsl(var(--primary))"
            unit="ms"
            height={250}
          />
          <ChaosControls onChaosChange={handleChaosChange} />
        </div>

        {/* Alerts and Incidents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Active Alerts</h2>
            <AlertList alerts={alerts} onSelectAlert={handleAlertSelect} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Incident Timeline</h2>
            <IncidentTimeline incidents={incidents} />
          </div>
        </div>

        {/* Runbook Viewer */}
        {selectedRunbook && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Runbook</h2>
            <RunbookViewer runbook={selectedRunbook} />
          </div>
        )}
      </div>
    </div>
  )
}
