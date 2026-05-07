'use client';

import { Lock } from 'lucide-react';
import Link from 'next/link';
import { TIERS, TIER_ORDER, type UserTier, type TierFeatures } from '@/lib/tier';

interface LockedFeatureProps {
  feature: keyof TierFeatures;
  userTier: UserTier;
  children: React.ReactNode;
  minHeight?: string;
}

export default function LockedFeature({
  feature,
  userTier,
  children,
  minHeight = '120px',
}: LockedFeatureProps) {
  const unlocked = TIERS[userTier].features[feature];
  if (unlocked) return <>{children}</>;

  const requiredTier = TIER_ORDER.find((t) => TIERS[t].features[feature]) ?? 'PRO';
  const cfg = TIERS[requiredTier];

  return (
    <div className="relative" style={{ minHeight }}>
      <div
        className="pointer-events-none select-none"
        style={{ filter: 'blur(4px)', opacity: 0.45 }}
        aria-hidden="true"
      >
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-md text-center max-w-xs">
          <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {cfg.name} Plan Feature
          </p>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Upgrade to <span className="font-medium text-blue-600">{cfg.name}</span> for{' '}
            <span className="font-medium">${cfg.price}/month</span> to unlock this section.
          </p>
          <Link
            href="/pricing"
            className="inline-block px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            See Plans
          </Link>
        </div>
      </div>
    </div>
  );
}
