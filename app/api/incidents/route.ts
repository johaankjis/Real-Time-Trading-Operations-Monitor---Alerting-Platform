import { NextResponse } from "next/server"
import { getDb, saveDb } from "@/lib/db"

export async function GET() {
  try {
    const db = await getDb()

    const result = db.exec("SELECT * FROM incidents ORDER BY started_at DESC LIMIT 50")

    if (!result.length) {
      return NextResponse.json({ success: true, incidents: [] })
    }

    const columns = result[0].columns
    const incidents = result[0].values.map((row) => {
      const obj: any = {}
      columns.forEach((col, idx) => {
        obj[col] = row[idx]
      })
      return obj
    })

    return NextResponse.json({ success: true, incidents })
  } catch (error) {
    console.error("[v0] Incidents fetch error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch incidents" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const incident = await request.json()
    const db = await getDb()

    db.run(
      `INSERT INTO incidents (incident_id, alert_id, title, description, severity, status, remediation_action, remediation_status, started_at, resolved_at, mttd_seconds, mttr_seconds, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        incident.incident_id,
        incident.alert_id,
        incident.title,
        incident.description,
        incident.severity,
        incident.status,
        incident.remediation_action,
        incident.remediation_status,
        incident.started_at,
        incident.resolved_at,
        incident.mttd_seconds,
        incident.mttr_seconds,
        incident.metadata ? JSON.stringify(incident.metadata) : null,
      ],
    )

    await saveDb()

    return NextResponse.json({ success: true, incident })
  } catch (error) {
    console.error("[v0] Incident insert error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to insert incident" },
      { status: 500 },
    )
  }
}
