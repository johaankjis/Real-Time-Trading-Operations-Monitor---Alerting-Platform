import { NextResponse } from "next/server"
import { getDb, saveDb } from "@/lib/db"

export async function GET() {
  try {
    const db = await getDb()

    const result = db.exec(
      "SELECT * FROM alerts WHERE status IN ('active', 'acknowledged') ORDER BY triggered_at DESC LIMIT 100",
    )

    if (!result.length) {
      return NextResponse.json({ success: true, alerts: [] })
    }

    const columns = result[0].columns
    const alerts = result[0].values.map((row) => {
      const obj: any = {}
      columns.forEach((col, idx) => {
        obj[col] = row[idx]
      })
      return obj
    })

    return NextResponse.json({ success: true, alerts })
  } catch (error) {
    console.error("[v0] Alerts fetch error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch alerts" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const alert = await request.json()
    const db = await getDb()

    db.run(
      `INSERT INTO alerts (alert_id, name, severity, condition_type, threshold, current_value, status, triggered_at, message, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        alert.alert_id,
        alert.name,
        alert.severity,
        alert.condition_type,
        alert.threshold,
        alert.current_value,
        alert.status,
        alert.triggered_at,
        alert.message,
        alert.metadata ? JSON.stringify(alert.metadata) : null,
      ],
    )

    await saveDb()

    return NextResponse.json({ success: true, alert })
  } catch (error) {
    console.error("[v0] Alert insert error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to insert alert" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { alert_id, status, resolved_at } = await request.json()
    const db = await getDb()

    db.run("UPDATE alerts SET status = ?, resolved_at = ? WHERE alert_id = ?", [status, resolved_at, alert_id])

    await saveDb()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Alert update error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update alert" },
      { status: 500 },
    )
  }
}
