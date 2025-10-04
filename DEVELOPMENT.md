# Development Guide

This guide covers development setup, workflows, and best practices for contributing to the Trading Operations Monitor.

## Table of Contents

- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Debugging](#debugging)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## Development Environment

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **Package Manager**: pnpm (recommended) or npm
- **IDE**: VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - React/Next.js snippets

### Initial Setup

1. **Clone the repository:**
```bash
git clone https://github.com/johaankjis/Real-Time-Trading-Operations-Monitor---Alerting-Platform.git
cd Real-Time-Trading-Operations-Monitor---Alerting-Platform
```

2. **Install dependencies:**
```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

3. **Start development server:**
```bash
pnpm dev
# or
npm run dev
```

4. **Open browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Configuration

No environment variables are required for basic development. The application runs entirely client-side.

For production deployment, consider adding:
```env
# .env.local (optional)
NEXT_PUBLIC_API_BASE_URL=https://your-api.com
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

## Project Structure

```
├── app/                        # Next.js App Router
│   ├── api/                   # API route handlers
│   │   ├── alerts/           # Alert CRUD operations
│   │   ├── incidents/        # Incident management
│   │   ├── init/             # Database initialization
│   │   ├── metrics/          # Metrics and KPIs
│   │   ├── runbooks/         # Runbook operations
│   │   └── simulator/        # Simulator control
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main dashboard
│
├── components/                # React components
│   ├── alert-list.tsx        # Alert display
│   ├── chaos-controls.tsx    # Chaos engineering
│   ├── incident-timeline.tsx # Incident history
│   ├── metrics-card.tsx      # KPI cards
│   ├── runbook-viewer.tsx    # Runbook display
│   ├── time-series-chart.tsx # Charts
│   └── ui/                   # shadcn/ui components
│
├── lib/                       # Core libraries
│   ├── alerting-engine.ts    # Alert rules and evaluation
│   ├── db.ts                 # Database interface
│   ├── metrics-engine.ts     # Metrics collection
│   ├── simulator.ts          # Market simulator
│   └── utils.ts              # Utility functions
│
├── hooks/                     # Custom React hooks
│   ├── use-mobile.ts         # Mobile detection
│   └── use-toast.ts          # Toast notifications
│
├── scripts/                   # SQL scripts
│   └── 001-init-database.sql # Database schema
│
├── public/                    # Static assets
├── styles/                    # Additional styles
└── docs/                      # Documentation
```

## Development Workflow

### Feature Development Process

1. **Create a feature branch:**
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes:**
   - Write code following style guidelines
   - Add tests for new functionality
   - Update documentation if needed

3. **Test locally:**
```bash
pnpm dev         # Start dev server
pnpm lint        # Run linter
pnpm build       # Test production build
```

4. **Commit changes:**
```bash
git add .
git commit -m "feat: Add new feature description"
```

5. **Push and create PR:**
```bash
git push origin feature/your-feature-name
```

### Commit Message Convention

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Build/tooling changes

**Examples:**
```
feat(alerts): Add custom alert threshold configuration
fix(simulator): Resolve latency calculation bug
docs(readme): Update installation instructions
refactor(metrics): Simplify KPI calculation logic
```

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch (if used)
- `feature/*`: New features
- `fix/*`: Bug fixes
- `docs/*`: Documentation updates

## Code Style

### TypeScript Guidelines

**1. Use TypeScript strict mode:**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true
  }
}
```

**2. Define explicit types:**
```typescript
// Good
interface MetricsData {
  value: number
  timestamp: number
}

function processMetrics(data: MetricsData): number {
  return data.value
}

// Avoid
function processMetrics(data: any) {
  return data.value
}
```

**3. Use type inference when clear:**
```typescript
// Good
const count = 10  // Type inferred as number
const items = ['a', 'b', 'c']  // Type inferred as string[]

// Unnecessary
const count: number = 10
```

**4. Prefer interfaces over types for objects:**
```typescript
// Preferred
interface Alert {
  id: string
  name: string
}

// For unions/intersections
type Status = 'active' | 'resolved'
```

### React Best Practices

**1. Function components with hooks:**
```typescript
// Good
export function MyComponent({ data }: Props) {
  const [state, setState] = useState(0)
  return <div>{data}</div>
}

// Avoid
export class MyComponent extends React.Component {
  // Class components
}
```

**2. Props destructuring:**
```typescript
// Good
export function Card({ title, description }: CardProps) {
  return (
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}

// Avoid
export function Card(props: CardProps) {
  return (
    <div>
      <h2>{props.title}</h2>
      <p>{props.description}</p>
    </div>
  )
}
```

**3. Conditional rendering:**
```typescript
// Good - Clear and concise
{data && <Component data={data} />}

// Good - Explicit
{data ? <Component data={data} /> : <EmptyState />}

// Avoid - Nested ternaries
{data ? (loading ? <Spinner /> : <Component />) : <EmptyState />}
```

**4. Event handlers:**
```typescript
// Good - Inline for simple handlers
<button onClick={() => setCount(count + 1)}>Click</button>

// Good - Named function for complex logic
const handleSubmit = (event: FormEvent) => {
  event.preventDefault()
  // Complex logic
}
<form onSubmit={handleSubmit}>
```

### Styling Guidelines

**1. Use Tailwind utility classes:**
```tsx
// Good
<div className="flex items-center gap-4 p-6 bg-card">

// Avoid custom CSS when Tailwind suffices
<div className="custom-container">
```

**2. Extract repeated patterns:**
```typescript
// Good - Extract to constant or component
const cardStyles = "p-6 bg-card border-border rounded-lg"
<div className={cardStyles}>

// Or create reusable component
<Card variant="outlined">
```

**3. Responsive design:**
```tsx
// Mobile-first approach
<div className="text-sm md:text-base lg:text-lg">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
```

### File Organization

**1. Import order:**
```typescript
// 1. External libraries
import React, { useState } from 'react'
import { Card } from '@/components/ui/card'

// 2. Internal modules
import { getDb } from '@/lib/db'
import { MetricsEngine } from '@/lib/metrics-engine'

// 3. Types
import type { Alert, Incident } from '@/lib/db'

// 4. Styles
import './styles.css'
```

**2. File naming:**
- Components: `kebab-case.tsx` (e.g., `alert-list.tsx`)
- Utilities: `kebab-case.ts` (e.g., `metrics-engine.ts`)
- Types: `PascalCase` (e.g., `interface Alert`)

## Testing

### Unit Testing (Future Enhancement)

Setup Jest and React Testing Library:

```bash
pnpm add -D jest @testing-library/react @testing-library/jest-dom
```

**Example test:**
```typescript
// metrics-engine.test.ts
import { MetricsEngine } from './metrics-engine'

describe('MetricsEngine', () => {
  let engine: MetricsEngine
  
  beforeEach(() => {
    engine = new MetricsEngine()
  })
  
  it('calculates percentile correctly', () => {
    const values = [10, 20, 30, 40, 50]
    const p50 = engine['percentile'](values, 50)
    expect(p50).toBe(30)
  })
  
  it('handles empty arrays', () => {
    const result = engine['percentile']([], 50)
    expect(result).toBe(0)
  })
})
```

**Component test:**
```typescript
// metrics-card.test.tsx
import { render, screen } from '@testing-library/react'
import { MetricsCard } from './metrics-card'
import { TrendingUp } from 'lucide-react'

describe('MetricsCard', () => {
  it('renders metric value', () => {
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
})
```

### Manual Testing

**Test checklist:**
- [ ] Database initialization works
- [ ] Simulator starts/stops correctly
- [ ] Metrics update in real-time
- [ ] Alerts trigger at thresholds
- [ ] Incidents are created automatically
- [ ] Runbooks display correctly
- [ ] Chaos engineering affects metrics
- [ ] UI is responsive on mobile
- [ ] Data persists across page reloads

## Debugging

### Browser DevTools

**Console Logging:**
```typescript
// Add debug logs
console.log('[v0] Metrics recorded:', metrics)
console.error('[v0] Alert check error:', error)

// Structured logging
console.table(kpis)
```

**Network Tab:**
- Monitor API requests
- Check response times
- Verify request/response data

**Application Tab:**
- View localStorage data
- Check database size
- Clear storage if corrupted

### Database Debugging

**Inspect database:**
```typescript
import { getDb } from '@/lib/db'

// In browser console
const db = await getDb()
const result = db.exec('SELECT * FROM alerts')
console.table(result[0].values)
```

**Check database size:**
```typescript
const dbString = localStorage.getItem('trading-ops-db')
const sizeKB = (dbString?.length || 0) / 1024
console.log(`Database size: ${sizeKB.toFixed(2)} KB`)
```

### React DevTools

Install React Developer Tools extension:
- Inspect component props
- View component hierarchy
- Track state changes
- Profile performance

### TypeScript Errors

**Common issues:**

1. **Type mismatch:**
```typescript
// Error: Type 'string' is not assignable to type 'number'
const value: number = "123"

// Fix: Convert type
const value: number = Number("123")
```

2. **Null/undefined:**
```typescript
// Error: Object is possibly 'null'
const name = user.name

// Fix: Optional chaining
const name = user?.name
```

3. **Missing properties:**
```typescript
// Error: Property 'id' is missing
const alert: Alert = { name: "Test" }

// Fix: Provide all required properties
const alert: Alert = {
  alert_id: "test",
  name: "Test",
  severity: "warning",
  // ... other required fields
}
```

## Common Tasks

### Adding a New Alert Rule

1. **Update AlertingEngine:**
```typescript
// lib/alerting-engine.ts
this.rules.push({
  alertId: "new_alert",
  name: "New Alert Name",
  severity: "warning",
  conditionType: "threshold",
  threshold: 100,
  checkFn: (metrics) => metrics.someMetric > 100,
  message: "Alert message"
})
```

2. **Add auto-remediation:**
```typescript
// In autoRemediate() method
case "new_alert":
  action = "Remediation action"
  status = "in_progress"
  break
```

3. **Create runbook:**
```sql
-- scripts/001-init-database.sql
INSERT INTO runbooks VALUES (
  'RB005',
  'New Alert Title',
  'new_alert',
  'warning',
  'Description',
  'Triage steps',
  'Remediation steps',
  'Rollback steps',
  'related_alerts'
);
```

### Adding a New Metric

1. **Record metric in simulator:**
```typescript
// lib/simulator.ts
await metricsEngine.recordMetric(
  'metric_type',
  'metric_name',
  value,
  { metadata: 'optional' }
)
```

2. **Add to KPI calculation:**
```typescript
// lib/metrics-engine.ts
async calculateKPIs() {
  // Query new metric
  const newMetric = await db.get(
    'SELECT value FROM metrics WHERE metric_name = ?',
    'new_metric_name'
  )
  
  return {
    // ... existing KPIs
    newKpi: newMetric?.value || 0
  }
}
```

3. **Display in UI:**
```tsx
// app/page.tsx
<MetricsCard
  title="New Metric"
  value={kpis?.newKpi || 0}
  icon={<Icon />}
/>
```

### Adding a New Component

1. **Create component file:**
```typescript
// components/new-component.tsx
interface NewComponentProps {
  data: any[]
}

export function NewComponent({ data }: NewComponentProps) {
  return (
    <Card>
      {/* Component content */}
    </Card>
  )
}
```

2. **Add to page:**
```tsx
// app/page.tsx
import { NewComponent } from '@/components/new-component'

<NewComponent data={componentData} />
```

### Modifying Database Schema

1. **Update SQL script:**
```sql
-- scripts/002-new-migration.sql
ALTER TABLE alerts ADD COLUMN tags TEXT;
```

2. **Update TypeScript interface:**
```typescript
// lib/db.ts
export interface Alert {
  // ... existing fields
  tags?: string
}
```

3. **Update API handlers:**
```typescript
// app/api/alerts/route.ts
// Include new field in queries and inserts
```

## Troubleshooting

### Common Issues

**1. Database not persisting:**
```typescript
// Check localStorage quota
if (localStorage.length > 5000) {
  console.warn('localStorage approaching limit')
}

// Clear if corrupted
localStorage.removeItem('trading-ops-db')
```

**2. Simulator not generating events:**
```typescript
// Check simulator status
const response = await fetch('/api/simulator', {
  method: 'POST',
  body: JSON.stringify({ action: 'status' })
})
console.log(await response.json())
```

**3. Build errors:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Rebuild
pnpm build
```

**4. TypeScript errors:**
```bash
# Regenerate types
pnpm tsc --noEmit

# Check specific file
pnpm tsc --noEmit path/to/file.ts
```

### Performance Issues

**1. Slow metrics queries:**
```sql
-- Check indexes are being used
EXPLAIN QUERY PLAN
SELECT * FROM metrics WHERE timestamp > ?;
```

**2. Memory leaks:**
```typescript
// Clear intervals on unmount
useEffect(() => {
  const interval = setInterval(fetchData, 5000)
  return () => clearInterval(interval)
}, [])
```

**3. Large database:**
```typescript
// Implement data retention
const cutoff = Date.now() - 24 * 60 * 60 * 1000
db.run('DELETE FROM metrics WHERE timestamp < ?', cutoff)
```

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Tools
- [VS Code](https://code.visualstudio.com/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [SQL.js Documentation](https://sql.js.org/documentation/)

### Community
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)
- [React GitHub](https://github.com/facebook/react)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/next.js)

## Getting Help

1. Check documentation (README, ARCHITECTURE, API docs)
2. Search existing GitHub issues
3. Review code comments and JSDoc
4. Open a new GitHub issue with:
   - Clear description of problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/environment details
   - Relevant code snippets

## Contributing

We welcome contributions! Please:
1. Follow the style guide
2. Add tests for new features
3. Update documentation
4. Keep PRs focused and small
5. Write clear commit messages

See the main [README.md](./README.md) for contribution guidelines.
