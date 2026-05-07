'use client';

import React, { useState } from 'react';

interface DownPaymentInputProps {
  purchasePrice: number;
  value: number; // always stored in dollars
  onChange: (dollars: number) => void;
  error?: string;
  required?: boolean;
}

export default function DownPaymentInput({
  purchasePrice,
  value,
  onChange,
  error,
  required,
}: DownPaymentInputProps) {
  const [mode, setMode] = useState<'$' | '%'>('$');

  const displayValue =
    mode === '$'
      ? value || ''
      : purchasePrice > 0 && value > 0
      ? parseFloat(((value / purchasePrice) * 100).toFixed(4))
      : '';

  const handleChange = (raw: string) => {
    const num = parseFloat(raw) || 0;
    if (mode === '$') {
      onChange(num);
    } else {
      onChange(purchasePrice > 0 ? (num / 100) * purchasePrice : 0);
    }
  };

  const loanAmount = Math.max(0, purchasePrice - value);
  const pct = purchasePrice > 0 && value > 0 ? ((value / purchasePrice) * 100).toFixed(1) : null;

  const hint =
    mode === '$' && pct
      ? `${pct}% down · Loan: $${loanAmount.toLocaleString()}`
      : mode === '%' && value > 0
      ? `$${Math.round(value).toLocaleString()} · Loan: $${loanAmount.toLocaleString()}`
      : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-600">
          Down Payment{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden text-xs font-semibold">
          {(['$', '%'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 transition-colors ${
                mode === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {mode === '$' && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none select-none">
            $
          </span>
        )}
        <input
          type="number"
          required={required}
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={mode === '$' ? '70,000' : '20'}
          min="0"
          max={mode === '%' ? '100' : undefined}
          step={mode === '%' ? '0.5' : undefined}
          className={`w-full rounded-xl text-gray-900 text-sm py-2.5 bg-gray-100 border outline-none transition-all focus:ring-2 focus:ring-blue-500/15 ${
            mode === '$' ? 'pl-7 pr-3' : 'pl-3 pr-7'
          } ${
            error
              ? 'border-red-400 focus:border-red-400'
              : 'border-gray-300 focus:border-blue-500'
          }`}
        />
        {mode === '%' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none select-none">
            %
          </span>
        )}
      </div>

      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
