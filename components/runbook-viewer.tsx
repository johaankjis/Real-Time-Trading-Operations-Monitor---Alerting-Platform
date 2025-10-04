import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, AlertTriangle } from "lucide-react"
import type { Runbook } from "@/lib/db"

interface RunbookViewerProps {
  runbook: Runbook | null
}

export function RunbookViewer({ runbook }: RunbookViewerProps) {
  if (!runbook) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="text-center text-muted-foreground">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Select an alert to view runbook</p>
        </div>
      </Card>
    )
  }

  const parseSteps = (steps: string) => {
    return steps.split("\n").filter((s) => s.trim())
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-start gap-3 mb-4">
        <BookOpen className="h-6 w-6 text-primary mt-1" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-foreground">{runbook.title}</h3>
            <Badge variant={runbook.severity === "critical" ? "destructive" : "secondary"}>{runbook.severity}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{runbook.description}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Triage Steps
          </h4>
          <ol className="space-y-2">
            {parseSteps(runbook.triage_steps).map((step, index) => (
              <li key={index} className="text-sm text-foreground pl-6 relative">
                <span className="absolute left-0 text-primary font-medium">{index + 1}.</span>
                {step.replace(/^\d+\.\s*/, "")}
              </li>
            ))}
          </ol>
        </div>

        <div className="border-t border-border pt-6">
          <h4 className="text-sm font-semibold text-foreground mb-3">Remediation Steps</h4>
          <ol className="space-y-2">
            {parseSteps(runbook.remediation_steps).map((step, index) => (
              <li key={index} className="text-sm text-foreground pl-6 relative">
                <span className="absolute left-0 text-success font-medium">{index + 1}.</span>
                {step.replace(/^\d+\.\s*/, "")}
              </li>
            ))}
          </ol>
        </div>

        {runbook.rollback_steps && (
          <div className="border-t border-border pt-6">
            <h4 className="text-sm font-semibold text-foreground mb-3">Rollback Steps</h4>
            <ol className="space-y-2">
              {parseSteps(runbook.rollback_steps).map((step, index) => (
                <li key={index} className="text-sm text-muted-foreground pl-6 relative">
                  <span className="absolute left-0 font-medium">{index + 1}.</span>
                  {step.replace(/^\d+\.\s*/, "")}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </Card>
  )
}
