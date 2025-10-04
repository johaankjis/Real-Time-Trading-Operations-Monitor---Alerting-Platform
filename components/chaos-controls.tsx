"use client"

import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Zap } from "lucide-react"
import { useState } from "react"

interface ChaosControlsProps {
  onChaosChange: (type: string, config: any) => void
}

export function ChaosControls({ onChaosChange }: ChaosControlsProps) {
  const [latencyEnabled, setLatencyEnabled] = useState(false)
  const [latencyMs, setLatencyMs] = useState(200)
  const [staleEnabled, setStaleEnabled] = useState(false)
  const [rejectsEnabled, setRejectsEnabled] = useState(false)
  const [rejectRate, setRejectRate] = useState(0.2)

  const handleLatencyToggle = (enabled: boolean) => {
    setLatencyEnabled(enabled)
    onChaosChange("chaos_latency", { enabled, latencyMs })
  }

  const handleStaleToggle = (enabled: boolean) => {
    setStaleEnabled(enabled)
    onChaosChange("chaos_stale", { enabled })
  }

  const handleRejectsToggle = (enabled: boolean) => {
    setRejectsEnabled(enabled)
    onChaosChange("chaos_rejects", { enabled, rate: rejectRate })
  }

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Chaos Engineering</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="latency-chaos" className="text-sm font-medium">
              Latency Spike
            </Label>
            <p className="text-xs text-muted-foreground">Inject {latencyMs}ms latency</p>
          </div>
          <Switch id="latency-chaos" checked={latencyEnabled} onCheckedChange={handleLatencyToggle} />
        </div>

        {latencyEnabled && (
          <div className="pl-4 space-y-2">
            <Label className="text-xs text-muted-foreground">Latency: {latencyMs}ms</Label>
            <Slider
              value={[latencyMs]}
              onValueChange={([value]) => {
                setLatencyMs(value)
                onChaosChange("chaos_latency", { enabled: true, latencyMs: value })
              }}
              min={50}
              max={500}
              step={50}
              className="w-full"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="stale-chaos" className="text-sm font-medium">
              Stale Data Feed
            </Label>
            <p className="text-xs text-muted-foreground">Stop sending heartbeats</p>
          </div>
          <Switch id="stale-chaos" checked={staleEnabled} onCheckedChange={handleStaleToggle} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="rejects-chaos" className="text-sm font-medium">
              High Reject Rate
            </Label>
            <p className="text-xs text-muted-foreground">{(rejectRate * 100).toFixed(0)}% reject rate</p>
          </div>
          <Switch id="rejects-chaos" checked={rejectsEnabled} onCheckedChange={handleRejectsToggle} />
        </div>

        {rejectsEnabled && (
          <div className="pl-4 space-y-2">
            <Label className="text-xs text-muted-foreground">Reject Rate: {(rejectRate * 100).toFixed(0)}%</Label>
            <Slider
              value={[rejectRate * 100]}
              onValueChange={([value]) => {
                const rate = value / 100
                setRejectRate(rate)
                onChaosChange("chaos_rejects", { enabled: true, rate })
              }}
              min={5}
              max={50}
              step={5}
              className="w-full"
            />
          </div>
        )}
      </div>
    </Card>
  )
}
