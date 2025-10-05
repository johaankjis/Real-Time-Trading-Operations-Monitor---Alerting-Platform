# Architecture Documentation

## System Overview

The Trading Operations Monitor is a client-side web application built with Next.js that provides real-time monitoring, alerting, and incident management for trading operations. The architecture follows a modular design with clear separation of concerns.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser Application                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   React UI   │◄─┤  API Routes  │◄─┤  Market         │  │
│  │  Components  │  │  (Next.js)   │  │  Simulator      │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────────────┘  │
│         │                 │                                 │
│         ▼                 ▼                                 │
│  ┌──────────────────────────────────────┐                  │
│  │         Core Engines                  │                  │
│  ├──────────────┬──────────────────────┤                  │
│  │  Metrics     │  Alerting            │                  │
│  │  Engine      │  Engine              │                  │
│  └──────┬───────┴──────────┬───────────┘                  │
│         │                  │                               │
│         ▼                  ▼                               │
│  ┌─────────────────────────────────────┐                  │
│  │     SQL.js Database (SQLite)        │                  │
│  │     (Persisted to localStorage)     │                  │
│  └─────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend Layer

#### React Components (`/components`)

**Dashboard Components:**
- `metrics-card.tsx`: Displays individual KPI metrics with trend indicators
- `time-series-chart.tsx`: Renders time-series data using Recharts
- `alert-list.tsx`: Lists active alerts with severity badges and selection
- `incident-timeline.tsx`: Shows chronological incident history with status
- `runbook-viewer.tsx`: Displays runbook procedures with triage/remediation steps
- `chaos-controls.tsx`: Provides controls for chaos engineering experiments

**UI Components (`/components/ui`):**
- Built on shadcn/ui and Radix UI primitives
- Consistent design system with theme support
- Accessible components following WAI-ARIA guidelines

#### Main Page (`/app/page.tsx`)

The main dashboard orchestrates all components and manages:
- Simulator lifecycle (start/stop)
- Real-time data polling
- Alert selection and runbook display
- Chaos engineering configuration
- State management via React hooks

### 2. API Layer (`/app/api`)

Next.js API routes provide RESTful endpoints:

#### `/api/init` - Database Initialization
- `POST`: Creates database schema and loads default runbooks
- Idempotent operation (safe to call multiple times)

#### `/api/simulator` - Market Simulator Control
- `POST`: Start/stop simulator, configure chaos scenarios
- Body: `{ action: 'start' | 'stop' | 'chaos', config?: {...} }`

#### `/api/metrics` - Metrics Operations
- `GET`: Retrieve KPIs, time-series data, alerts, or incidents
  - Query params: `type`, `metric`, `minutes`, `hours`
- `POST`: Check alerts based on current metrics
  - Returns triggered alerts and current KPIs

#### `/api/alerts` - Alert Management
- `GET`: List active/acknowledged alerts
- `POST`: Create new alert
- `PATCH`: Update alert status (acknowledge, resolve)

#### `/api/incidents` - Incident Management
- `GET`: List recent incidents
- `POST`: Create new incident

#### `/api/runbooks` - Runbook Operations
- `GET`: Retrieve runbook by alert type or ID

### 3. Core Engines

#### Metrics Engine (`/lib/metrics-engine.ts`)

**Responsibilities:**
- Collect and buffer metrics from simulator
- Calculate KPIs from time-series data
- Persist metrics to database
- Provide query interface for historical data

**Key Features:**
- **Buffering**: Holds up to 1000 metrics in memory
- **Auto-Flush**: Flushes every 5 seconds or when buffer is full
- **KPI Calculation**: 
  - Fill, cancel, and reject rates
  - Latency percentiles (P50, P95, P99)
  - Position exposure
  - Message throughput

**Metrics Collected:**
- `order_fill`, `order_reject`, `order_cancel`: Order lifecycle events
- `latency`: Order acknowledgment latency
- `position_exposure`: Current position size
- `market_data`: Feed message events

**KPI Calculation Logic:**
```typescript
// Example: Calculate percentiles
percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[index]
}
```

#### Alerting Engine (`/lib/alerting-engine.ts`)

**Responsibilities:**
- Define and evaluate alert rules
- Trigger alerts when conditions are met
- Auto-resolve alerts when conditions clear
- Create and manage incidents
- Execute auto-remediation actions

**Alert Rules:**

```typescript
interface AlertRule {
  alertId: string              // Unique identifier
  name: string                 // Human-readable name
  severity: 'critical' | 'warning' | 'info'
  conditionType: 'threshold' | 'stale' | 'rate'
  threshold?: number           // Threshold value
  checkFn: (metrics, feedHealth) => boolean  // Evaluation function
  message: string             // Alert message
}
```

**Pre-Configured Rules:**
1. **Stale Feed** (Critical): Heartbeat > 3 seconds
2. **High Latency** (Warning): P95 latency > 100ms
3. **High Rejects** (Warning): Reject rate > 5%
4. **Risk Breach** (Critical): Position exposure > $1M

**Alert Lifecycle:**
1. Rule evaluation on metrics update
2. Alert creation if condition met
3. Incident creation
4. Auto-remediation attempt
5. Alert resolution when condition clears
6. Incident resolution with MTTD/MTTR calculation

**Auto-Remediation Actions:**
- **Stale Feed**: Attempt reconnection (5s delay)
- **High Latency**: Switch to backup gateway
- **Risk Breach**: Activate kill-switch (halt trading)
- **High Rejects**: Reduce order rate by 50%

#### Market Simulator (`/lib/simulator.ts`)

**Responsibilities:**
- Generate realistic market data events
- Simulate order lifecycle events
- Support chaos engineering scenarios

**Event Types:**

*Market Data Events:*
- `quote`: Bid/ask prices with spread
- `trade`: Executed trades with price/volume
- `heartbeat`: System health checks

*Order Events:*
- `new`: New order submission
- `ack`: Order acknowledgment
- `fill`: Order execution
- `reject`: Order rejection
- `cancel`: Order cancellation

**Chaos Engineering:**
- **Latency Injection**: Configurable latency spike (50-500ms)
- **Stale Data**: Stop heartbeat generation
- **High Rejects**: Configurable reject rate (5-50%)

**Simulation Parameters:**
- 5 symbols: BTC/USD, ETH/USD, SOL/USD, AAPL, TSLA
- ~20 messages per second
- Random walk price model
- 5 bps bid-ask spread
- Normal latency: 1-11ms (market data), 5-25ms (orders)

### 4. Database Layer

#### SQL.js (`/lib/db.ts`)

**Technology:**
- SQLite compiled to WebAssembly (SQL.js)
- Runs entirely in browser
- Persisted to localStorage as base64

**Key Functions:**
- `getDb()`: Get or create database instance
- `saveDb()`: Persist database to localStorage

**Data Models:**

```typescript
interface Metric {
  id?: number
  timestamp: number
  metric_type: string
  metric_name: string
  value: number
  metadata?: string
  created_at?: number
}

interface Alert {
  id?: number
  alert_id: string
  name: string
  severity: 'critical' | 'warning' | 'info'
  condition_type: string
  threshold?: number
  current_value?: number
  status: 'active' | 'resolved' | 'acknowledged'
  triggered_at?: number
  resolved_at?: number
  message?: string
  metadata?: string
  created_at?: number
}

interface Incident {
  id?: number
  incident_id: string
  alert_id?: string
  title: string
  description?: string
  severity: 'critical' | 'warning' | 'info'
  status: 'open' | 'investigating' | 'resolved'
  remediation_action?: string
  remediation_status?: string
  started_at: number
  resolved_at?: number
  mttd_seconds?: number
  mttr_seconds?: number
  metadata?: string
  created_at?: number
}

interface Runbook {
  id?: number
  runbook_id: string
  title: string
  alert_type: string
  severity: string
  description: string
  triage_steps: string
  remediation_steps: string
  rollback_steps?: string
  related_alerts?: string
  created_at?: number
  updated_at?: number
}

interface FeedHealth {
  id?: number
  feed_name: string
  feed_type: 'market_data' | 'order_gateway'
  last_heartbeat: number
  status: 'healthy' | 'degraded' | 'down'
  latency_ms?: number
  message_count?: number
  error_count?: number
  updated_at?: number
}
```

**Schema Design:**
- Indexed on critical query fields (timestamp, status, severity)
- Foreign key relationships (incidents → alerts)
- Check constraints for enum fields
- Default timestamps using SQLite functions

See [DATABASE.md](./DATABASE.md) for detailed schema documentation.

## Data Flow

### 1. Metrics Collection Flow

```
Simulator → MetricsEngine.recordMetric() → Buffer → Database
                                                   ↓
                                              localStorage
```

1. Simulator generates events (market data, orders)
2. Events are converted to metrics via API call
3. MetricsEngine buffers metrics in memory
4. Metrics are batched and flushed to database
5. Database is persisted to localStorage

### 2. Alerting Flow

```
Timer → POST /api/metrics → MetricsEngine.calculateKPIs()
                         ↓
          AlertingEngine.checkAlerts() → Database
                         ↓
          [Alert Triggered?] ─── Yes ──→ Create Incident
                         │               ↓
                         │          Auto-Remediate
                         │               ↓
                         │          Update UI
                         No
                         ↓
          [Alert Cleared?] ─── Yes ──→ Resolve Incident
```

1. Timer triggers alert check every 5 seconds
2. Current KPIs are calculated
3. All alert rules are evaluated
4. New alerts create incidents
5. Auto-remediation is attempted
6. Cleared alerts resolve incidents
7. UI updates with latest state

### 3. UI Update Flow

```
Timer → Parallel Fetch:
        - GET /api/metrics?type=kpis
        - GET /api/metrics?type=alerts
        - GET /api/metrics?type=incidents
        - GET /api/metrics?type=timeseries
                         ↓
                    Update State
                         ↓
                   Re-render UI
```

UI polls multiple endpoints every 5 seconds for real-time updates.

## Design Patterns

### 1. Engine Pattern
Core business logic is encapsulated in "Engine" classes:
- MetricsEngine: Metrics collection and KPI calculation
- AlertingEngine: Alert evaluation and incident management
- MarketSimulator: Event generation

Benefits:
- Testable in isolation
- Reusable across API routes
- Clear separation of concerns

### 2. Repository Pattern
Database access is abstracted through `db.ts`:
- Single source of truth for schema
- Type-safe interfaces
- Consistent persistence strategy

### 3. Component Composition
UI is built from small, focused components:
- Single responsibility
- Props-based configuration
- Reusable UI primitives from shadcn/ui

### 4. API Route Pattern
Next.js API routes follow REST conventions:
- GET for retrieval
- POST for creation
- PATCH for updates
- Consistent error handling
- JSON responses

## State Management

### Client-Side State
- React useState for component state
- React useEffect for side effects
- Polling-based updates (5-second intervals)
- No global state management (Redux/Zustand)

### Server-Side State
- Database is the source of truth
- No server-side session/cache
- Stateless API routes

## Performance Optimizations

### 1. Metrics Buffering
- Buffer up to 1000 metrics in memory
- Batch insert to database
- Reduces database write operations

### 2. Time-Series Queries
- Indexed on timestamp for fast range queries
- Limit results to prevent large transfers
- Efficient percentile calculations

### 3. Alert Evaluation
- In-memory rule evaluation
- Only check changed metrics
- Maintain alert state map for quick lookups

### 4. Database Persistence
- Lazy persistence to localStorage
- Only save on change
- Compressed base64 encoding

## Security Considerations

### Current Implementation
- **No Authentication**: Single-user browser application
- **No Authorization**: All data accessible
- **Client-Side Only**: No server-side secrets
- **Browser Sandbox**: Data isolated to origin

### Production Recommendations
For production deployment, consider:
- Authentication (OAuth, SAML)
- Role-based access control
- API rate limiting
- Input validation and sanitization
- HTTPS enforcement
- Content Security Policy
- Server-side database

## Scalability Considerations

### Current Limitations
- **Browser Storage**: ~5-10MB localStorage limit
- **Single Client**: No multi-user support
- **Client-Side Processing**: Limited by browser performance
- **No Clustering**: Single browser instance

### Scaling Recommendations
For production scale:
- Move to server-side database (PostgreSQL, TimescaleDB)
- Implement real-time updates (WebSockets, Server-Sent Events)
- Add caching layer (Redis)
- Horizontal scaling with load balancer
- Metrics aggregation and downsampling
- Distributed tracing

## Error Handling

### API Layer
- Try-catch blocks around all operations
- Consistent error response format
- HTTP status codes (400, 500)
- Error logging to console

### UI Layer
- Toast notifications for user feedback
- Graceful degradation on API failures
- Loading states during async operations
- Error boundaries for component crashes

### Database Layer
- Connection retry logic
- Transaction rollback on failure
- Data validation before insert
- Schema constraints

## Testing Strategy

### Unit Tests
- Engine classes (metrics, alerting)
- Utility functions
- Data transformations

### Integration Tests
- API route handlers
- Database operations
- End-to-end flows

### Manual Testing
- UI interactions
- Chaos scenarios
- Alert triggering
- Incident lifecycle

## Future Architecture Improvements

1. **Real-Time Updates**: Replace polling with WebSockets or SSE
2. **Worker Threads**: Move heavy processing to Web Workers
3. **IndexedDB**: Use for better storage capacity and performance
4. **Service Worker**: Enable offline functionality
5. **Streaming APIs**: Stream large datasets to UI
6. **Graph Database**: For complex alert/incident relationships
7. **Machine Learning**: Anomaly detection and predictive alerts
8. **Multi-Tenancy**: Support multiple users/organizations

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [SQL.js Documentation](https://sql.js.org)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Recharts Documentation](https://recharts.org)
