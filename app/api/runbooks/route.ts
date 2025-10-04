import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const alertType = searchParams.get("alert_type")

  try {
    const db = await getDb()

    if (alertType) {
      const result = db.exec("SELECT * FROM runbooks WHERE alert_type = ?", [alertType])

      const runbook =
        result.length > 0 && result[0].values.length > 0
          ? (() => {
              const obj: any = {}
              result[0].columns.forEach((col, idx) => {
                obj[col] = result[0].values[0][idx]
              })
              return obj
            })()
          : null

      return NextResponse.json({ success: true, data: runbook })
    }

    const result = db.exec("SELECT * FROM runbooks ORDER BY severity DESC")

    const runbooks =
      result.length > 0
        ? result[0].values.map((row) => {
            const obj: any = {}
            result[0].columns.forEach((col, idx) => {
              obj[col] = row[idx]
            })
            return obj
          })
        : []

    return NextResponse.json({ success: true, data: runbooks })
  } catch (error) {
    console.error("[v0] Runbooks API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch runbooks" }, { status: 500 })
  }
}
