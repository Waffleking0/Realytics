'use client';

import React, { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { ResidentialInputs } from '@/types';
import { BarChart3 } from 'lucide-react';

interface ResidentialFormProps {
  onSubmit: (inputs: ResidentialInputs) => void;
  loading?: boolean;
}

const defaultValues: ResidentialInputs = {
  address: '',
  zipCode: '',
  purchasePrice: 0,
  downPayment: 0,
  interestRate: 7.0,
  loanTermYears: 30,
  monthlyRent: 0,
  renovationCosts: 0,
  monthlyExpenses: 0,
  propertyCondition: 'good',
};

export default function ResidentialForm({ onSubmit, loading }: ResidentialFormProps) {
  const [form, setForm] = useState<ResidentialInputs>(defaultValues);
  const [errors, setErrors] = useState<Partial<Record<keyof ResidentialInputs, string>>>({});

  const update = (key: keyof ResidentialInputs, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ResidentialInputs, string>> = {};
    if (!form.address) newErrors.address = 'Address is required';
    if (!form.zipCode) newErrors.zipCode = 'ZIP code is required';
    if (form.purchasePrice <= 0) newErrors.purchasePrice = 'Purchase price must be greater than 0';
    if (form.downPayment <= 0) newErrors.downPayment = 'Down payment must be greater than 0';
    if (form.downPayment >= form.purchasePrice) newErrors.downPayment = 'Down payment cannot exceed purchase price';
    if (form.interestRate <= 0 || form.interestRate > 30) newErrors.interestRate = 'Interest rate must be between 0.1% and 30%';
    if (form.monthlyRent <= 0) newErrors.monthlyRent = 'Monthly rent must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(form);
    }
  };

  const downPaymentPct = form.purchasePrice > 0 ? ((form.downPayment / form.purchasePrice) * 100).toFixed(1) : '0';
  const loanAmount = Math.max(0, form.purchasePrice - form.downPayment);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Property Location */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 pb-2 border-b border-gray-200">
          Property Location
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Street Address"
            placeholder="123 Main Street, Austin, TX"
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            error={errors.address}
            required
          />
          <Input
            label="ZIP Code"
            placeholder="78701"
            value={form.zipCode}
            onChange={(e) => update('zipCode', e.target.value)}
            error={errors.zipCode}
            required
            maxLength={5}
          />
        </div>
      </div>

      {/* Purchase Details */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 pb-2 border-b border-gray-200">
          Purchase Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Purchase Price"
            type="number"
            prefix="$"
            placeholder="350,000"
            value={form.purchasePrice || ''}
            onChange={(e) => update('purchasePrice', parseFloat(e.target.value) || 0)}
            error={errors.purchasePrice}
            required
          />
          <Input
            label={`Down Payment ${downPaymentPct !== '0' ? `(${downPaymentPct}%)` : ''}`}
            type="number"
            prefix="$"
            placeholder="70,000"
            value={form.downPayment || ''}
            onChange={(e) => update('downPayment', parseFloat(e.target.value) || 0)}
            error={errors.downPayment}
            hint={loanAmount > 0 ? `Loan amount: $${loanAmount.toLocaleString()}` : undefined}
            required
          />
          <Input
            label="Interest Rate"
            type="number"
            suffix="%"
            placeholder="7.0"
            step="0.1"
            min="0.1"
            max="30"
            value={form.interestRate || ''}
            onChange={(e) => update('interestRate', parseFloat(e.target.value) || 0)}
            error={errors.interestRate}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600">
              Loan Term <span className="text-red-400">*</span>
            </label>
            <select
              className="w-full bg-gray-100 border border-gray-300 rounded-xl text-gray-900 text-sm py-2.5 px-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
              value={form.loanTermYears}
              onChange={(e) => update('loanTermYears', parseInt(e.target.value))}
            >
              <option value={15}>15 Years</option>
              <option value={20}>20 Years</option>
              <option value={25}>25 Years</option>
              <option value={30}>30 Years</option>
            </select>
          </div>
        </div>
      </div>

      {/* Income & Expenses */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 pb-2 border-b border-gray-200">
          Income & Expenses
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Monthly Rent"
            type="number"
            prefix="$"
            placeholder="2,500"
            value={form.monthlyRent || ''}
            onChange={(e) => update('monthlyRent', parseFloat(e.target.value) || 0)}
            error={errors.monthlyRent}
            hint={form.monthlyRent > 0 ? `Annual: $${(form.monthlyRent * 12).toLocaleString()}` : undefined}
            required
          />
          <Input
            label="Monthly Operating Expenses"
            type="number"
            prefix="$"
            placeholder="400"
            value={form.monthlyExpenses || ''}
            onChange={(e) => update('monthlyExpenses', parseFloat(e.target.value) || 0)}
            hint="Taxes, insurance, maintenance, mgmt"
          />
          <Input
            label="Renovation / Repair Costs"
            type="number"
            prefix="$"
            placeholder="15,000"
            value={form.renovationCosts || ''}
            onChange={(e) => update('renovationCosts', parseFloat(e.target.value) || 0)}
            hint="One-time upfront costs"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600">Property Condition</label>
            <select
              className="w-full bg-gray-100 border border-gray-300 rounded-xl text-gray-900 text-sm py-2.5 px-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
              value={form.propertyCondition}
              onChange={(e) =>
                update('propertyCondition', e.target.value as ResidentialInputs['propertyCondition'])
              }
            >
              <option value="excellent">Excellent — Move-in ready</option>
              <option value="good">Good — Minor repairs needed</option>
              <option value="fair">Fair — Moderate renovation needed</option>
              <option value="poor">Poor — Major renovation needed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {form.purchasePrice > 0 && form.monthlyRent > 0 && (
        <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <p className="text-xs text-gray-500 mb-2 font-medium">Quick Preview</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500">Gross Rent Multiplier</div>
              <div className="text-sm font-bold text-gray-900">
                {(form.purchasePrice / (form.monthlyRent * 12)).toFixed(1)}x
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Down Payment %</div>
              <div className="text-sm font-bold text-gray-900">{downPaymentPct}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Price-to-Rent</div>
              <div className="text-sm font-bold text-gray-900">
                {(form.purchasePrice / form.monthlyRent).toFixed(0)}x
              </div>
            </div>
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
