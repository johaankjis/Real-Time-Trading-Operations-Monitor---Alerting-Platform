# API Documentation

This document describes all API endpoints available in the Trading Operations Monitor.

## Base URL

All API routes are relative to the application root:
```
http://localhost:3000/api
```

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Authentication

Currently, no authentication is required. All endpoints are publicly accessible.

---

## Endpoints

### 1. Database Initialization

#### Initialize Database
Creates database schema and loads default runbooks.

**Endpoint:** `POST /api/init`

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "message": "Database initialized successfully"
}
```

**Status Codes:**
- `200 OK`: Database initialized successfully
- `500 Internal Server Error`: Initialization failed

**Notes:**
- Idempotent operation (safe to call multiple times)
- Creates tables: metrics, alerts, incidents, runbooks, feed_health
- Loads 4 default runbooks
- Creates necessary indexes

---

### 2. Simulator Control

#### Control Market Simulator
Start, stop, or configure the market event simulator.

**Endpoint:** `POST /api/simulator`

**Request Body:**
```json
{
  "action": "start" | "stop" | "chaos",
  "config": {
    // For chaos action
    "type": "chaos_latency" | "chaos_stale" | "chaos_rejects",
    "enabled": boolean,
    "latency_ms": number,      // For chaos_latency
    "rate": number             // For chaos_rejects
  }
}
```

**Examples:**

Start simulator:
```json
{
  "action": "start"
}
```

Stop simulator:
```json
{
  "action": "stop"
}
```

Enable latency chaos:
```json
{
  "action": "chaos",
  "config": {
    "type": "chaos_latency",
    "enabled": true,
    "latency_ms": 200
  }
}
```

Enable reject chaos:
```json
{
  "action": "chaos",
  "config": {
    "type": "chaos_rejects",
    "enabled": true,
    "rate": 0.25
  }
}
```

**Response:**
```json
{
  "success": true,
  "status": {
    "isRunning": boolean,
    "messageRate": number,
    "chaos": {
      "latencySpike": number,
      "staleData": boolean,
      "rejectRate": number
    }
  }
}
```

**Status Codes:**
- `200 OK`: Action completed successfully
- `400 Bad Request`: Invalid action or config
- `500 Internal Server Error`: Operation failed

---

### 3. Metrics Operations

#### Get Metrics Data
Retrieve KPIs, time-series data, alerts, or incidents.

**Endpoint:** `GET /api/metrics`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | Yes | Data type: 'kpis', 'timeseries', 'alerts', 'incidents' |
| metric | string | Conditional | Metric name (required for timeseries) |
| minutes | number | No | Time window in minutes (default: 60) |
| hours | number | No | Time window in hours (default: 24) |

**Examples:**

Get current KPIs:
```
GET /api/metrics?type=kpis
```

Get time-series data:
```
GET /api/metrics?type=timeseries&metric=latency&minutes=30
```

Get active alerts:
```
GET /api/metrics?type=alerts
```

Get recent incidents:
```
GET /api/metrics?type=incidents&hours=12
```

**Response Examples:**

KPIs:
```json
{
  "success": true,
  "data": {
    "fillRate": 92.5,
    "cancelRate": 3.2,
    "rejectRate": 4.3,
    "latencyP50": 15.2,
    "latencyP95": 87.4,
    "latencyP99": 145.8,
    "positionExposure": 750000,
    "orderCount": 1250,
    "messageRate": 18.5
  }
}
```

Time-series:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "timestamp": 1704067200000,
      "metric_type": "latency",
      "metric_name": "latency",
      "value": 23.5,
      "metadata": null,
      "created_at": 1704067200
    }
    // ... more points
  ]
}
```

Alerts:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "alert_id": "high_latency",
      "name": "High Order Latency",
      "severity": "warning",
      "condition_type": "threshold",
      "threshold": 100,
      "current_value": 145.8,
      "status": "active",
      "triggered_at": 1704067200000,
      "message": "Order latency P95 exceeds 100ms threshold"
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Data retrieved successfully
- `400 Bad Request`: Invalid query parameters
- `500 Internal Server Error`: Query failed

#### Check Alerts
Evaluate alert rules based on current metrics.

**Endpoint:** `POST /api/metrics`

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "data": {
    "triggeredAlerts": [
      {
        "alert_id": "high_latency",
        "name": "High Order Latency",
        "severity": "warning",
        "status": "active",
        "triggered_at": 1704067200000,
        "message": "Order latency P95 exceeds 100ms threshold"
      }
    ],
    "kpis": {
      "fillRate": 92.5,
      "rejectRate": 4.3,
      // ... other KPIs
    },
    "feedHealth": [
      {
        "feed_name": "primary_md",
        "feed_type": "market_data",
        "status": "healthy",
        "last_heartbeat": 1704067200000,
        "latency_ms": 12.5
      }
    ]
  }
}
```

**Status Codes:**
- `200 OK`: Alerts checked successfully
- `500 Internal Server Error`: Check failed

---

### 4. Alert Management

#### List Alerts
Get all active or acknowledged alerts.

**Endpoint:** `GET /api/alerts`

**Query Parameters:** None

**Response:**
```json
{
  "success": true,
  "alerts": [
    {
      "id": 1,
      "alert_id": "high_latency",
      "name": "High Order Latency",
      "severity": "warning",
      "condition_type": "threshold",
      "threshold": 100,
      "current_value": 145.8,
      "status": "active",
      "triggered_at": 1704067200000,
      "resolved_at": null,
      "message": "Order latency P95 exceeds 100ms threshold",
      "metadata": null,
      "created_at": 1704067200
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Alerts retrieved successfully
- `500 Internal Server Error`: Query failed

#### Create Alert
Manually create a new alert.

**Endpoint:** `POST /api/alerts`

**Request Body:**
```json
{
  "alert_id": "custom_alert_001",
  "name": "Custom Alert",
  "severity": "warning",
  "condition_type": "threshold",
  "threshold": 100,
  "current_value": 150,
  "status": "active",
  "triggered_at": 1704067200000,
  "message": "Custom alert message"
}
```

**Response:**
```json
{
  "success": true,
  "alert": {
    "alert_id": "custom_alert_001",
    "name": "Custom Alert",
    // ... full alert object
  }
}
```

**Status Codes:**
- `200 OK`: Alert created successfully
- `400 Bad Request`: Invalid alert data
- `500 Internal Server Error`: Creation failed

#### Update Alert Status
Acknowledge or resolve an alert.

**Endpoint:** `PATCH /api/alerts`

**Request Body:**
```json
{
  "alert_id": "high_latency",
  "status": "acknowledged" | "resolved",
  "resolved_at": 1704067800000  // Required for resolved status
}
```

**Response:**
```json
{
  "success": true,
  "alert": {
    "alert_id": "high_latency",
    "status": "acknowledged",
    // ... full alert object
  }
}
```

**Status Codes:**
- `200 OK`: Alert updated successfully
- `400 Bad Request`: Missing required fields
- `500 Internal Server Error`: Update failed

---

### 5. Incident Management

#### List Incidents
Get recent incidents.

**Endpoint:** `GET /api/incidents`

**Query Parameters:** None

**Response:**
```json
{
  "success": true,
  "incidents": [
    {
      "id": 1,
      "incident_id": "INC-1704067200000",
      "alert_id": "high_latency",
      "title": "High Order Latency",
      "description": "Order latency P95 exceeds 100ms threshold",
      "severity": "warning",
      "status": "open",
      "remediation_action": "Switching to backup order gateway",
      "remediation_status": "in_progress",
      "started_at": 1704067200000,
      "resolved_at": null,
      "mttd_seconds": null,
      "mttr_seconds": null,
      "metadata": null,
      "created_at": 1704067200
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Incidents retrieved successfully
- `500 Internal Server Error`: Query failed

#### Create Incident
Manually create a new incident.

**Endpoint:** `POST /api/incidents`

**Request Body:**
```json
{
  "incident_id": "INC-1704067200000",
  "alert_id": "high_latency",
  "title": "High Order Latency",
  "description": "Order latency P95 exceeds 100ms threshold",
  "severity": "warning",
  "status": "open",
  "remediation_action": "Switching to backup order gateway",
  "remediation_status": "pending",
  "started_at": 1704067200000
}
```

**Response:**
```json
{
  "success": true,
  "incident": {
    "incident_id": "INC-1704067200000",
    // ... full incident object
  }
}
```

**Status Codes:**
- `200 OK`: Incident created successfully
- `400 Bad Request`: Invalid incident data
- `500 Internal Server Error`: Creation failed

---

### 6. Runbook Operations

#### Get Runbook by Alert Type
Retrieve runbook for a specific alert type.

**Endpoint:** `GET /api/runbooks?alert_type={type}`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| alert_type | string | Yes | Alert type identifier |

**Example:**
```
GET /api/runbooks?alert_type=high_latency
```

**Response:**
```json
{
  "success": true,
  "runbook": {
    "id": 2,
    "runbook_id": "RB002",
    "title": "High Order Latency",
    "alert_type": "high_latency",
    "severity": "warning",
    "description": "Order acknowledgment latency exceeds acceptable thresholds",
    "triage_steps": "1. Check current p95/p99 latency metrics\n2. Review order gateway status\n3. Check network conditions\n4. Verify exchange connectivity",
    "remediation_steps": "1. Reduce order rate if throttling detected\n2. Switch to backup gateway\n3. Clear order queue if backed up\n4. Restart order service with backoff",
    "rollback_steps": "1. Resume normal order rate\n2. Monitor latency recovery\n3. Switch back to primary gateway",
    "related_alerts": "high_latency,order_rejects",
    "created_at": 1704067200,
    "updated_at": 1704067200
  }
}
```

**Status Codes:**
- `200 OK`: Runbook found
- `404 Not Found`: No runbook for alert type
- `500 Internal Server Error`: Query failed

#### Get Runbook by ID
Retrieve runbook by its unique identifier.

**Endpoint:** `GET /api/runbooks?runbook_id={id}`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| runbook_id | string | Yes | Runbook identifier (e.g., "RB001") |

**Example:**
```
GET /api/runbooks?runbook_id=RB002
```

**Response:** Same as above

---

## Data Types

### Severity Levels
```typescript
type Severity = 'critical' | 'warning' | 'info'
```

- **critical**: Requires immediate action, system-impacting
- **warning**: Degraded performance, needs attention
- **info**: Informational only, no action needed

### Alert Status
```typescript
type AlertStatus = 'active' | 'resolved' | 'acknowledged'
```

- **active**: Alert is currently firing
- **acknowledged**: Alert has been seen but not resolved
- **resolved**: Alert condition has cleared

### Incident Status
```typescript
type IncidentStatus = 'open' | 'investigating' | 'resolved'
```

- **open**: Incident just created
- **investigating**: Team is working on resolution
- **resolved**: Incident has been resolved

### Remediation Status
```typescript
type RemediationStatus = 'pending' | 'in_progress' | 'completed' | 'failed'
```

### Feed Status
```typescript
type FeedStatus = 'healthy' | 'degraded' | 'down'
```

---

## Rate Limiting

Currently, no rate limiting is implemented. In production:
- Recommend 100 requests per minute per client
- Use exponential backoff for retries
- Implement request queuing for bulk operations

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters or body |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error - Server-side failure |

---

## WebSocket Support

Currently not implemented. Future consideration for:
- Real-time metric streaming
- Live alert notifications
- Incident updates
- Feed health changes

---

## Versioning

Currently at v1 (implicit). Future versions would be:
- `/api/v2/...`
- Backward compatible for at least 2 versions

---

## Best Practices

### Polling Strategy
For real-time updates, poll endpoints at appropriate intervals:
- **KPIs**: Every 5 seconds
- **Alerts**: Every 5 seconds
- **Incidents**: Every 10 seconds
- **Time-series**: Every 30 seconds

### Error Handling
Always check the `success` field:
```javascript
const response = await fetch('/api/metrics?type=kpis')
const data = await response.json()

if (!data.success) {
  console.error('API Error:', data.error)
  // Handle error
}
```

### Batch Operations
For multiple related operations:
1. Use POST /api/metrics to check alerts
2. Get all data in single response
3. Reduces API calls and improves performance

---

## Examples

### Complete Monitoring Flow

```javascript
// 1. Initialize database
await fetch('/api/init', { method: 'POST' })

// 2. Start simulator
await fetch('/api/simulator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'start' })
})

// 3. Poll for updates
setInterval(async () => {
  // Get KPIs
  const kpis = await fetch('/api/metrics?type=kpis')
    .then(r => r.json())
  
  // Check alerts
  const alerts = await fetch('/api/metrics', { method: 'POST' })
    .then(r => r.json())
  
  // Get incidents
  const incidents = await fetch('/api/incidents')
    .then(r => r.json())
  
  // Update UI with data
  updateDashboard(kpis.data, alerts.data, incidents.incidents)
}, 5000)
```

### Chaos Engineering Example

```javascript
// Enable latency spike
await fetch('/api/simulator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'chaos',
    config: {
      type: 'chaos_latency',
      enabled: true,
      latency_ms: 200
    }
  })
})

// Wait and observe alerts...

// Disable chaos
await fetch('/api/simulator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'chaos',
    config: {
      type: 'chaos_latency',
      enabled: false
    }
  })
})
```

---

## Support

For API questions or issues:
1. Check this documentation
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. Open a GitHub issue with API endpoint and error details
