import React from 'react';
import clsx from 'clsx';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  noPadding?: boolean;
  glass?: boolean;
  accent?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'none';
}

const accentBorderClasses: Record<string, string> = {
  blue: 'border-t-2 border-t-blue-500',
  green: 'border-t-2 border-t-green-500',
  yellow: 'border-t-2 border-t-yellow-500',
  red: 'border-t-2 border-t-red-500',
  purple: 'border-t-2 border-t-purple-500',
  none: '',
};

export default function Card({
  title,
  subtitle,
  children,
  className,
  headerAction,
  noPadding = false,
  glass = false,
  accent = 'none',
}: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-gray-700/50',
        glass
          ? 'bg-gray-900/70 backdrop-blur-md'
          : 'bg-gray-900',
        accentBorderClasses[accent],
        className
      )}
    >
      {(title || subtitle || headerAction) && (
        <div
          className={clsx(
            'flex items-start justify-between',
            noPadding ? 'px-5 pt-5' : 'px-5 pt-5',
            children ? 'pb-4 border-b border-gray-800/60' : 'pb-4'
          )}
        >
          <div>
            {title && (
              <h3 className="text-base font-semibold text-white">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && (
            <div className="flex-shrink-0">{headerAction}</div>
          )}
        </div>
      )}
      <div className={clsx(!noPadding && 'p-5')}>{children}</div>
    </div>
  );
}
