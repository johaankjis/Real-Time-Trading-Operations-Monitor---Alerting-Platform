-- Trading Operations Monitor Database Schema
-- Version: 001
-- Description: Initial schema for metrics, alerts, incidents, and runbooks

-- Metrics table: stores time-series operational metrics
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

-- Alerts table: stores alert rules and their current state
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

-- Incidents table: stores incident timeline and remediation actions
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
CREATE INDEX IF NOT EXISTS idx_incidents_started ON incidents(started_at);

-- Runbooks table: stores operational runbooks and procedures
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

CREATE INDEX IF NOT EXISTS idx_runbooks_alert_type ON runbooks(alert_type);

-- Market data feed health table
CREATE TABLE IF NOT EXISTS feed_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_name TEXT NOT NULL,
  feed_type TEXT NOT NULL CHECK(feed_type IN ('market_data', 'order_gateway')),
  last_heartbeat INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('healthy', 'degraded', 'down')),
  latency_ms REAL,
  message_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_feed_health_status ON feed_health(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_feed_health_name ON feed_health(feed_name);

-- Insert default runbooks
INSERT OR IGNORE INTO runbooks (runbook_id, title, alert_type, severity, description, triage_steps, remediation_steps, rollback_steps, related_alerts) VALUES
('RB001', 'Stale Market Data Feed', 'stale_feed', 'critical', 'Market data feed has stopped sending heartbeats or data updates', 
'1. Check feed_health table for last heartbeat
2. Verify network connectivity to data provider
3. Check system logs for connection errors
4. Confirm data provider status page', 
'1. Attempt automatic reconnection
2. Switch to backup feed if available
3. Restart data ingestion service
4. Contact data provider if issue persists', 
'1. Switch back to primary feed when healthy
2. Verify data consistency
3. Resume normal operations',
'stale_feed,feed_latency'),

('RB002', 'High Order Latency', 'high_latency', 'warning', 'Order acknowledgment latency exceeds acceptable thresholds', 
'1. Check current p95/p99 latency metrics
2. Review order gateway status
3. Check network conditions
4. Verify exchange connectivity', 
'1. Reduce order rate if throttling detected
2. Switch to backup gateway
3. Clear order queue if backed up
4. Restart order service with backoff', 
'1. Resume normal order rate
2. Monitor latency recovery
3. Switch back to primary gateway',
'high_latency,order_rejects'),

('RB003', 'Risk Limit Breach', 'risk_breach', 'critical', 'Position or notional exposure has exceeded configured risk limits', 
'1. Check current position exposure
2. Verify risk limit configuration
3. Review recent trades
4. Assess market conditions', 
'1. IMMEDIATE: Trigger kill-switch to halt trading
2. Flatten positions if necessary
3. Review and adjust risk limits
4. Investigate root cause
5. Resume trading only after approval', 
'1. Verify positions are within limits
2. Re-enable trading gradually
3. Monitor closely for 1 hour',
'risk_breach,position_limit'),

('RB004', 'High Reject Rate', 'high_rejects', 'warning', 'Order reject rate has exceeded baseline threshold', 
'1. Check reject reasons in order logs
2. Verify order parameters
3. Check exchange rules and limits
4. Review recent market conditions', 
'1. Adjust order parameters if invalid
2. Reduce order rate if throttled
3. Update order validation logic
4. Contact exchange if systematic issue', 
'1. Resume normal order flow
2. Monitor reject rate
3. Update order templates if needed',
'high_rejects,order_errors');
