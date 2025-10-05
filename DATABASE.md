# Database Documentation

## Overview

The Trading Operations Monitor uses SQL.js (SQLite compiled to WebAssembly) for client-side data storage. The database runs entirely in the browser and is persisted to localStorage.

## Technology Stack

- **Database Engine**: SQLite 3.x (via SQL.js)
- **Runtime**: WebAssembly in browser
- **Persistence**: localStorage (base64 encoded)
- **Storage Limit**: ~5-10MB (browser dependent)

## Schema Version

Current Version: **001** (Initial Schema)

## Tables

### 1. metrics

Stores time-series operational metrics.

**Schema:**
```sql
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
```

**Columns:**

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | INTEGER | No | Auto-incrementing primary key |
| timestamp | INTEGER | No | Unix timestamp (milliseconds) when metric was recorded |
| metric_type | TEXT | No | Category of metric (e.g., 'latency', 'order', 'market_data') |
| metric_name | TEXT | No | Specific metric name (e.g., 'latency', 'order_fill', 'position_exposure') |
| value | REAL | No | Numeric metric value |
| metadata | TEXT | Yes | Optional JSON string with additional context |
| created_at | INTEGER | No | Unix timestamp (seconds) when record was created |

**Indexes:**
- `idx_metrics_timestamp`: Optimizes time-range queries
- `idx_metrics_type`: Optimizes filtering by metric type

**Common Metric Types:**

| metric_type | metric_name | Description | Unit |
|-------------|-------------|-------------|------|
| latency | latency | Order acknowledgment latency | milliseconds |
| order | order_fill | Order fill event | count |
| order | order_reject | Order reject event | count |
| order | order_cancel | Order cancel event | count |
| position | position_exposure | Current position notional | USD |
| market_data | quote | Market data quote received | count |
| market_data | trade | Market data trade received | count |
| market_data | heartbeat | Feed heartbeat | count |

**Example Queries:**

```sql
-- Get average latency over last hour
SELECT AVG(value) as avg_latency
FROM metrics
WHERE metric_name = 'latency'
  AND timestamp > (strftime('%s', 'now') - 3600) * 1000;

-- Get order counts by type
SELECT metric_name, COUNT(*) as count
FROM metrics
WHERE metric_type = 'order'
  AND timestamp > (strftime('%s', 'now') - 3600) * 1000
GROUP BY metric_name;

-- Get latest position exposure
SELECT value
FROM metrics
WHERE metric_name = 'position_exposure'
ORDER BY timestamp DESC
LIMIT 1;
```

### 2. alerts

Stores alert definitions and their current state.

**Schema:**
```sql
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
```

**Columns:**

| Column | Type | Nullable | Constraints | Description |
|--------|------|----------|-------------|-------------|
| id | INTEGER | No | PRIMARY KEY | Auto-incrementing primary key |
| alert_id | TEXT | No | UNIQUE | Unique alert identifier (e.g., 'high_latency') |
| name | TEXT | No | | Human-readable alert name |
| severity | TEXT | No | CHECK | 'critical', 'warning', or 'info' |
| condition_type | TEXT | No | | Type of condition ('threshold', 'stale', 'rate') |
| threshold | REAL | Yes | | Threshold value that triggered alert |
| current_value | REAL | Yes | | Current metric value |
| status | TEXT | No | CHECK | 'active', 'resolved', or 'acknowledged' |
| triggered_at | INTEGER | Yes | | Unix timestamp (ms) when alert triggered |
| resolved_at | INTEGER | Yes | | Unix timestamp (ms) when alert resolved |
| message | TEXT | Yes | | Alert message/description |
| metadata | TEXT | Yes | | Optional JSON metadata |
| created_at | INTEGER | No | DEFAULT | Unix timestamp (s) when record created |

**Indexes:**
- `idx_alerts_status`: Optimizes filtering by status
- `idx_alerts_severity`: Optimizes filtering by severity

**Pre-Configured Alerts:**

| alert_id | name | severity | threshold | condition_type |
|----------|------|----------|-----------|----------------|
| stale_feed | Stale Market Data Feed | critical | 3000ms | stale |
| high_latency | High Order Latency | warning | 100ms | threshold |
| high_rejects | High Reject Rate | warning | 5% | rate |
| risk_breach | Risk Limit Breach | critical | $1M | threshold |

**Example Queries:**

```sql
-- Get all active alerts
SELECT *
FROM alerts
WHERE status = 'active'
ORDER BY severity DESC, triggered_at DESC;

-- Get alert history for specific type
SELECT *
FROM alerts
WHERE alert_id = 'high_latency'
ORDER BY triggered_at DESC
LIMIT 10;

-- Count alerts by severity
SELECT severity, COUNT(*) as count
FROM alerts
WHERE status = 'active'
GROUP BY severity;
```

### 3. incidents

Stores incident timeline and remediation actions.

**Schema:**
```sql
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
```

**Columns:**

| Column | Type | Nullable | Constraints | Description |
|--------|------|----------|-------------|-------------|
| id | INTEGER | No | PRIMARY KEY | Auto-incrementing primary key |
| incident_id | TEXT | No | UNIQUE | Unique incident identifier (e.g., 'INC-1704067200000') |
| alert_id | TEXT | Yes | FOREIGN KEY | Associated alert identifier |
| title | TEXT | No | | Incident title |
| description | TEXT | Yes | | Detailed incident description |
| severity | TEXT | No | CHECK | 'critical', 'warning', or 'info' |
| status | TEXT | No | CHECK | 'open', 'investigating', or 'resolved' |
| remediation_action | TEXT | Yes | | Action taken or in progress |
| remediation_status | TEXT | Yes | | Status of remediation ('pending', 'in_progress', 'completed', 'failed') |
| started_at | INTEGER | No | | Unix timestamp (ms) when incident started |
| resolved_at | INTEGER | Yes | | Unix timestamp (ms) when incident resolved |
| mttd_seconds | INTEGER | Yes | | Mean Time to Detect (seconds) |
| mttr_seconds | INTEGER | Yes | | Mean Time to Resolve (seconds) |
| metadata | TEXT | Yes | | Optional JSON metadata |
| created_at | INTEGER | No | DEFAULT | Unix timestamp (s) when record created |

**Indexes:**
- `idx_incidents_status`: Optimizes filtering by status
- `idx_incidents_started`: Optimizes time-based queries

**Relationships:**
- `alert_id` references `alerts(alert_id)`: Links incident to triggering alert

**MTTD/MTTR Calculation:**
```sql
-- MTTD: Time from incident start to detection (alert trigger)
mttd_seconds = (alert.triggered_at - incident.started_at) / 1000

-- MTTR: Time from detection to resolution
mttr_seconds = (incident.resolved_at - alert.triggered_at) / 1000
```

**Example Queries:**

```sql
-- Get open incidents
SELECT *
FROM incidents
WHERE status IN ('open', 'investigating')
ORDER BY started_at DESC;

-- Get incidents with average resolution time
SELECT 
  severity,
  COUNT(*) as total,
  AVG(mttr_seconds) as avg_mttr,
  AVG(mttd_seconds) as avg_mttd
FROM incidents
WHERE status = 'resolved'
GROUP BY severity;

-- Get incident timeline
SELECT 
  i.incident_id,
  i.title,
  i.status,
  i.started_at,
  i.resolved_at,
  a.name as alert_name
FROM incidents i
LEFT JOIN alerts a ON i.alert_id = a.alert_id
ORDER BY i.started_at DESC
LIMIT 50;
```

### 4. runbooks

Stores operational runbooks and procedures.

**Schema:**
```sql
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
```

**Columns:**

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | INTEGER | No | Auto-incrementing primary key |
| runbook_id | TEXT | No | Unique runbook identifier (e.g., 'RB001') |
| title | TEXT | No | Runbook title |
| alert_type | TEXT | No | Associated alert type |
| severity | TEXT | No | Expected severity level |
| description | TEXT | No | Runbook description |
| triage_steps | TEXT | No | Newline-separated triage steps |
| remediation_steps | TEXT | No | Newline-separated remediation steps |
| rollback_steps | TEXT | Yes | Newline-separated rollback steps |
| related_alerts | TEXT | Yes | Comma-separated related alert IDs |
| created_at | INTEGER | No | Unix timestamp (s) when created |
| updated_at | INTEGER | No | Unix timestamp (s) when last updated |

**Indexes:**
- `idx_runbooks_alert_type`: Optimizes lookup by alert type

**Default Runbooks:**

| runbook_id | title | alert_type |
|------------|-------|------------|
| RB001 | Stale Market Data Feed | stale_feed |
| RB002 | High Order Latency | high_latency |
| RB003 | Risk Limit Breach | risk_breach |
| RB004 | High Reject Rate | high_rejects |

**Step Format:**
Steps are stored as newline-separated text, numbered:
```
1. Check current p95/p99 latency metrics
2. Review order gateway status
3. Check network conditions
4. Verify exchange connectivity
```

**Example Queries:**

```sql
-- Get runbook for alert type
SELECT *
FROM runbooks
WHERE alert_type = 'high_latency';

-- Get all critical runbooks
SELECT runbook_id, title, alert_type
FROM runbooks
WHERE severity = 'critical'
ORDER BY title;

-- Search runbooks by keyword
SELECT *
FROM runbooks
WHERE description LIKE '%gateway%'
   OR triage_steps LIKE '%gateway%'
   OR remediation_steps LIKE '%gateway%';
```

### 5. feed_health

Tracks market data and order gateway health.

**Schema:**
```sql
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
```

**Columns:**

| Column | Type | Nullable | Constraints | Description |
|--------|------|----------|-------------|-------------|
| id | INTEGER | No | PRIMARY KEY | Auto-incrementing primary key |
| feed_name | TEXT | No | UNIQUE | Feed identifier (e.g., 'primary_md', 'backup_gateway') |
| feed_type | TEXT | No | CHECK | 'market_data' or 'order_gateway' |
| last_heartbeat | INTEGER | No | | Unix timestamp (ms) of last heartbeat |
| status | TEXT | No | CHECK | 'healthy', 'degraded', or 'down' |
| latency_ms | REAL | Yes | | Average feed latency in milliseconds |
| message_count | INTEGER | Yes | DEFAULT 0 | Total messages processed |
| error_count | INTEGER | Yes | DEFAULT 0 | Total errors encountered |
| updated_at | INTEGER | No | DEFAULT | Unix timestamp (s) when last updated |

**Indexes:**
- `idx_feed_health_status`: Optimizes filtering by status
- `idx_feed_health_name`: Ensures unique feed names and fast lookups

**Status Determination:**
- **healthy**: Heartbeat within threshold, no errors
- **degraded**: Heartbeat delayed or elevated error rate
- **down**: Heartbeat timeout exceeded (>3 seconds)

**Example Queries:**

```sql
-- Get all feed statuses
SELECT feed_name, feed_type, status, 
       (strftime('%s', 'now') * 1000 - last_heartbeat) as ms_since_heartbeat
FROM feed_health
ORDER BY status, feed_type;

-- Get degraded/down feeds
SELECT *
FROM feed_health
WHERE status IN ('degraded', 'down');

-- Update feed heartbeat
UPDATE feed_health
SET last_heartbeat = ?,
    status = 'healthy',
    message_count = message_count + 1,
    updated_at = strftime('%s', 'now')
WHERE feed_name = ?;
```

## Data Relationships

```
alerts (1) ──────> (0..N) incidents
  │
  └──────> (0..1) runbooks (via alert_type)

metrics (N) ──────> (0..1) alerts (triggers based on thresholds)

feed_health (N) ──> (0..N) alerts (stale feed alerts)
```

## Persistence Strategy

### localStorage Format

Database is persisted as base64-encoded binary:
```javascript
localStorage.setItem('trading-ops-db', base64EncodedDatabase)
```

### Save Triggers
Database is saved to localStorage:
- After alert creation/update
- After incident creation/update
- After metrics flush (every 5s or 1000 metrics)
- On page unload

### Load Process
On application start:
1. Check for existing database in localStorage
2. If exists, decode and load binary data
3. If not exists, create new empty database
4. Initialize schema via `/api/init`

## Performance Optimization

### Index Usage

All indexes are designed for common query patterns:

**Time-Range Queries:**
```sql
-- Uses idx_metrics_timestamp
SELECT * FROM metrics 
WHERE timestamp > ? AND timestamp < ?;
```

**Alert Filtering:**
```sql
-- Uses idx_alerts_status
SELECT * FROM alerts WHERE status = 'active';
```

**Feed Lookups:**
```sql
-- Uses idx_feed_health_name (UNIQUE)
SELECT * FROM feed_health WHERE feed_name = ?;
```

### Query Best Practices

1. **Always use indexes**: Structure queries to hit indexed columns
2. **Limit result sets**: Use LIMIT for large tables
3. **Batch inserts**: Insert multiple metrics in single transaction
4. **Avoid SELECT ***: Specify required columns
5. **Use prepared statements**: Prevent SQL injection and improve parsing

### Storage Management

**Data Retention:**
- Keep last 24 hours of detailed metrics
- Keep last 7 days of hourly aggregates
- Keep all incidents/alerts indefinitely
- Consider archiving to IndexedDB for larger datasets

**Cleanup Queries:**
```sql
-- Delete metrics older than 24 hours
DELETE FROM metrics
WHERE timestamp < (strftime('%s', 'now') - 86400) * 1000;

-- Delete resolved alerts older than 7 days
DELETE FROM alerts
WHERE status = 'resolved'
  AND resolved_at < (strftime('%s', 'now') - 604800) * 1000;
```

## Migration Strategy

### Version Control
Track schema version in metadata:
```sql
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER DEFAULT (strftime('%s', 'now'))
);

INSERT INTO schema_version (version) VALUES (1);
```

### Migration Example
For future schema changes:
```sql
-- Migration 002: Add tags column to alerts
ALTER TABLE alerts ADD COLUMN tags TEXT;

-- Update version
INSERT INTO schema_version (version) VALUES (2);
```

### Migration Execution
1. Check current version
2. Apply migrations sequentially
3. Update version number
4. Save database to localStorage

## Backup and Recovery

### Manual Backup
```javascript
// Export database
const db = await getDb()
const data = db.export()
const blob = new Blob([data], { type: 'application/octet-stream' })
const url = URL.createObjectURL(blob)
// Download blob

// Import database
const arrayBuffer = await file.arrayBuffer()
const uint8Array = new Uint8Array(arrayBuffer)
const db = new SQL.Database(uint8Array)
localStorage.setItem('trading-ops-db', btoa(String.fromCharCode(...uint8Array)))
```

### Auto-Backup
Consider implementing:
- Periodic exports to IndexedDB
- Cloud storage integration
- Server-side backup sync

## Troubleshooting

### Common Issues

**Database Not Persisting:**
- Check localStorage quota (5-10MB)
- Verify saveDb() is called after changes
- Check browser privacy/incognito mode

**Slow Queries:**
- Verify indexes are being used (EXPLAIN QUERY PLAN)
- Limit result sets with WHERE and LIMIT
- Consider data retention cleanup

**Corrupted Database:**
- Clear localStorage: `localStorage.removeItem('trading-ops-db')`
- Reinitialize: POST to `/api/init`
- Restore from backup if available

### Debug Queries

```sql
-- Check database size
SELECT 
  COUNT(*) as metric_count,
  (SELECT COUNT(*) FROM alerts) as alert_count,
  (SELECT COUNT(*) FROM incidents) as incident_count
FROM metrics;

-- Check index usage
EXPLAIN QUERY PLAN
SELECT * FROM metrics WHERE timestamp > ?;

-- Verify constraints
SELECT * FROM alerts WHERE severity NOT IN ('critical', 'warning', 'info');
```

## Security Considerations

### SQL Injection Prevention
- Always use parameterized queries
- Never concatenate user input into SQL
- Validate all inputs before database operations

### Data Sanitization
- Escape special characters in TEXT fields
- Validate numeric ranges for REAL/INTEGER
- Check enum values against allowed lists

### Privacy
- All data stored client-side (localStorage)
- No server-side persistence
- Data isolated to browser origin
- Clear localStorage to remove all data

## Future Enhancements

1. **IndexedDB Migration**: Better storage capacity and performance
2. **Compression**: Compress old metrics for space efficiency
3. **Aggregation Tables**: Pre-computed hourly/daily aggregates
4. **Full-Text Search**: For runbook content searching
5. **Audit Log**: Track all database modifications
6. **Partitioning**: Separate hot/cold data
7. **Replication**: Sync to server-side database

## References

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [SQL.js Documentation](https://sql.js.org)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
