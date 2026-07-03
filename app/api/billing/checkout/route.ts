import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2026-06-24.dahlia' });

  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();

  // Create a checkout session (stub: price ID expected in body.priceId)
  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: body.priceId, quantity: 1 }],
    metadata: { orgId: session.user.orgId },
    success_url: body.successUrl || 'https://example.com/success',
    cancel_url: body.cancelUrl || 'https://example.com/cancel',
  });

  return NextResponse.json({ url: checkout.url });
}
