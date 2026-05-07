import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import type { UserTier } from '@/lib/tier';

function priceIdToTier(priceId: string): UserTier {
  if (priceId === process.env.STRIPE_ANALYST_PRICE_ID) return 'ANALYST';
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'PRO';
  return 'FREE';
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret.' }, { status: 400 });
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed.' }, { status: 400 });
  }

  try {
    switch (event.type) {
      // Payment succeeded — subscription is now active
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const tier = (session.metadata?.tier as UserTier) ?? 'ANALYST';

        await prisma.user.update({
          where: { stripeCustomerId: customerId },
          data: { tier, stripeSubscriptionId: subscriptionId },
        });
        break;
      }

      // Plan changed (upgrade / downgrade between Analyst and Pro)
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items.data[0]?.price.id ?? '';
        const tier = priceIdToTier(priceId);

        if (sub.status === 'active' || sub.status === 'trialing') {
          await prisma.user.update({
            where: { stripeCustomerId: customerId },
            data: { tier, stripeSubscriptionId: sub.id },
          });
        }
        break;
      }

      // Subscription cancelled or payment permanently failed after all retries
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        await prisma.user.update({
          where: { stripeCustomerId: customerId },
          data: { tier: 'FREE', stripeSubscriptionId: null },
        });
        break;
      }

      // No action needed — Stripe retries automatically; downgrade only on subscription.deleted
      case 'invoice.payment_failed':
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error [${event.type}]:`, err);
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
