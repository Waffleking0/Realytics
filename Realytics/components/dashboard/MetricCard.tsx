'use client';

import React from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type MetricSentiment = 'positive' | 'neutral' | 'negative';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  sentiment?: MetricSentiment;
  trend?: 'up' | 'down' | 'flat';
  description?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sentimentConfig: Record<MetricSentiment, { bg: string; border: string; text: string; badge: string }> = {
  positive: {
    bg: 'bg-green-500/5',
    border: 'border-green-500/20',
    text: 'text-green-400',
    badge: 'bg-green-500/15 text-green-400',
  },
  neutral: {
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    badge: 'bg-blue-500/15 text-blue-400',
  },
  negative: {
    bg: 'bg-red-500/5',
    border: 'border-red-500/20',
    text: 'text-red-400',
    badge: 'bg-red-500/15 text-red-400',
  },
};

const sizeConfig = {
  sm: { value: 'text-xl', label: 'text-xs', container: 'p-3' },
  md: { value: 'text-2xl', label: 'text-xs', container: 'p-4' },
  lg: { value: 'text-3xl', label: 'text-sm', container: 'p-5' },
};

export default function MetricCard({
  label,
  value,
  subValue,
  sentiment = 'neutral',
  trend,
  description,
  icon,
  size = 'md',
}: MetricCardProps) {
  const config = sentimentConfig[sentiment];
  const sz = sizeConfig[size];

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400';

  return (
    <div
      className={clsx(
        'rounded-xl border transition-all duration-200',
        config.bg,
        config.border,
        sz.container,
        'hover:brightness-110'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className={clsx('font-medium text-gray-600 leading-tight', sz.label)}>
          {label}
        </p>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {trend && (
            <TrendIcon className={clsx('w-3.5 h-3.5 flex-shrink-0', trendColor)} />
          )}
          {icon && (
            <span className={clsx('flex-shrink-0', config.text)}>{icon}</span>
          )}
        </div>
      </div>
      <p className={clsx('font-bold tabular-nums leading-none', config.text, sz.value)}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subValue && (
        <p className="text-xs text-gray-500 mt-1">{subValue}</p>
      )}
      {description && (
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">{description}</p>
      )}
    </div>
  );
}
