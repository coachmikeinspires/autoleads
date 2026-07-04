# AutoLeads

AutoLeads is a B2B SaaS lead generation and outreach dashboard built with Next.js, NextAuth, Prisma, and Vercel. It includes lead management, email sequence workflows, sync runs, CRM connection surfaces, billing hooks, and a production deployment path backed by Neon Postgres.

## Local Development

Install dependencies and start the app:

```bash
npm install
PORT=3001 npm run dev
```

The local sign-in page is available at `http://localhost:3001/auth/signin`.

Default seeded credentials:

```text
Email: admin@example.com
Password: password123
```

## Core Scripts

```bash
npm run dev
npm run build
npm run lint
npm run type-check
npm run test -- --coverage
```

`npm run build` regenerates Prisma before compiling so deploys do not ship a stale client.

## Production Stack

- Frontend/runtime: Next.js on Vercel
- Auth: NextAuth credentials provider with JWT sessions
- Database: Neon Postgres connected through the Vercel Marketplace integration
- ORM: Prisma
- CI/CD: GitHub Actions in `.github/workflows/ci-cd.yml`

## Required Production Environment Variables

Vercel-managed Neon variables:

```text
DATABASE_URL
DATABASE_URL_UNPOOLED
POSTGRES_PRISMA_URL
PGHOST
PGHOST_UNPOOLED
PGUSER
PGPASSWORD
PGDATABASE
```

Application variables:

```text
NEXTAUTH_URL
NEXTAUTH_SECRET
```

Optional integrations:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
HUBSPOT_CLIENT_ID
HUBSPOT_CLIENT_SECRET
HUBSPOT_REDIRECT_URI
WORKER_RESTART_URL
```

## Deployment Notes

- Production deploys are handled by GitHub Actions and Vercel.
- Post-deploy migrations run in CI against the GitHub secrets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
- Manual Vercel deploys ignore local env and SQLite artifacts via `.vercelignore`.

## References

- Deployment details: `docs/DEPLOYMENT.md`
- API surface: `docs/API_REFERENCE.md`
- Testing notes: `docs/TESTING.md`
