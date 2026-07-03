# Stripe Integration Guide

## Setup

### 1. Create Stripe Account

Go to [stripe.com](https://stripe.com) and create an account.

### 2. Get API Keys

Dashboard → Developers → API Keys

- **Secret Key** (sk_test_...) → STRIPE_SECRET_KEY
- **Publishable Key** (pk_test_...) → STRIPE_PUBLISHABLE_KEY

### 3. Create Products & Prices

Dashboard → Products → Add Product

**Example:**
- Starter: $99/month (price_xxxxx)
- Growth: $299/month (price_yyyyy)
- Pro: $999/month (price_zzzzz)

Copy price IDs to .env:

```env
STRIPE_STARTER_PRICE_ID=price_xxxxx
STRIPE_GROWTH_PRICE_ID=price_yyyyy
STRIPE_PRO_PRICE_ID=price_zzzzz
```

### 4. Webhook Setup

Dashboard → Developers → Webhooks

Add endpoint:

```
Endpoint URL: https://your-domain.com/api/billing/webhook
Events: checkout.session.completed, invoice.payment_failed, customer.subscription.updated
```

Copy signing secret → STRIPE_WEBHOOK_SECRET

### 5. Test Mode

Use Stripe test card: `4242 4242 4242 4242`

---

## Implementation

### Create Checkout Session

**File**: `app/api/billing/checkout/route.ts`

```typescript
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId } = await request.json();
  const priceMap: Record<string, string> = {
    starter: process.env.STRIPE_STARTER_PRICE_ID!,
    growth: process.env.STRIPE_GROWTH_PRICE_ID!,
    pro: process.env.STRIPE_PRO_PRICE_ID!,
  };

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{
      price: priceMap[planId],
      quantity: 1,
    }],
    success_url: 'https://your-domain.com/dashboard/billing?success=true',
    cancel_url: 'https://your-domain.com/dashboard/billing',
    metadata: { orgId: session.user.orgId },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
```

### Handle Webhooks

**File**: `app/api/billing/webhook/route.ts`

```typescript
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const orgId = event.data.object.metadata?.orgId as string;

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      await prisma.org.update({
        where: { id: orgId },
        data: {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          planStatus: 'active',
        },
      });
      break;

    case 'customer.subscription.updated':
      const sub = event.data.object as Stripe.Subscription;
      const plan = sub.items.data[0].price.id === process.env.STRIPE_STARTER_PRICE_ID ? 'starter'
                 : sub.items.data[0].price.id === process.env.STRIPE_GROWTH_PRICE_ID ? 'growth'
                 : 'pro';
      
      await prisma.org.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          plan: plan as any,
          planStatus: sub.status === 'active' ? 'active' : sub.status as any,
        },
      });
      break;

    case 'invoice.payment_failed':
      const invoice = event.data.object as Stripe.Invoice;
      await prisma.org.updateMany({
        where: { stripeCustomerId: invoice.customer as string },
        data: { planStatus: 'past_due' },
      });
      break;
  }

  return NextResponse.json({ received: true });
}
```

### Plan-Based Feature Gates

**File**: `lib/plans.ts`

```typescript
export const PLAN_LIMITS = {
  starter: { maxLeads: 1000, maxSequences: 5, maxEnrollments: 10000 },
  growth: { maxLeads: 10000, maxSequences: 20, maxEnrollments: 100000 },
  pro: { maxLeads: Infinity, maxSequences: Infinity, maxEnrollments: Infinity },
};

export async function checkPlanLimit(orgId: string, feature: keyof typeof PLAN_LIMITS['starter']): Promise<boolean> {
  const org = await prisma.org.findUnique({ where: { id: orgId } });
  if (!org) return false;

  const limits = PLAN_LIMITS[org.plan as keyof typeof PLAN_LIMITS];
  const currentCount = feature === 'maxLeads' ? await prisma.lead.count({ where: { orgId } })
                     : feature === 'maxSequences' ? await prisma.emailSequence.count({ where: { orgId } })
                     : await prisma.sequenceEnrollment.count({ where: { lead: { orgId } } });

  return currentCount < limits[feature];
}
```

### Update Billing Page

**File**: `app/dashboard/billing/page.tsx`

```typescript
"use client";
import { useEffect, useState } from 'react';

export default function BillingPage() {
  const [org, setOrg] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => setOrg(d.session?.user?.org));
  }, []);

  async function checkout(plan: string) {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ planId: plan }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  async function openPortal() {
    const res = await fetch('/api/billing/portal', { method: 'POST' });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div>
      <h1>Billing</h1>
      {org?.stripeSubscriptionId ? (
        <>
          <p>Current plan: <strong>{org.plan}</strong></p>
          <button onClick={openPortal}>Manage Subscription</button>
        </>
      ) : (
        <div>
          {['starter', 'growth', 'pro'].map(plan => (
            <div key={plan}>
              <h3>{plan}</h3>
              <button onClick={() => checkout(plan)}>Upgrade to {plan}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Stripe Portal Endpoint

**File**: `app/api/billing/portal/route.ts`

```typescript
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const org = await prisma.org.findUnique({ where: { id: session.user.orgId } });
  if (!org?.stripeCustomerId) return NextResponse.json({ error: 'No subscription' }, { status: 400 });

  const portal = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: 'https://your-domain.com/dashboard/billing',
  });

  return NextResponse.json({ url: portal.url });
}
```

---

## Testing

### Test Cards

| Card | Description |
|------|-------------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | Requires 3D Secure |

### Webhook Testing

Use Stripe CLI:

```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/api/billing/webhook
```

Then trigger events:

```bash
stripe trigger checkout.session.completed
```

---

## Monitoring

### Stripe Dashboard

- Events: View webhook history and logs
- Reports: Revenue, MRR, churn rate
- Customers: View subscription status per customer

### In Your App

```typescript
// Track failed payments
await prisma.log.create({
  data: {
    orgId,
    event: 'payment_failed',
    details: { invoiceId, amount },
  },
});
```

---

## Production Checklist

- [ ] Use live API keys (not test)
- [ ] Verify webhook endpoint is HTTPS
- [ ] Test subscription update flow
- [ ] Test payment failure handling
- [ ] Configure email receipts in Stripe
- [ ] Set up fraud detection
- [ ] Add monitoring/alerting for failed webhooks
- [ ] Document billing policy and refund process

---

**For more**: [Stripe Next.js docs](https://stripe.com/docs/payments/checkout/how-checkout-works)
