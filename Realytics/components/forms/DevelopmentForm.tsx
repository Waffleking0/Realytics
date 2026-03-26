'use client';

import React, { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { DevelopmentInputs } from '@/types';
import { BarChart3 } from 'lucide-react';

interface DevelopmentFormProps {
  onSubmit: (inputs: DevelopmentInputs) => void;
  loading?: boolean;
}

const defaultValues: DevelopmentInputs = {
  location: '',
  zipCode: '',
  landCost: 0,
  constructionCost: 0,
  timelineMonths: 18,
  estimatedValue: 0,
  financingRate: 8.0,
  exitStrategy: 'sale',
  estimatedMonthlyRent: 0,
  contingencyPercent: 10,
};

export default function DevelopmentForm({ onSubmit, loading }: DevelopmentFormProps) {
  const [form, setForm] = useState<DevelopmentInputs>(defaultValues);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const update = (key: keyof DevelopmentInputs, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};
    if (!form.location) newErrors.location = 'Location is required';
    if (form.landCost <= 0) newErrors.landCost = 'Land cost is required';
    if (form.constructionCost <= 0) newErrors.constructionCost = 'Construction cost is required';
    if (form.estimatedValue <= 0) newErrors.estimatedValue = 'Estimated value is required';
    if (form.timelineMonths <= 0) newErrors.timelineMonths = 'Timeline must be > 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const contingencyAmt = form.constructionCost * (form.contingencyPercent / 100);
  const totalDevCost = form.landCost + form.constructionCost + contingencyAmt;
  const financingCost = totalDevCost * (form.financingRate / 100 / 12) * form.timelineMonths;
  const totalProjectCost = totalDevCost + financingCost;
  const developmentSpread =
    totalProjectCost > 0
      ? (((form.estimatedValue - totalProjectCost) / totalProjectCost) * 100).toFixed(1)
      : '-';
  const netProfit = form.estimatedValue - totalProjectCost;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Location */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3 pb-2 border-b border-gray-800">
          Project Location
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Location / Address"
            placeholder="3100 E Cesar Chavez, Austin, TX"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            error={errors.location}
            required
          />
          <Input
            label="ZIP Code"
            placeholder="78702"
            value={form.zipCode}
            onChange={(e) => update('zipCode', e.target.value)}
            maxLength={5}
          />
        </div>
      </div>

      {/* Project Costs */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3 pb-2 border-b border-gray-800">
          Project Costs
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Land / Acquisition Cost"
            type="number"
            prefix="$"
            placeholder="500,000"
            value={form.landCost || ''}
            onChange={(e) => update('landCost', parseFloat(e.target.value) || 0)}
            error={errors.landCost}
            required
          />
          <Input
            label="Construction Cost"
            type="number"
            prefix="$"
            placeholder="1,200,000"
            value={form.constructionCost || ''}
            onChange={(e) => update('constructionCost', parseFloat(e.target.value) || 0)}
            error={errors.constructionCost}
            required
          />
          <Input
            label="Contingency Reserve"
            type="number"
            suffix="%"
            placeholder="10"
            min="0"
            max="30"
            step="1"
            value={form.contingencyPercent || ''}
            onChange={(e) => update('contingencyPercent', parseFloat(e.target.value) || 0)}
            hint={contingencyAmt > 0 ? `$${Math.round(contingencyAmt).toLocaleString()} contingency` : undefined}
          />
          <Input
            label="Construction Financing Rate"
            type="number"
            suffix="%"
            placeholder="8.0"
            step="0.25"
            value={form.financingRate || ''}
            onChange={(e) => update('financingRate', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Timeline & Exit */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3 pb-2 border-b border-gray-800">
          Timeline & Exit Strategy
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Construction Timeline"
            type="number"
            suffix="months"
            placeholder="18"
            min="1"
            max="120"
            value={form.timelineMonths || ''}
            onChange={(e) => update('timelineMonths', parseInt(e.target.value) || 0)}
            error={errors.timelineMonths}
            required
          />

          {/* Exit Strategy */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Exit Strategy</label>
            <div className="flex gap-3">
              {(['sale', 'rent'] as const).map((strategy) => (
                <button
                  key={strategy}
                  type="button"
                  onClick={() => update('exitStrategy', strategy)}
                  className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                    form.exitStrategy === strategy
                      ? 'bg-blue-500/15 border-blue-500 text-blue-400'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {strategy === 'sale' ? '🏷️ Sell' : '🔑 Rent / Hold'}
                </button>
              ))}
            </div>
          </div>

          <Input
            label={form.exitStrategy === 'sale' ? 'Estimated Sale Value' : 'Estimated Stabilized Value'}
            type="number"
            prefix="$"
            placeholder="2,000,000"
            value={form.estimatedValue || ''}
            onChange={(e) => update('estimatedValue', parseFloat(e.target.value) || 0)}
            error={errors.estimatedValue}
            required
          />

          {form.exitStrategy === 'rent' && (
            <Input
              label="Estimated Monthly Rent (Stabilized)"
              type="number"
              prefix="$"
              placeholder="12,000"
              value={form.estimatedMonthlyRent || ''}
              onChange={(e) => update('estimatedMonthlyRent', parseFloat(e.target.value) || 0)}
            />
          )}
        </div>
      </div>

      {/* Cost Breakdown */}
      {totalDevCost > 0 && (
        <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
          <p className="text-xs text-gray-400 mb-3 font-medium">Project Cost Breakdown</p>
          <div className="space-y-2">
            {[
              { label: 'Land Cost', value: form.landCost, pct: (form.landCost / totalProjectCost) * 100 },
              { label: 'Construction', value: form.constructionCost, pct: (form.constructionCost / totalProjectCost) * 100 },
              { label: `Contingency (${form.contingencyPercent}%)`, value: contingencyAmt, pct: (contingencyAmt / totalProjectCost) * 100 },
              { label: 'Financing Cost', value: financingCost, pct: (financingCost / totalProjectCost) * 100 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="text-xs text-gray-400 w-36 flex-shrink-0">{item.label}</div>
                <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full"
                    style={{ width: `${Math.min(100, item.pct)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-300 w-28 text-right">
                  ${Math.round(item.value).toLocaleString()}
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-700 flex justify-between">
              <span className="text-sm font-medium text-white">Total Project Cost</span>
              <span className="text-sm font-bold text-white">${Math.round(totalProjectCost).toLocaleString()}</span>
            </div>
            {form.estimatedValue > 0 && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-300">
                  Development Spread
                </span>
                <span className={`text-sm font-bold ${parseFloat(developmentSpread) >= 15 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {developmentSpread}% (${Math.round(netProfit).toLocaleString()})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        icon={<BarChart3 className="w-5 h-5" />}
      >
        {loading ? 'Analyzing Deal...' : 'Analyze Deal'}
      </Button>
    </form>
  );
}
