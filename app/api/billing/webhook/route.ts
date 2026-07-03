import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook is not configured' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2026-06-24.dahlia' });

  const sig = request.headers.get('stripe-signature') || '';
  const buf = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle subscription.updated / checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orgId = session.metadata?.orgId;
    if (orgId) {
      const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
      const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null;

      await prisma.org.updateMany({
        where: { id: orgId },
        data: { stripeCustomerId, stripeSubscriptionId, planStatus: 'active' },
      });
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const inv = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
    const subId = typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id ?? null;

    if (subId) {
      await prisma.org.updateMany({ where: { stripeSubscriptionId: subId }, data: { planStatus: 'past_due' } });
    }
  }

  return NextResponse.json({ received: true });
}
