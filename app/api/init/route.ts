import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  value REAL NOT NULL,
  metadata TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON metrics(metric_type);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('critical', 'warning', 'info')),
  condition_type TEXT NOT NULL,
  threshold REAL,
  current_value REAL,
  status TEXT NOT NULL CHECK(status IN ('active', 'resolved', 'acknowledged')),
  triggered_at INTEGER,
  resolved_at INTEGER,
  message TEXT,
  metadata TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);

CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id TEXT UNIQUE NOT NULL,
  alert_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK(severity IN ('critical', 'warning', 'info')),
  status TEXT NOT NULL CHECK(status IN ('open', 'investigating', 'resolved')),
  remediation_action TEXT,
  remediation_status TEXT,
  started_at INTEGER NOT NULL,
  resolved_at INTEGER,
  mttd_seconds INTEGER,
  mttr_seconds INTEGER,
  metadata TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (alert_id) REFERENCES alerts(alert_id)
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);

CREATE TABLE IF NOT EXISTS runbooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  runbook_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  triage_steps TEXT NOT NULL,
  remediation_steps TEXT NOT NULL,
  rollback_steps TEXT,
  related_alerts TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS feed_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_name TEXT UNIQUE NOT NULL,
  feed_type TEXT NOT NULL CHECK(feed_type IN ('market_data', 'order_gateway')),
  last_heartbeat INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('healthy', 'degraded', 'down')),
  latency_ms REAL,
  message_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

INSERT OR IGNORE INTO runbooks (runbook_id, title, alert_type, severity, description, triage_steps, remediation_steps, rollback_steps, related_alerts) VALUES
('RB001', 'Stale Market Data Feed', 'stale_feed', 'critical', 'Market data feed has not received updates for over 5 seconds', '1. Check feed health dashboard\n2. Verify network connectivity\n3. Check feed provider status page\n4. Review recent error logs', '1. Restart feed connector process\n2. Switch to backup feed if available\n3. Contact feed provider support\n4. Escalate to infrastructure team if unresolved', '1. Switch back to primary feed\n2. Monitor for stability\n3. Document incident', 'feed_health,latency'),
('RB002', 'High Order Latency', 'high_latency', 'warning', 'Order acknowledgment latency exceeds 100ms', '1. Check current latency metrics\n2. Review order gateway health\n3. Check network path to exchange\n4. Verify system load', '1. Reduce order rate temporarily\n2. Switch to backup gateway\n3. Restart order gateway service\n4. Check for network congestion', '1. Restore normal order rate\n2. Switch back to primary gateway\n3. Monitor latency trends', 'latency,order_gateway'),
('RB003', 'High Reject Rate', 'high_rejects', 'critical', 'Order reject rate exceeds 5%', '1. Check reject reasons in logs\n2. Verify account status\n3. Check risk limits\n4. Review order parameters', '1. Pause trading if reject rate > 10%\n2. Adjust order parameters\n3. Increase risk limits if appropriate\n4. Contact exchange support', '1. Resume normal trading\n2. Monitor reject rate\n3. Update risk parameters', 'rejects,risk'),
('RB004', 'Position Limit Breach', 'position_breach', 'critical', 'Position exposure exceeds configured limits', '1. Check current position\n2. Verify limit configuration\n3. Review recent trades\n4. Check for duplicate fills', '1. IMMEDIATE: Trigger kill-switch\n2. Flatten position if necessary\n3. Review and adjust limits\n4. Investigate root cause', '1. Re-enable trading with adjusted limits\n2. Monitor position closely\n3. Update risk controls', 'position,risk,kill_switch'),
('RB005', 'Feed Failover', 'feed_failover', 'warning', 'Automatic failover to backup feed triggered', '1. Verify backup feed is healthy\n2. Check primary feed status\n3. Monitor data quality\n4. Review failover logs', '1. Monitor backup feed performance\n2. Investigate primary feed issue\n3. Plan return to primary feed\n4. Update monitoring thresholds', '1. Switch back to primary feed\n2. Monitor for stability\n3. Document failover event', 'feed_health,failover');
`

export async function POST() {
  try {
    console.log("[v0] Starting database initialization...")
    const db = await getDb()

    const statements = INIT_SQL.split(";").filter((s) => s.trim())

    for (const statement of statements) {
      if (statement.trim()) {
        db.run(statement)
      }
    }

    const { saveDb } = await import("@/lib/db")
    await saveDb()

    console.log("[v0] Database initialized successfully")
    return NextResponse.json({ success: true, message: "Database initialized successfully" })
  } catch (error) {
    console.error("[v0] Database initialization error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to initialize database" },
      { status: 500 },
    )
  }
}
