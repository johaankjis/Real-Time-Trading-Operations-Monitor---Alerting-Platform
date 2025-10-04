# Real-Time Trading Operations Monitor & Alerting Platform

A comprehensive monitoring and incident response platform for trading operations, featuring real-time metrics collection, automated alerting, incident management, and operational runbooks.

## Overview

This platform provides real-time monitoring of trading operations with intelligent alerting, automated incident response, and chaos engineering capabilities. Built with Next.js 15, React 19, and TypeScript, it offers a modern, responsive interface for operations teams to monitor and respond to trading system issues.

### Key Features

- **Real-Time Metrics Monitoring**: Track order latency, fill rates, reject rates, position exposure, and market data health
- **Intelligent Alerting**: Automated threshold-based alerting with configurable rules
- **Incident Management**: Automatic incident creation, tracking, and resolution with MTTD/MTTR metrics
- **Operational Runbooks**: Step-by-step triage, remediation, and rollback procedures for common alerts
- **Auto-Remediation**: Automated response actions for critical incidents
- **Chaos Engineering**: Built-in chaos controls to test system resilience (latency spikes, high reject rates, stale data)
- **Time-Series Visualization**: Interactive charts for historical metrics analysis
- **Feed Health Monitoring**: Track market data and order gateway health

## Architecture

The platform consists of several key components:

- **Frontend**: Next.js 15 with React 19 and TypeScript
- **Database**: SQL.js (SQLite in browser) with localStorage persistence
- **Metrics Engine**: Time-series metrics collection and KPI calculation
- **Alerting Engine**: Rule-based alerting with auto-remediation
- **Market Simulator**: Realistic trading event simulation for testing
- **API Layer**: RESTful endpoints for all operations

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Quick Start

### Prerequisites

- Node.js 18+ or higher
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/johaankjis/Real-Time-Trading-Operations-Monitor---Alerting-Platform.git
cd Real-Time-Trading-Operations-Monitor---Alerting-Platform
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Run the development server:
```bash
pnpm dev
# or
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### First-Time Setup

1. Click **"Initialize Database"** to create the database schema and load default runbooks
2. Click **"Start Simulator"** to begin generating simulated trading events
3. Observe metrics updating in real-time
4. Use **Chaos Engineering** controls to test alerting and incident response

## Usage

### Monitoring Dashboard

The main dashboard displays:
- **KPI Cards**: Current values for key metrics (fill rate, latency P95/P99, reject rate, position exposure)
- **Time-Series Charts**: Historical metrics visualization
- **Active Alerts**: Real-time alert feed with severity indicators
- **Incident Timeline**: Chronological incident history with remediation actions
- **Runbook Viewer**: Contextual runbooks for selected alerts

### Chaos Engineering

Test your monitoring and alerting system with built-in chaos controls:

- **Latency Spike**: Inject configurable latency (50-500ms) into order processing
- **High Reject Rate**: Simulate order rejects (5-50% reject rate)
- **Stale Data**: Stop market data feed heartbeats

### Alerting Rules

The platform includes pre-configured alert rules:

1. **Stale Market Data Feed** (Critical)
   - Triggers when feed heartbeat exceeds 3 seconds
   - Auto-remediation: Automatic reconnection attempt

2. **High Order Latency** (Warning)
   - Triggers when P95 latency exceeds 100ms
   - Auto-remediation: Switch to backup gateway

3. **High Reject Rate** (Warning)
   - Triggers when reject rate exceeds 5%
   - Auto-remediation: Reduce order rate by 50%

4. **Risk Limit Breach** (Critical)
   - Triggers when position exposure exceeds $1M
   - Auto-remediation: Kill-switch activation

### Incident Response

When an alert triggers:
1. An incident is automatically created
2. The system attempts auto-remediation based on the alert type
3. A runbook is displayed with triage, remediation, and rollback steps
4. MTTD (Mean Time to Detect) and MTTR (Mean Time to Resolve) are tracked
5. Incidents auto-resolve when the underlying condition clears

## Project Structure

```
├── app/
│   ├── api/              # API route handlers
│   │   ├── alerts/       # Alert CRUD operations
│   │   ├── incidents/    # Incident management
│   │   ├── init/         # Database initialization
│   │   ├── metrics/      # Metrics and KPI endpoints
│   │   ├── runbooks/     # Runbook operations
│   │   └── simulator/    # Market simulator control
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main dashboard page
├── components/
│   ├── alert-list.tsx           # Alert display component
│   ├── chaos-controls.tsx       # Chaos engineering controls
│   ├── incident-timeline.tsx    # Incident history
│   ├── metrics-card.tsx         # KPI display cards
│   ├── runbook-viewer.tsx       # Runbook display
│   ├── time-series-chart.tsx    # Metrics charts
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── alerting-engine.ts  # Alert rule engine
│   ├── db.ts               # Database interface
│   ├── metrics-engine.ts   # Metrics collection & KPIs
│   ├── simulator.ts        # Market event simulator
│   └── utils.ts            # Utility functions
├── scripts/
│   └── 001-init-database.sql  # Database schema
└── docs/                   # Additional documentation
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and design patterns
- [API.md](./API.md) - API endpoints and usage
- [DATABASE.md](./DATABASE.md) - Database schema and data models
- [COMPONENTS.md](./COMPONENTS.md) - React component documentation
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guidelines
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions

## Technology Stack

- **Framework**: Next.js 15.2.4 (App Router)
- **Runtime**: React 19
- **Language**: TypeScript 5
- **Database**: SQL.js (SQLite in browser)
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS 4.1
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Hooks

## Development

### Available Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Tailwind CSS for styling
- Component-based architecture
- API routes follow RESTful conventions

For detailed development guidelines, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## Deployment

The application can be deployed to:
- Vercel (recommended for Next.js)
- Any Node.js hosting platform
- Static hosting (with limitations on API routes)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Performance Considerations

- **Metrics Buffering**: Metrics are buffered in memory and flushed every 5 seconds or at 1000 metrics
- **Database Persistence**: SQLite database is persisted to localStorage on changes
- **Time-Series Queries**: Optimized with indexes on timestamp and metric_type
- **Alert Evaluation**: Alerts are checked every 5 seconds during active simulation

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires localStorage and IndexedDB support for persistence.

## Known Limitations

- **Client-Side Database**: All data is stored in browser localStorage (no server-side persistence)
- **Data Retention**: Browser storage limits apply (~5-10MB)
- **Single User**: No multi-user or authentication support
- **No Real Feeds**: Uses simulated market data and order events

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is provided as-is for educational and demonstration purposes.

## Support

For questions or issues, please open a GitHub issue in the repository.

## Acknowledgments

- Built with [v0.dev](https://v0.dev) AI-assisted development
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
