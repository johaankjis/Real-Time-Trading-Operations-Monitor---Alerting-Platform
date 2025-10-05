# Components Documentation

This document describes all React components in the Trading Operations Monitor application.

## Component Architecture

The application follows a component-based architecture with:
- **Feature Components**: Domain-specific UI components
- **UI Components**: Reusable design system components (shadcn/ui)
- **Page Components**: Top-level route components

## Feature Components

### 1. MetricsCard

**Location:** `/components/metrics-card.tsx`

**Purpose:** Display individual KPI metrics with visual indicators.

**Props:**
```typescript
interface MetricsCardProps {
  title: string           // Metric name (e.g., "Fill Rate")
  value: string | number  // Current metric value
  trend?: number          // Percentage change (positive/negative)
  icon: React.ReactNode   // Lucide icon component
  description?: string    // Optional description
}
```

**Features:**
- Large value display with formatting
- Trend indicator (up/down arrow with color)
- Icon with consistent styling
- Responsive card layout
- Supports percentage, duration, and numeric formats

**Usage Example:**
```tsx
<MetricsCard
  title="Fill Rate"
  value="92.5%"
  trend={2.3}
  icon={<TrendingUp />}
  description="Orders filled successfully"
/>
```

**Styling:**
- Uses Card component from shadcn/ui
- Trend colors: Green (positive), Red (negative)
- Icon background with opacity
- Responsive text sizing

---

### 2. TimeSeriesChart

**Location:** `/components/time-series-chart.tsx`

**Purpose:** Render time-series metrics data as line charts.

**Props:**
```typescript
interface TimeSeriesChartProps {
  data: Array<{
    timestamp: number
    value: number
  }>
  title: string
  dataKey: string         // Key for y-axis data
  color?: string          // Line color (default: primary)
  yAxisLabel?: string     // Y-axis label
  height?: number         // Chart height (default: 200)
}
```

**Features:**
- Responsive line chart using Recharts
- Automatic time formatting on x-axis
- Hover tooltips with values
- Grid lines for readability
- Customizable colors and dimensions
- Empty state handling

**Usage Example:**
```tsx
<TimeSeriesChart
  data={latencyData}
  title="Order Latency P95"
  dataKey="value"
  color="#8884d8"
  yAxisLabel="Latency (ms)"
  height={250}
/>
```

**Chart Configuration:**
- X-axis: Timestamp (formatted as HH:mm:ss)
- Y-axis: Metric value with automatic scaling
- Tooltip: Shows timestamp and value
- Responsive container for all screen sizes

---

### 3. AlertList

**Location:** `/components/alert-list.tsx`

**Purpose:** Display list of active alerts with severity indicators.

**Props:**
```typescript
interface AlertListProps {
  alerts: Alert[]
  onSelectAlert: (alert: Alert) => void
}

interface Alert {
  id?: number
  alert_id: string
  name: string
  severity: 'critical' | 'warning' | 'info'
  status: 'active' | 'resolved' | 'acknowledged'
  triggered_at?: number
  current_value?: number
  threshold?: number
  message?: string
}
```

**Features:**
- Color-coded severity badges
- Clickable alerts for runbook display
- Timestamp formatting
- Current value vs threshold display
- Empty state when no alerts
- Scrollable container

**Usage Example:**
```tsx
<AlertList
  alerts={activeAlerts}
  onSelectAlert={(alert) => {
    // Load and display runbook
    loadRunbook(alert.alert_id)
  }}
/>
```

**Severity Colors:**
- **Critical**: Red background (destructive)
- **Warning**: Yellow/Orange background
- **Info**: Blue/Gray background

**Alert States:**
- **Active**: Solid color badge
- **Acknowledged**: Outlined badge
- **Resolved**: Success color badge

---

### 4. IncidentTimeline

**Location:** `/components/incident-timeline.tsx`

**Purpose:** Display chronological incident history with remediation status.

**Props:**
```typescript
interface IncidentTimelineProps {
  incidents: Incident[]
}

interface Incident {
  id?: number
  incident_id: string
  title: string
  description?: string
  severity: 'critical' | 'warning' | 'info'
  status: 'open' | 'investigating' | 'resolved'
  remediation_action?: string
  remediation_status?: string
  started_at: number
  resolved_at?: number
}
```

**Features:**
- Timeline visualization with connecting lines
- Status icons (AlertCircle, Clock, CheckCircle)
- Duration calculation (auto-updates for open incidents)
- Remediation action display
- Color-coded by status
- Empty state handling

**Usage Example:**
```tsx
<IncidentTimeline incidents={recentIncidents} />
```

**Timeline Layout:**
- Vertical timeline with cards
- Icon indicator for each incident
- Connecting line between incidents
- Most recent at top

**Status Indicators:**
- **Open**: Red circle with AlertCircle icon
- **Investigating**: Yellow circle with Clock icon
- **Resolved**: Green circle with CheckCircle icon

---

### 5. RunbookViewer

**Location:** `/components/runbook-viewer.tsx`

**Purpose:** Display operational runbook with step-by-step procedures.

**Props:**
```typescript
interface RunbookViewerProps {
  runbook: Runbook | null
}

interface Runbook {
  runbook_id: string
  title: string
  alert_type: string
  severity: string
  description: string
  triage_steps: string      // Newline-separated steps
  remediation_steps: string // Newline-separated steps
  rollback_steps?: string   // Newline-separated steps
  related_alerts?: string   // Comma-separated alert IDs
}
```

**Features:**
- Three-section layout: Triage, Remediation, Rollback
- Numbered step lists
- Section icons (AlertTriangle, Wrench, Undo)
- Severity badge display
- Empty state when no runbook selected
- Scrollable content

**Usage Example:**
```tsx
<RunbookViewer runbook={selectedRunbook} />
```

**Step Parsing:**
Steps are parsed from newline-separated strings:
```
"1. Check current status\n2. Review logs\n3. Verify connectivity"
```
Each step is displayed as a numbered list item.

**Sections:**
1. **Triage Steps**: Diagnostic procedures (blue icon)
2. **Remediation Steps**: Fix procedures (green icon)
3. **Rollback Steps**: Restore procedures (orange icon, optional)

---

### 6. ChaosControls

**Location:** `/components/chaos-controls.tsx`

**Purpose:** Provide controls for chaos engineering experiments.

**Props:**
```typescript
interface ChaosControlsProps {
  onChaosChange: (type: string, config: any) => void
}
```

**Features:**
- Toggle switches for chaos scenarios
- Slider controls for parameter tuning
- Real-time config updates
- Visual feedback on active chaos
- Organized in card layout

**Usage Example:**
```tsx
<ChaosControls
  onChaosChange={(type, config) => {
    // Update simulator with chaos config
    updateSimulator(type, config)
  }}
/>
```

**Chaos Scenarios:**

1. **Latency Spike**
   - Toggle: Enable/disable
   - Slider: 50-500ms latency
   - Updates in real-time

2. **High Reject Rate**
   - Toggle: Enable/disable
   - Slider: 5-50% reject rate
   - Updates in real-time

**Control Flow:**
```
User adjusts slider → onChaosChange(type, config) → API call → Simulator updates
```

---

## Page Components

### 7. TradingOpsMonitor (Main Page)

**Location:** `/app/page.tsx`

**Purpose:** Main dashboard orchestrating all components.

**State Management:**
```typescript
// Simulator state
const [isRunning, setIsRunning] = useState(false)
const [isInitialized, setIsInitialized] = useState(false)

// Data state
const [kpis, setKpis] = useState<KPIMetrics | null>(null)
const [alerts, setAlerts] = useState<Alert[]>([])
const [incidents, setIncidents] = useState<Incident[]>([])
const [timeSeriesData, setTimeSeriesData] = useState<any[]>([])
const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null)
```

**Lifecycle:**
```
Component Mount
  ↓
Check localStorage for DB
  ↓
[DB exists?] → Yes → Load existing data
  ↓
  No → Show "Initialize Database" button
  ↓
User clicks "Start Simulator"
  ↓
Start polling (5s intervals)
  ↓
Fetch: KPIs, Alerts, Incidents, Time-Series
  ↓
Update UI
```

**Key Functions:**

```typescript
// Initialize database
async function initializeDatabase() {
  await fetch('/api/init', { method: 'POST' })
  setIsInitialized(true)
}

// Start simulator
async function startSimulator() {
  await fetch('/api/simulator', {
    method: 'POST',
    body: JSON.stringify({ action: 'start' })
  })
  setIsRunning(true)
  // Start polling
}

// Handle alert selection
function handleAlertSelect(alert: Alert) {
  // Fetch runbook for alert type
  loadRunbook(alert.alert_id)
}

// Handle chaos configuration
async function handleChaosChange(type: string, config: any) {
  await fetch('/api/simulator', {
    method: 'POST',
    body: JSON.stringify({ action: 'chaos', config: { type, ...config } })
  })
}
```

**Layout Structure:**
```
<div className="min-h-screen">
  <div className="max-w-[1800px] mx-auto">
    <!-- Header with title and controls -->
    <Header>
      <Controls />
    </Header>
    
    <!-- KPI Cards -->
    <Grid>
      <MetricsCard /> x4
    </Grid>
    
    <!-- Time-Series Charts -->
    <Grid>
      <TimeSeriesChart /> x2
    </Grid>
    
    <!-- Chaos Controls -->
    <ChaosControls />
    
    <!-- Alerts and Incidents -->
    <Grid>
      <AlertList />
      <IncidentTimeline />
    </Grid>
    
    <!-- Runbook Viewer -->
    <RunbookViewer />
  </div>
</div>
```

---

## UI Component Library

The application uses [shadcn/ui](https://ui.shadcn.com) components built on Radix UI primitives. These are located in `/components/ui/`.

### Core UI Components

#### Card
**Usage:** Container for grouped content
```tsx
<Card className="p-6">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

#### Badge
**Usage:** Status indicators, labels
```tsx
<Badge variant="destructive">Critical</Badge>
<Badge variant="secondary">Warning</Badge>
<Badge variant="outline">Info</Badge>
```

#### Button
**Usage:** Actions, controls
```tsx
<Button onClick={handleClick}>Click Me</Button>
<Button variant="destructive">Stop</Button>
<Button variant="outline">Secondary</Button>
```

#### Switch
**Usage:** Toggle controls
```tsx
<Switch
  checked={enabled}
  onCheckedChange={setEnabled}
/>
```

#### Slider
**Usage:** Numeric input with range
```tsx
<Slider
  value={[value]}
  onValueChange={([val]) => setValue(val)}
  min={0}
  max={100}
  step={5}
/>
```

#### Label
**Usage:** Form field labels
```tsx
<Label htmlFor="field">Field Name</Label>
```

---

## Component Patterns

### 1. Prop Drilling Prevention

For deeply nested components, consider:
```tsx
// Context for shared state
const DashboardContext = React.createContext<DashboardState>({})

// Provider at top level
<DashboardContext.Provider value={state}>
  <ChildComponents />
</DashboardContext.Provider>

// Consume in children
const { alerts } = useContext(DashboardContext)
```

### 2. Loading States

Show loading indicators during async operations:
```tsx
{isLoading ? (
  <Spinner />
) : (
  <DataComponent data={data} />
)}
```

### 3. Error Boundaries

Catch component errors gracefully:
```tsx
<ErrorBoundary fallback={<ErrorMessage />}>
  <FeatureComponent />
</ErrorBoundary>
```

### 4. Conditional Rendering

Handle empty states and errors:
```tsx
{data.length === 0 ? (
  <EmptyState message="No data available" />
) : (
  <DataList items={data} />
)}
```

---

## Styling Patterns

### Tailwind CSS Classes

**Common Patterns:**
```tsx
// Card with border and padding
className="p-6 bg-card border-border"

// Flex layout
className="flex items-center justify-between"

// Grid layout
className="grid grid-cols-1 lg:grid-cols-2 gap-6"

// Text styling
className="text-sm font-medium text-foreground"
className="text-xs text-muted-foreground"

// Spacing
className="space-y-4"  // Vertical spacing
className="space-x-2"  // Horizontal spacing
className="gap-4"      // Grid/flex gap
```

### Color Tokens

Using CSS variables for theme support:
```css
--foreground: Main text color
--muted-foreground: Secondary text
--primary: Brand color
--destructive: Error/critical color
--warning: Warning color
--success: Success color
--border: Border color
--card: Card background
```

### Responsive Design

Mobile-first approach with breakpoints:
```tsx
// Mobile: 1 column, Desktop: 2 columns
className="grid grid-cols-1 lg:grid-cols-2"

// Small text on mobile, larger on desktop
className="text-sm md:text-base"

// Hidden on mobile, visible on desktop
className="hidden md:block"
```

---

## Component Testing

### Unit Testing Pattern

```typescript
import { render, screen } from '@testing-library/react'
import { MetricsCard } from './metrics-card'

describe('MetricsCard', () => {
  it('displays metric value', () => {
    render(
      <MetricsCard
        title="Fill Rate"
        value="92.5%"
        icon={<TrendingUp />}
      />
    )
    
    expect(screen.getByText('Fill Rate')).toBeInTheDocument()
    expect(screen.getByText('92.5%')).toBeInTheDocument()
  })
  
  it('shows positive trend indicator', () => {
    render(
      <MetricsCard
        title="Fill Rate"
        value="92.5%"
        trend={2.3}
        icon={<TrendingUp />}
      />
    )
    
    const trend = screen.getByText('+2.3%')
    expect(trend).toHaveClass('text-success')
  })
})
```

### Integration Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TradingOpsMonitor from './page'

describe('TradingOpsMonitor', () => {
  it('initializes database on button click', async () => {
    render(<TradingOpsMonitor />)
    
    const initButton = screen.getByText('Initialize Database')
    await userEvent.click(initButton)
    
    await waitFor(() => {
      expect(screen.getByText('Start Simulator')).toBeInTheDocument()
    })
  })
})
```

---

## Performance Optimization

### 1. Memoization

Prevent unnecessary re-renders:
```tsx
const MemoizedChart = React.memo(TimeSeriesChart, (prev, next) => {
  return prev.data === next.data
})
```

### 2. Lazy Loading

Split large components:
```tsx
const HeavyComponent = React.lazy(() => import('./heavy-component'))

<Suspense fallback={<Spinner />}>
  <HeavyComponent />
</Suspense>
```

### 3. Debouncing

Limit expensive operations:
```tsx
const debouncedUpdate = useMemo(
  () => debounce((value) => updateState(value), 300),
  []
)
```

### 4. Virtual Scrolling

For large lists (future enhancement):
```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

// Render only visible items
```

---

## Accessibility

### ARIA Labels

```tsx
<button aria-label="Start simulator">
  <Play />
</button>

<div role="alert" aria-live="polite">
  {alertMessage}
</div>
```

### Keyboard Navigation

All interactive elements should be keyboard accessible:
```tsx
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
  Click me
</div>
```

### Focus Management

```tsx
const buttonRef = useRef<HTMLButtonElement>(null)

useEffect(() => {
  if (shouldFocus) {
    buttonRef.current?.focus()
  }
}, [shouldFocus])
```

---

## Component Guidelines

### 1. Single Responsibility
Each component should do one thing well.

### 2. Props Validation
Use TypeScript interfaces for all props.

### 3. Default Props
Provide sensible defaults:
```tsx
interface Props {
  color?: string
  height?: number
}

function Component({ color = '#000', height = 200 }: Props) {
  // ...
}
```

### 4. Error Handling
Handle edge cases gracefully:
```tsx
if (!data || data.length === 0) {
  return <EmptyState />
}
```

### 5. Documentation
Add JSDoc comments for complex components:
```tsx
/**
 * Displays a time-series chart with configurable dimensions.
 * 
 * @param data - Array of timestamp/value pairs
 * @param title - Chart title
 * @param color - Line color (hex)
 */
export function TimeSeriesChart({ data, title, color }: Props) {
  // ...
}
```

---

## Future Component Enhancements

1. **DataGrid**: Sortable, filterable table component
2. **FilterBar**: Advanced filtering UI
3. **ExportButton**: Export data to CSV/JSON
4. **NotificationCenter**: Centralized alert notifications
5. **SettingsPanel**: User preferences and configuration
6. **SearchBar**: Global search across alerts/incidents
7. **DarkModeToggle**: Theme switching
8. **HelpTooltips**: Contextual help overlays

---

## References

- [React Documentation](https://react.dev)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com)
- [Recharts Documentation](https://recharts.org)
- [Lucide Icons](https://lucide.dev)
- [Tailwind CSS](https://tailwindcss.com)
