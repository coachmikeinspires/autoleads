# Testing Guide

## Setup

### Install Testing Tools

```bash
npm install -D vitest @vitest/ui jest-mock-extended
npm install -D @playwright/test
npm install -D supertest
```

### Configure Vitest

**File**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### Test Setup

**File**: `test/setup.ts`

```typescript
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signOut: vi.fn(),
}));
```

---

## Unit Tests

### Auth Tests

**File**: `test/lib/auth.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import * as bcrypt from 'bcryptjs';

describe('Password hashing', () => {
  it('should hash password correctly', async () => {
    const password = 'test123';
    const hash = bcrypt.hashSync(password, 10);
    expect(bcrypt.compareSync(password, hash)).toBe(true);
  });

  it('should not match incorrect password', () => {
    const password = 'test123';
    const hash = bcrypt.hashSync(password, 10);
    expect(bcrypt.compareSync('wrong', hash)).toBe(false);
  });
});
```

### API Route Tests

**File**: `test/api/leads.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/leads/route';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    lead: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock NextAuth
vi.mock('@/lib/auth', () => ({
  getAuthSession: vi.fn(),
}));

describe('GET /api/leads', () => {
  it('should return 401 if not authenticated', async () => {
    const { getAuthSession } = await import('@/lib/auth');
    vi.mocked(getAuthSession).mockResolvedValueOnce(null);

    const req = new Request('http://localhost/api/leads');
    const res = await GET(req);
    
    expect(res.status).toBe(401);
  });

  it('should return leads for authenticated user', async () => {
    const { getAuthSession } = await import('@/lib/auth');
    const { prisma } = await import('@/lib/prisma');

    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { orgId: 'org-123', id: 'user-123' },
    } as any);

    const leads = [
      { id: '1', email: 'test@example.com', firstName: 'John' },
    ];
    vi.mocked(prisma.lead.findMany).mockResolvedValueOnce(leads as any);

    const req = new Request('http://localhost/api/leads');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(leads);
  });
});

describe('POST /api/leads', () => {
  it('should create a lead', async () => {
    const { getAuthSession } = await import('@/lib/auth');
    const { prisma } = await import('@/lib/prisma');

    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { orgId: 'org-123', id: 'user-123' },
    } as any);

    const newLead = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    };

    vi.mocked(prisma.lead.create).mockResolvedValueOnce({
      id: 'lead-123',
      ...newLead,
      orgId: 'org-123',
    } as any);

    const req = new Request('http://localhost/api/leads', {
      method: 'POST',
      body: JSON.stringify(newLead),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.id).toBe('lead-123');
  });
});
```

---

## Integration Tests

### Database Tests

**File**: `test/integration/db.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Database Integration', () => {
  let orgId: string;

  beforeAll(async () => {
    // Create test org
    const org = await prisma.org.create({
      data: {
        name: 'Test Org',
        plan: 'starter',
        planStatus: 'active',
      },
    });
    orgId = org.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.org.deleteMany({ where: { id: orgId } });
  });

  it('should create and retrieve a lead', async () => {
    const lead = await prisma.lead.create({
      data: {
        orgId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'new',
      },
    });

    const retrieved = await prisma.lead.findUnique({ where: { id: lead.id } });
    expect(retrieved?.email).toBe('john@example.com');
  });

  it('should create a sequence with steps', async () => {
    const sequence = await prisma.emailSequence.create({
      data: {
        orgId,
        name: 'Welcome Series',
        status: 'draft',
      },
    });

    const step = await prisma.sequenceStep.create({
      data: {
        sequenceId: sequence.id,
        stepNumber: 1,
        subject: 'Welcome',
        body: 'Welcome to our platform',
        delayDays: 0,
      },
    });

    const retrieved = await prisma.sequenceStep.findUnique({
      where: { id: step.id },
    });
    expect(retrieved?.stepNumber).toBe(1);
  });
});
```

---

## E2E Tests

### Playwright Tests

**File**: `e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should sign in with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signin');

    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('http://localhost:3000/dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signin');

    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
```

**File**: `e2e/leads.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Leads', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in
    await page.goto('http://localhost:3000/auth/signin');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/dashboard');
  });

  test('should create a new lead', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/leads');

    await page.fill('input[placeholder="First Name"]', 'John');
    await page.fill('input[placeholder="Last Name"]', 'Doe');
    await page.fill('input[type="email"]', 'john@example.com');
    await page.click('button:has-text("Create Lead")');

    await expect(page.locator('text=john@example.com')).toBeVisible();
  });

  test('should list leads', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/leads');

    const leadsList = page.locator('table tbody tr');
    const count = await leadsList.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
```

**File**: `e2e/sequences.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Email Sequences', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signin');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/dashboard');
  });

  test('should create and manage a sequence', async ({ page }) => {
    // Create sequence
    await page.goto('http://localhost:3000/dashboard/sequences');
    await page.fill('input[placeholder="Sequence Name"]', 'Summer Campaign');
    await page.click('button:has-text("Create Sequence")');
    await expect(page.locator('text=Summer Campaign')).toBeVisible();

    // Add step
    await page.click('a:has-text("Summer Campaign")');
    await page.fill('input[placeholder="Subject"]', 'Special Offer');
    await page.fill('textarea[placeholder="Body"]', 'Limited time offer...');
    await page.fill('input[type="number"]', '2');
    await page.click('button:has-text("Add Step")');

    await expect(page.locator('text=Special Offer')).toBeVisible();
  });
});
```

---

## Running Tests

### Unit & Integration

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# With coverage
npm run test -- --coverage
```

### E2E

```bash
# Run Playwright tests
npm run test:e2e

# Debug mode
npx playwright test --debug

# UI mode (interactive)
npx playwright test --ui
```

---

## Coverage Goals

- **Auth**: 90%+ (critical)
- **API Routes**: 80%+ (important)
- **UI Components**: 70%+ (nice to have)
- **Overall**: 75%+

---

## Continuous Testing

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:debug": "playwright test --debug",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

---

**Happy testing! 🧪**
