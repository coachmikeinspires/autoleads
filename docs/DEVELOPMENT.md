# AutoLeads Development Guide

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Client (React/Next.js)          │
│  - Dashboard pages (dark mode support)  │
│  - Real-time stats via SWR              │
│  - Form handling with React Hook Form   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         API Routes (Next.js)            │
│  - /api/verticals (CRUD)                │
│  - /api/leads (CRUD)                    │
│  - /api/sequences (CRUD)                │
│  - /api/billing (Stripe checkout)       │
│  - /api/stats (analytics)               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Prisma ORM + Database              │
│  - SQLite (dev) / PostgreSQL (prod)     │
│  - Session storage (NextAuth)           │
└─────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     Background Worker (Node.js)         │
│  - Process email sequences              │
│  - Handle sync runs                     │
│  - Rate limiting & retry logic          │
└─────────────────────────────────────────┘
```

## Key Concepts

### Multi-Tenancy

All data is scoped to `org`. User's `orgId` is stored in the session:

```typescript
const session = await getAuthSession();
const orgId = session.user.orgId; // All queries filtered by this
```

### Email Sequences

1. Create a sequence with multiple steps
2. Add leads as enrollments
3. Worker sends emails on delay schedule
4. Track opens/clicks in `EmailSend` records

### Sync Runs

1. User initiates a sync for a vertical
2. Worker processes sync (fetches from lead source API)
3. Creates lead records in database
4. Updates sync run status

## Common Tasks

### Adding a New Entity

1. **Define schema** in `prisma/schema.prisma`:

```prisma
model MyEntity {
  id        String   @id @default(uuid())
  org       Org      @relation(fields: [orgId], references: [id])
  orgId     String   @map("org_id")
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  
  @@index([orgId])
}
```

2. **Create migration**:

```bash
npx prisma migrate dev --name add_my_entity
```

3. **Create API routes**:

- `app/api/my_entities/route.ts` (GET/POST)
- `app/api/my_entities/[id]/route.ts` (GET/PUT/DELETE)

4. **Create UI page**:

```bash
mkdir -p app/dashboard/my_entities
# Create page.tsx and [id]/page.tsx
```

### Integrating a New CRM

1. **Create provider file** `app/api/crm_connections/providers/salesforce.ts`:

```typescript
export async function exchangeCodeForToken(code: string) {
  // Call Salesforce OAuth endpoint
  // Return { accessToken, refreshToken, expiresAt }
}

export async function syncLeads(accessToken: string, orgId: string) {
  // Call Salesforce API to fetch leads
  // Create Lead records in database
}
```

2. **Register provider** in `app/api/crm_connections/callback/route.ts`

3. **Add OAuth flow** to CRM dashboard page

### Adding Real-Time Notifications

Install Pusher or Socket.io:

```bash
npm install pusher
```

Emit events on lead creation:

```typescript
const pusher = new Pusher({ appId, key, secret });
pusher.trigger(`org-${orgId}`, 'new-lead', { leadId });
```

Listen in client:

```typescript
const channel = pusher.subscribe(`org-${orgId}`);
channel.bind('new-lead', (data) => {
  setLeads([...leads, data]);
});
```

## Performance Tips

### Database

- Use indexes on frequently filtered columns
- Denormalize counts in parent tables
- Batch inserts in worker

### API

- Cache sequence/vertical lists (Redis)
- Use SWR with stale-while-revalidate
- Paginate lead lists

### Worker

- Process in batches (50 at a time)
- Exponential backoff on failures
- Use connection pooling

## Testing

### Unit Tests

```typescript
// __tests__/api/leads.test.ts
import { POST as createLead } from '@/app/api/leads/route';

describe('POST /api/leads', () => {
  it('creates a lead', async () => {
    const req = new Request(...);
    const res = await createLead(req);
    expect(res.status).toBe(201);
  });
});
```

Run: `npm run test`

### E2E Tests

```typescript
// e2e/leads.spec.ts
import { test, expect } from '@playwright/test';

test('can create a lead', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard/leads');
  await page.fill('input[placeholder="Name"]', 'John Doe');
  await page.click('button:has-text("Create")');
  await expect(page).toContainText('John Doe');
});
```

Run: `npm run test:e2e`

## Debugging

### Enable Prisma Logging

```env
# .env
DEBUG=prisma:*
```

### Inspect Database

```bash
npx prisma studio
# Opens browser at http://localhost:5555
```

### Worker Logs

```bash
node scripts/worker.js 2>&1 | tee worker.log
```

### NextAuth Debug

```typescript
// lib/auth.ts
export const authOptions = {
  ...
  debug: process.env.NODE_ENV === 'development',
};
```

## Best Practices

1. **Always check orgId**: All queries should filter by user's orgId
2. **Handle errors gracefully**: Try-catch all async operations
3. **Validate input**: Use Zod for type safety
4. **Log important events**: Track lead creation, email sends, etc.
5. **Paginate large queries**: Don't fetch all leads at once
6. **Use indexes**: Add @@index to frequently queried fields

## Useful Commands

```bash
# Database
npx prisma migrate dev --name description   # Create migration
npx prisma migrate reset                    # Clear DB and reseed
npx prisma studio                           # GUI for database

# Development
npm run dev                                 # Start dev server
npm run build                               # Build for production
npm run lint                                # Run ESLint
npm run type-check                          # Run TypeScript check

# Worker
node scripts/worker.js                      # Run background worker
pm2 start scripts/worker.js                 # Run with PM2

# Testing
npm run test                                # Unit tests
npm run test:watch                          # Watch mode
npm run test:e2e                            # E2E tests
```

---

**Happy coding! 🚀**
