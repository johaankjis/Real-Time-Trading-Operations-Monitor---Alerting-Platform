# Deployment Guide

This guide covers deploying the Trading Operations Monitor to various hosting platforms.

## Table of Contents

- [Overview](#overview)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Vercel Deployment](#vercel-deployment)
- [Netlify Deployment](#netlify-deployment)
- [Docker Deployment](#docker-deployment)
- [Self-Hosted Deployment](#self-hosted-deployment)
- [Environment Configuration](#environment-configuration)
- [Production Optimizations](#production-optimizations)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

## Overview

The Trading Operations Monitor is a Next.js application that can be deployed to various platforms. It's optimized for serverless deployments but can also run on traditional servers.

### Deployment Targets

- **Vercel** (Recommended): Zero-config deployment for Next.js
- **Netlify**: Static site hosting with serverless functions
- **Docker**: Containerized deployment for any platform
- **Self-Hosted**: Traditional server deployment with Node.js

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All dependencies are up to date
- [ ] Build completes without errors: `pnpm build`
- [ ] Linting passes: `pnpm lint`
- [ ] Application tested locally in production mode
- [ ] Environment variables configured (if any)
- [ ] Database initialization tested
- [ ] API routes tested
- [ ] Performance optimized
- [ ] Security review completed

**Test production build locally:**
```bash
pnpm build
pnpm start
# Visit http://localhost:3000
```

## Vercel Deployment

Vercel is the recommended platform for Next.js applications.

### Method 1: Deploy from GitHub (Recommended)

1. **Push code to GitHub:**
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

2. **Import to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure project (use defaults)
   - Click "Deploy"

3. **Automatic deployments:**
   - Every push to `main` triggers deployment
   - Preview deployments for pull requests
   - Instant rollbacks available

### Method 2: Deploy with CLI

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
# First time deployment
vercel

# Production deployment
vercel --prod
```

3. **Configure project:**
```bash
# Set environment variables
vercel env add NEXT_PUBLIC_API_URL

# Link to existing project
vercel link
```

### Vercel Configuration

**vercel.json** (optional):
```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_APP_NAME": "Trading Ops Monitor"
  }
}
```

### Custom Domain

1. **Add domain in Vercel dashboard:**
   - Project Settings → Domains
   - Add your domain
   - Configure DNS records as instructed

2. **DNS Configuration:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## Netlify Deployment

### Method 1: Deploy from GitHub

1. **Push to GitHub** (same as Vercel)

2. **Connect to Netlify:**
   - Visit [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub repository
   - Configure build settings:
     - **Build command:** `pnpm build`
     - **Publish directory:** `.next`
   - Click "Deploy"

### Method 2: Netlify CLI

1. **Install CLI:**
```bash
npm i -g netlify-cli
```

2. **Deploy:**
```bash
# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

### Netlify Configuration

**netlify.toml:**
```toml
[build]
  command = "pnpm build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
```

## Docker Deployment

### Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Set to production
ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  trading-ops-monitor:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

### Build and Run

```bash
# Build image
docker build -t trading-ops-monitor .

# Run container
docker run -p 3000:3000 trading-ops-monitor

# Or use docker-compose
docker-compose up -d
```

### Docker Hub Deployment

```bash
# Tag image
docker tag trading-ops-monitor username/trading-ops-monitor:latest

# Push to Docker Hub
docker push username/trading-ops-monitor:latest

# Pull and run on server
docker pull username/trading-ops-monitor:latest
docker run -d -p 3000:3000 username/trading-ops-monitor:latest
```

## Self-Hosted Deployment

### Prerequisites

- Node.js 18+ installed
- Process manager (PM2 recommended)
- Reverse proxy (nginx/Apache)
- SSL certificate (Let's Encrypt)

### Setup on Ubuntu/Debian

1. **Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Install pnpm:**
```bash
npm install -g pnpm
```

3. **Clone and build:**
```bash
cd /var/www
git clone <repository-url> trading-ops-monitor
cd trading-ops-monitor
pnpm install
pnpm build
```

4. **Install PM2:**
```bash
npm install -g pm2
```

5. **Start application:**
```bash
pm2 start npm --name "trading-ops" -- start
pm2 save
pm2 startup
```

### Nginx Configuration

**/etc/nginx/sites-available/trading-ops:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/trading-ops /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL with Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### PM2 Management

```bash
# View logs
pm2 logs trading-ops

# Restart application
pm2 restart trading-ops

# Stop application
pm2 stop trading-ops

# Monitor
pm2 monit
```

## Environment Configuration

### Environment Variables

Create `.env.local` for environment-specific configuration:

```env
# Application
NEXT_PUBLIC_APP_NAME=Trading Operations Monitor
NEXT_PUBLIC_APP_VERSION=1.0.0

# API Configuration (if using external APIs)
NEXT_PUBLIC_API_BASE_URL=https://api.example.com

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_MIXPANEL_TOKEN=your-token

# Feature Flags
NEXT_PUBLIC_ENABLE_CHAOS=true
NEXT_PUBLIC_ENABLE_EXPORT=false

# Performance
NEXT_PUBLIC_METRICS_INTERVAL=5000
NEXT_PUBLIC_MAX_METRICS_BUFFER=1000
```

### Build-time vs Runtime

**Build-time variables** (prefix with `NEXT_PUBLIC_`):
- Embedded in build
- Available in browser
- Cannot be changed after build

**Runtime variables** (server-side only):
- Not exposed to browser
- Can be changed without rebuild
- Used in API routes only

## Production Optimizations

### Next.js Configuration

**next.config.mjs:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Optimize images
  images: {
    domains: ['your-domain.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // Compress output
  compress: true,

  // Optimize production build
  productionBrowserSourceMaps: false,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

### Performance Tuning

**1. Enable caching:**
```typescript
// API route with caching
export const revalidate = 60 // Revalidate every 60 seconds

export async function GET() {
  // ... fetch data
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    }
  })
}
```

**2. Optimize bundle size:**
```bash
# Analyze bundle
npm install @next/bundle-analyzer

# Run analysis
ANALYZE=true pnpm build
```

**3. Database optimization:**
```typescript
// Implement data retention
const cleanupOldData = async () => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  await db.run('DELETE FROM metrics WHERE timestamp < ?', cutoff)
}
```

### CDN Configuration

For static assets, configure CDN:

**Cloudflare:**
1. Add site to Cloudflare
2. Update DNS to Cloudflare nameservers
3. Enable caching for static assets
4. Configure page rules for API routes

**CloudFront:**
1. Create CloudFront distribution
2. Set origin to deployment URL
3. Configure cache behaviors
4. Update DNS CNAME

## Monitoring and Logging

### Application Monitoring

**Vercel Analytics:**
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**Error Tracking (Sentry):**
```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

### Logging Strategy

**Structured logging:**
```typescript
const logger = {
  info: (msg: string, meta?: any) => {
    console.log(JSON.stringify({ level: 'info', msg, ...meta, timestamp: Date.now() }))
  },
  error: (msg: string, error?: Error) => {
    console.error(JSON.stringify({ level: 'error', msg, error: error?.message, timestamp: Date.now() }))
  }
}

// Usage
logger.info('Alert triggered', { alertId: 'high_latency' })
```

### Health Checks

**Create health endpoint:**
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database
    const db = await getDb()
    db.exec('SELECT 1')
    
    return Response.json({
      status: 'healthy',
      timestamp: Date.now()
    })
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 503 })
  }
}
```

**Monitor endpoint:**
```bash
# UptimeRobot, Pingdom, or similar
curl https://your-domain.com/api/health
```

## Troubleshooting

### Build Failures

**Error: Out of memory**
```bash
# Increase Node memory limit
NODE_OPTIONS=--max-old-space-size=4096 pnpm build
```

**Error: Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
pnpm build
```

### Runtime Issues

**Database not persisting:**
- Check localStorage quota in browser
- Verify saveDb() is called after updates
- Check browser console for errors

**API routes failing:**
- Verify route exports are correct
- Check server logs for errors
- Test endpoints with curl/Postman

**Slow performance:**
- Enable compression in nginx/CDN
- Optimize database queries
- Implement caching
- Use CDN for static assets

### Deployment Rollback

**Vercel:**
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

**PM2:**
```bash
# Rollback to previous version
cd /var/www/trading-ops-monitor
git reset --hard HEAD~1
pnpm install
pnpm build
pm2 restart trading-ops
```

**Docker:**
```bash
# Pull previous version
docker pull username/trading-ops-monitor:previous-tag
docker stop trading-ops
docker rm trading-ops
docker run -d -p 3000:3000 username/trading-ops-monitor:previous-tag
```

## Security Checklist

- [ ] HTTPS enabled (SSL certificate)
- [ ] Security headers configured
- [ ] CORS properly configured (if needed)
- [ ] Rate limiting implemented (if needed)
- [ ] Environment variables secured
- [ ] No secrets in client-side code
- [ ] Dependencies up to date
- [ ] Regular security audits: `npm audit`

## Maintenance

### Regular Tasks

**Weekly:**
- Check application logs
- Monitor error rates
- Review performance metrics
- Update dependencies (patch versions)

**Monthly:**
- Security audit: `npm audit`
- Update minor versions
- Review and archive old data
- Test backup/restore procedures

**Quarterly:**
- Review and update documentation
- Performance optimization review
- Security review
- Major version updates

### Backup Strategy

**Database backup:**
```typescript
// Periodic export
const exportDatabase = async () => {
  const db = await getDb()
  const data = db.export()
  // Upload to cloud storage (S3, etc.)
}
```

**Code backup:**
- Use Git for version control
- Regular GitHub backups
- Tag releases: `git tag v1.0.0`

## Support

For deployment issues:
1. Check logs: `pm2 logs` or platform dashboard
2. Review this documentation
3. Check platform-specific docs
4. Open GitHub issue with:
   - Deployment platform
   - Error messages
   - Deployment configuration
   - Steps to reproduce

## Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Docker Documentation](https://docs.docker.com)
- [PM2 Documentation](https://pm2.keymetrics.io/docs)
- [Nginx Documentation](https://nginx.org/en/docs)
