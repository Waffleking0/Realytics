import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

const PRICE_IDS: Record<'ANALYST' | 'PRO', string | undefined> = {
  ANALYST: process.env.STRIPE_ANALYST_PRICE_ID,
  PRO: process.env.STRIPE_PRO_PRICE_ID,
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'You must be signed in to upgrade.' }, { status: 401 });
  }

  const { tier } = (await request.json()) as { tier: 'ANALYST' | 'PRO' };
  if (tier !== 'ANALYST' && tier !== 'PRO') {
    return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
  }

  const priceId = PRICE_IDS[tier];
  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price ID for ${tier} is not configured. Add STRIPE_${tier}_PRICE_ID to your .env.` },
      { status: 500 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true, stripeCustomerId: true, stripeSubscriptionId: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  // If already subscribed, tell the frontend to open the portal instead
  if (user.stripeSubscriptionId) {
    return NextResponse.json({ redirect: 'portal' });
  }

  const stripe = getStripe();

  // Create a Stripe customer on first checkout
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { tier, userId: user.id },
    subscription_data: { metadata: { tier, userId: user.id } },
    success_url: `${baseUrl}/dashboard?upgraded=true`,
    cancel_url: `${baseUrl}/pricing`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
