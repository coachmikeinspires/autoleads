# AutoLeads Deployment Guide

## Current Production Topology

- Hosting: Vercel
- Database: Neon Postgres provisioned through the Vercel Marketplace integration
- Auth: NextAuth credentials provider with JWT sessions
- CI/CD: GitHub Actions workflow in `.github/workflows/ci-cd.yml`

## Quick Deploy to Vercel

### 1. Connect GitHub

```bash
git remote add origin <your-repo>
git push origin main
```

Log in to [vercel.com](https://vercel.com) and import the repository.

### 2. Provision the Database

Use the Vercel Marketplace integration to create and connect a Neon database:

```bash
npx vercel integration add neon --plan free_v3 -e production -e preview -m region=iad1 -m auth=false --format=json
```

This injects the Postgres variables used by production:

```text
DATABASE_URL
DATABASE_URL_UNPOOLED
POSTGRES_PRISMA_URL
PGHOST
PGHOST_UNPOOLED
PGUSER
PGPASSWORD
PGDATABASE
POSTGRES_URL
POSTGRES_URL_NON_POOLING
POSTGRES_PRISMA_URL
```

### 3. Add Application Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<generate-random-secret>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your-sendgrid-key>
HUBSPOT_CLIENT_ID=...
HUBSPOT_CLIENT_SECRET=...
HUBSPOT_REDIRECT_URI=...
```

### 4. Configure GitHub Actions Secrets

Repository secrets required by the deployment workflow:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
DATABASE_URL
DATABASE_URL_UNPOOLED
```

Optional:

```text
WORKER_RESTART_URL
```

### 5. Deploy

```bash
git push origin main
```

Vercel auto-deploys. Check dashboard for status.

### 6. Run Migrations

The GitHub Actions production job already runs migrations automatically:

```bash
npx prisma migrate deploy
```

If you need to run them manually against Vercel production envs:

```bash
npx vercel env pull .env.production.vercel --environment=production --yes
DATABASE_URL=$(grep '^POSTGRES_PRISMA_URL=' .env.production.vercel | cut -d'=' -f2- | tr -d '"') \
DATABASE_URL_UNPOOLED=$(grep '^DATABASE_URL_UNPOOLED=' .env.production.vercel | cut -d'=' -f2- | tr -d '"') \
npx prisma migrate deploy
```

## PostgreSQL Setup

### Recommended: Neon via Vercel Marketplace

This project is now wired for Neon Postgres on Vercel. Prisma expects a PostgreSQL datasource with:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}
```

Do not use the previous SQLite-style `file:../dev.db` value in production.

## Background Worker Deployment

### Option 1: Use Vercel Cron Jobs

Create `app/api/cron/worker/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { processSequenceEnrollments, processSyncRuns } from '@/lib/worker';

export async function POST() {
  await Promise.all([
    processSequenceEnrollments(),
    processSyncRuns(),
  ]);
  return NextResponse.json({ success: true });
}
```

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/worker",
    "schedule": "*/1 * * * *"
  }]
}
```

### Option 2: Render.com Background Job

1. Deploy main app to Render
2. Create a new "Background Worker" service
3. Point to `scripts/worker.js`
4. Set same environment variables

### Option 3: Railway + PM2

```bash
railway deploy
railway run pm2 start scripts/worker.js --name autoleads-worker
```

## Stripe Webhook Configuration

1. Go to [stripe.com/webhooks](https://stripe.com/webhooks)
2. Add endpoint: `https://your-domain.vercel.app/api/billing/webhook`
3. Select events: `checkout.session.completed`, `invoice.payment_failed`
4. Copy signing secret → Add to `.env` as `STRIPE_WEBHOOK_SECRET`

## Custom Domain

### In Vercel

1. Dashboard → Project Settings → Domains
2. Add custom domain
3. Update DNS records per Vercel instructions

### SSL Certificate

Vercel auto-provisions free SSL via Let's Encrypt.

## Monitoring & Logging

### Sentry (Error Tracking)

```bash
npm install @sentry/nextjs
```

Add to `next.config.js`:

```javascript
const withSentry = require('@sentry/nextjs').withSentry;
module.exports = withSentry(
  { swcMinify: true },
  { org: 'your-org', project: 'autoleads', authToken: process.env.SENTRY_AUTH_TOKEN }
);
```

### LogRocket (User Session Replay)

```bash
npm install logrocket
```

Initialize in `app/layout.tsx`:

```typescript
if (typeof window !== 'undefined') {
  import('logrocket').then(LogRocket => {
    LogRocket.init('app/key');
  });
}
```

## Database Backups

### Vercel + Supabase

Supabase auto-backups daily. Download from Dashboard → Backups.

### AWS RDS

Enable automated backups (retention: 7-30 days) in RDS console.

## Scaling Considerations

### 1. Horizontal Scaling (multiple workers)

Use job queue library:

```bash
npm install bull
```

Replace direct processing with Bull queues.

### 2. Redis Caching

Cache frequently accessed data:

```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);
```

### 3. Database Indexing

Add indexes to Prisma schema:

```prisma
model Lead {
  @@index([orgId])
  @@index([status])
  @@index([verticalId])
}
```

## Production Checklist

- [ ] PostgreSQL database configured
- [ ] SSL certificate active
- [ ] Database backups enabled
- [ ] Stripe webhooks configured
- [ ] SMTP configured (SendGrid, AWS SES, etc.)
- [ ] Background worker running
- [ ] Error tracking (Sentry) enabled
- [ ] Database migrations applied
- [ ] Environment variables all set
- [ ] Load testing completed (k6, locust)
- [ ] Rate limiting configured on API
- [ ] Monitoring dashboards set up
- [ ] Incident response plan documented

## Troubleshooting

### 500 Errors in Production

```bash
npx vercel inspect <deployment-or-domain> --logs
```

Check error logs for details.

### Worker Not Running

For Vercel Cron:
- Check `/api/cron/worker` returns 200
- Verify cron job scheduled in `vercel.json`

For Railway/Render:
- SSH into worker instance
- Check logs: `pm2 logs`

### Database Connection Issues

Test connection:

```bash
psql "$DATABASE_URL_UNPOOLED"
```

If Prisma migrations fail in CI with a missing `DATABASE_URL_UNPOOLED`, make sure both `DATABASE_URL` and `DATABASE_URL_UNPOOLED` are present in GitHub repository secrets.

### High Latency

- Enable Query result caching
- Add database indexes
- Use CDN for static assets (automatic on Vercel)

---

**Ready for production!**
