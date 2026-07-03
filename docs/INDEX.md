# Documentation Index

Complete guide to AutoLeads documentation. Start here!

## Quick Start
👉 **New to AutoLeads?** Start with [README.md](../README.md)

## Setup & Development

1. **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Architecture overview, common tasks, debugging
2. **[TESTING.md](./TESTING.md)** - Unit, integration, and E2E testing setup
3. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

## API & Technical

1. **[API_REFERENCE.md](./API_REFERENCE.md)** - Complete endpoint documentation
2. **[IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)** - Feature completion status

## Integration Guides

1. **[STRIPE_INTEGRATION.md](./STRIPE_INTEGRATION.md)** - Payment processing setup
2. **[HUBSPOT_INTEGRATION.md](./HUBSPOT_INTEGRATION.md)** - CRM OAuth and lead sync

## Deployment

1. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment to Vercel, Railway, etc.

---

## Quick Links

### By Role

**Developers**
- Setup: [DEVELOPMENT.md](./DEVELOPMENT.md)
- Reference: [API_REFERENCE.md](./API_REFERENCE.md)
- Troubleshoot: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

**DevOps / Deployment**
- Setup: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Checklist: [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)

**Feature Development**
- Status: [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)
- Stripe: [STRIPE_INTEGRATION.md](./STRIPE_INTEGRATION.md)
- HubSpot: [HUBSPOT_INTEGRATION.md](./HUBSPOT_INTEGRATION.md)

---

## Project Structure

```
autoleads/
├── docs/                    # You are here!
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   ├── HUBSPOT_INTEGRATION.md
│   ├── IMPLEMENTATION_STATUS.md
│   ├── STRIPE_INTEGRATION.md
│   ├── TESTING.md
│   ├── TROUBLESHOOTING.md
│   └── INDEX.md (this file)
├── app/                     # Next.js app (pages, API routes)
├── components/              # React components
├── lib/                     # Utilities and helpers
├── prisma/                  # Database schema and migrations
├── scripts/                 # Background worker and utilities
├── .github/workflows/       # CI/CD pipeline
├── public/                  # Static assets
├── README.md               # Project overview
└── setup.sh                # Quick setup script
```

---

## Common Tasks

### I want to...

**...run the app locally**
```bash
./setup.sh
npm run dev
node scripts/worker.js  # In another terminal
```

**...add a new feature**
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name feature_name`
3. Create API route in `app/api/`
4. Create UI page in `app/dashboard/`

**...test the app**
```bash
npm run test              # Unit tests
npm run test:e2e         # E2E tests
npm run test:all         # Both
```

**...deploy to production**
1. Push to `main` branch
2. GitHub Actions runs CI/CD
3. Vercel deploys automatically
4. Database migrations run
5. Worker restarts

**...connect HubSpot**
1. See [HUBSPOT_INTEGRATION.md](./HUBSPOT_INTEGRATION.md)
2. Get OAuth credentials
3. Update `.env`
4. Test connection in `/dashboard/crm`

**...setup Stripe billing**
1. See [STRIPE_INTEGRATION.md](./STRIPE_INTEGRATION.md)
2. Create products and price IDs
3. Add webhook endpoint
4. Update `.env`

**...debug an issue**
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Run `npm run dev` to see errors
3. Use `npx prisma studio` to inspect database
4. Check logs in deployment platform

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Next.js 14, TypeScript, Tailwind CSS |
| Backend | Node.js, Next.js API Routes |
| Database | SQLite (dev), PostgreSQL (prod) |
| ORM | Prisma 7 |
| Auth | NextAuth.js 4 |
| Payment | Stripe |
| Email | nodemailer |
| Testing | Vitest, Playwright |
| Deployment | Vercel, Railway, Docker |

---

## Key Features

✅ Lead management (CRUD)
✅ Email sequences (multi-step campaigns)
✅ CRM integrations (HubSpot, Salesforce)
✅ Subscription billing (Stripe)
✅ User authentication (NextAuth)
✅ Background worker (sequence processing, sync)
✅ Analytics dashboard (stats, recent activity)
✅ White-label support (multi-tenant scaffold)

---

## Support & Resources

- **GitHub**: [Issues & Discussions](https://github.com/)
- **Discord**: [Community Chat](https://discord.gg/)
- **Docs**: This folder
- **API**: [API_REFERENCE.md](./API_REFERENCE.md)

---

## Contributing

1. Create a branch: `git checkout -b feature/your-feature`
2. Make changes and test: `npm run test`
3. Push: `git push origin feature/your-feature`
4. Create PR with description

---

**Last Updated**: 2024
**Version**: 1.0.0

---

**Ready to get started? Run `./setup.sh` now!** 🚀
