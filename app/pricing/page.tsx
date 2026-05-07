'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, Building2, Zap, Lock, Loader2 } from 'lucide-react';

interface UserInfo {
  tier: string;
  hasSubscription: boolean;
}

const plans = [
  {
    id: 'FREE' as const,
    name: 'Free',
    price: 0,
    description: 'Get started with basic deal screening',
    highlight: false,
    analyses: '5 / month',
    savedDeals: 'None',
    features: [
      'Buy / Hold / Pass recommendation',
      'Confidence score',
      '5 property types supported',
      'No credit card required',
    ],
    locked: [
      'Financial metrics (CF, ROI, cap rate, IRR)',
      '10-year cash flow projections',
      'Market risk analysis',
      'Comparable properties',
      'AI investment report',
    ],
  },
  {
    id: 'ANALYST' as const,
    name: 'Analyst',
    price: 29,
    description: 'Full financial analysis for active investors',
    highlight: true,
    analyses: '50 / month',
    savedDeals: '15 deals',
    features: [
      'Everything in Free',
      'All financial metrics (CF, ROI, cap rate, IRR)',
      '10-year cash flow projections',
      'Deal score (0–100)',
      'Market risk analysis',
      'Comparable properties (curated)',
      'Save up to 15 deals',
    ],
    locked: [
      'AI investment report & reasoning',
      'Real sold comps via live data',
      'Property tax records',
    ],
  },
  {
    id: 'PRO' as const,
    name: 'Pro',
    price: 79,
    description: 'Real data + AI for serious deal makers',
    highlight: false,
    analyses: 'Unlimited',
    savedDeals: 'Unlimited',
    features: [
      'Everything in Analyst',
      'AI investment report with full reasoning',
      'Real sold comparable properties',
      'Live property tax data',
      'Unlimited analyses',
      'Unlimited saved deals',
      'Scenario lab',
    ],
    locked: [],
  },
];

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/me')
        .then((r) => r.json())
        .then((d) => setUserInfo({ tier: d.tier, hasSubscription: d.hasSubscription }))
        .catch(() => null);
    }
  }, [status]);

  async function handleCheckout(planId: 'ANALYST' | 'PRO') {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/pricing`);
      return;
    }

    setLoadingPlan(planId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: planId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      // Already subscribed — redirect to portal to manage
      if (data.redirect === 'portal') {
        await handlePortal();
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handlePortal() {
    setLoadingPlan('portal');
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoadingPlan(null);
    }
  }

  const currentTier = userInfo?.tier ?? null;

  function getPlanButton(plan: typeof plans[number]) {
    if (plan.id === 'FREE') {
      if (currentTier) {
        return (
          <Link
            href="/analyze"
            className="block text-center py-3 px-6 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl transition-colors text-sm"
          >
            Go to Analyzer
          </Link>
        );
      }
      return (
        <Link
          href="/auth/signup"
          className="block text-center py-3 px-6 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl transition-colors text-sm"
        >
          Start Free
        </Link>
      );
    }

    const isCurrentPlan = currentTier === plan.id;
    const isLoading = loadingPlan === plan.id;

    if (isCurrentPlan) {
      return (
        <button
          onClick={handlePortal}
          disabled={loadingPlan !== null}
          className="w-full py-3 px-6 border border-gray-300 text-gray-600 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:border-gray-400 transition-colors disabled:opacity-60"
        >
          {loadingPlan === 'portal' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Manage Plan
        </button>
      );
    }

    return (
      <button
        onClick={() => handleCheckout(plan.id as 'ANALYST' | 'PRO')}
        disabled={loadingPlan !== null}
        className={
          plan.highlight
            ? 'w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60'
            : 'w-full py-3 px-6 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60'
        }
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {status === 'loading' ? 'Loading...' : `Get ${plan.name}`}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Realytics</span>
          </Link>
          <div className="flex items-center gap-3">
            {session ? (
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
            ) : (
              <Link href="/auth/signin" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Sign in
              </Link>
            )}
            <Link
              href="/analyze"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Try Free
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-medium text-blue-700 mb-5">
            <Zap className="w-3.5 h-3.5" />
            Institutional-grade analysis, accessible pricing
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Start free and analyze your first deal in seconds. Upgrade when you need real data, deeper analysis, or more capacity.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlight
                  ? 'relative rounded-2xl border-2 border-blue-500 bg-white shadow-xl shadow-blue-500/10 p-8 flex flex-col'
                  : 'relative rounded-2xl border border-gray-200 bg-white p-8 flex flex-col'
              }
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current plan badge */}
              {currentTier === plan.id && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full">
                    Current plan
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  {plan.price > 0 && <span className="text-gray-400 text-sm">/month</span>}
                </div>
              </div>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex justify-between text-gray-600 border-b border-gray-100 pb-2">
                  <span>Analyses</span>
                  <span className="font-medium text-gray-900">{plan.analyses}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Saved Deals</span>
                  <span className="font-medium text-gray-900">{plan.savedDeals}</span>
                </div>
              </div>

              <ul className="space-y-2.5 mb-4 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.locked.length > 0 && (
                <ul className="space-y-2 mb-6">
                  {plan.locked.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-400">
                      <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto">{getPlanButton(plan)}</div>
            </div>
          ))}
        </div>

        {/* Manage subscription link for subscribed users */}
        {userInfo?.hasSubscription && (
          <p className="text-center text-sm text-gray-500 mb-12">
            Need to cancel or change your plan?{' '}
            <button
              onClick={handlePortal}
              disabled={loadingPlan !== null}
              className="text-blue-600 hover:underline font-medium disabled:opacity-50"
            >
              {loadingPlan === 'portal' ? 'Opening portal…' : 'Manage billing'}
            </button>
          </p>
        )}

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8">Common questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Where does the comparable property data come from?',
                a: 'Pro plan subscribers get real sold comparables and property tax records pulled live from Rentcast, a national real estate data provider covering millions of U.S. properties. Free and Analyst plans use curated benchmark data.',
              },
              {
                q: 'Is my payment secure?',
                a: 'Yes. All payments are processed by Stripe, a PCI-DSS Level 1 certified payment processor. Realytics never stores your credit card details.',
              },
              {
                q: 'Can I cancel at any time?',
                a: 'Yes. Click "Manage billing" above (or the Manage Plan button on your plan card) to cancel, switch plans, or update your payment method. Your plan stays active until the end of the billing period.',
              },
              {
                q: 'What happens when I hit my monthly analysis limit?',
                a: "You'll see a prompt to upgrade. Your existing saved deals are never affected. Your limit resets on the 1st of each month.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-gray-100 pb-6">
                <p className="font-semibold text-gray-900 text-sm mb-2">{q}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
