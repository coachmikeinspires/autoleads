import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-08-01' });

export async function POST(request: Request) {
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
