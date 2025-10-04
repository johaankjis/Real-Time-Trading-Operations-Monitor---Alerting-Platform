import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, AlertCircle } from "lucide-react"
import type { Incident } from "@/lib/db"

interface IncidentTimelineProps {
  incidents: Incident[]
}

export function IncidentTimeline({ incidents }: IncidentTimelineProps) {
  const statusIcons = {
    open: AlertCircle,
    investigating: Clock,
    resolved: CheckCircle,
  }

  const statusColors = {
    open: "bg-destructive text-destructive-foreground",
    investigating: "bg-warning text-warning-foreground",
    resolved: "bg-success text-success-foreground",
  }

  if (incidents.length === 0) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="text-center text-muted-foreground">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No recent incidents</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {incidents.map((incident, index) => {
        const Icon = statusIcons[incident.status]
        const duration = incident.resolved_at
          ? Math.floor((incident.resolved_at - incident.started_at) / 1000)
          : Math.floor((Date.now() - incident.started_at) / 1000)

        return (
          <div key={incident.id} className="relative">
            {index < incidents.length - 1 && <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border" />}
            <Card className="p-4 bg-card border-border">
              <div className="flex items-start gap-3">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center ${
                    incident.status === "resolved"
                      ? "bg-success/20"
                      : incident.status === "investigating"
                        ? "bg-warning/20"
                        : "bg-destructive/20"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      incident.status === "resolved"
                        ? "text-success"
                        : incident.status === "investigating"
                          ? "text-warning"
                          : "text-destructive"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-foreground">{incident.title}</h4>
                    <Badge className={statusColors[incident.status]}>{incident.status}</Badge>
                  </div>
                  {incident.description && <p className="text-sm text-muted-foreground mb-2">{incident.description}</p>}
                  {incident.remediation_action && (
                    <div className="bg-secondary/50 rounded p-2 mb-2">
                      <p className="text-xs text-foreground">
                        <span className="font-medium">Remediation:</span> {incident.remediation_action}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{new Date(incident.started_at).toLocaleString()}</span>
                    <span>
                      Duration: {Math.floor(duration / 60)}m {duration % 60}s
                    </span>
                    {incident.mttr_seconds && <span>MTTR: {Math.floor(incident.mttr_seconds / 60)}m</span>}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
