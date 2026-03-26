'use client';

import React, { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { CommercialInputs } from '@/types';
import { BarChart3 } from 'lucide-react';

interface CommercialFormProps {
  onSubmit: (inputs: CommercialInputs) => void;
  loading?: boolean;
}

const defaultValues: CommercialInputs = {
  location: '',
  zipCode: '',
  purchasePrice: 0,
  downPayment: 0,
  interestRate: 7.5,
  loanTermYears: 25,
  numberOfTenants: 1,
  averageLeaseTermYears: 3,
  vacancyRate: 10,
  monthlyOperatingExpenses: 0,
  grossMonthlyRent: 0,
  propertySize: 0,
};

export default function CommercialForm({ onSubmit, loading }: CommercialFormProps) {
  const [form, setForm] = useState<CommercialInputs>(defaultValues);
  const [errors, setErrors] = useState<Partial<Record<keyof CommercialInputs, string>>>({});

  const update = (key: keyof CommercialInputs, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CommercialInputs, string>> = {};
    if (!form.location) newErrors.location = 'Location is required';
    if (form.purchasePrice <= 0) newErrors.purchasePrice = 'Purchase price is required';
    if (form.downPayment <= 0) newErrors.downPayment = 'Down payment is required';
    if (form.grossMonthlyRent <= 0) newErrors.grossMonthlyRent = 'Gross rent is required';
    if (form.vacancyRate < 0 || form.vacancyRate > 100) newErrors.vacancyRate = 'Vacancy must be 0-100%';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const loanAmount = Math.max(0, form.purchasePrice - form.downPayment);
  const annualNOI =
    form.grossMonthlyRent * 12 * (1 - form.vacancyRate / 100) -
    form.monthlyOperatingExpenses * 12;
  const estimatedCapRate =
    form.purchasePrice > 0 ? ((annualNOI / form.purchasePrice) * 100).toFixed(1) : '-';
  const pricePerSqft =
    form.propertySize > 0
      ? (form.purchasePrice / form.propertySize).toFixed(0)
      : '-';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Location */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3 pb-2 border-b border-gray-800">
          Property Location
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Location / Address"
            placeholder="500 Commerce Dr, Austin, TX"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            error={errors.location}
            required
          />
          <Input
            label="ZIP Code"
            placeholder="78701"
            value={form.zipCode}
            onChange={(e) => update('zipCode', e.target.value)}
            maxLength={5}
          />
        </div>
      </div>

      {/* Purchase Details */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3 pb-2 border-b border-gray-800">
          Purchase Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Purchase Price"
            type="number"
            prefix="$"
            placeholder="2,500,000"
            value={form.purchasePrice || ''}
            onChange={(e) => update('purchasePrice', parseFloat(e.target.value) || 0)}
            error={errors.purchasePrice}
            required
          />
          <Input
            label="Down Payment"
            type="number"
            prefix="$"
            placeholder="625,000"
            value={form.downPayment || ''}
            onChange={(e) => update('downPayment', parseFloat(e.target.value) || 0)}
            error={errors.downPayment}
            hint={loanAmount > 0 ? `Loan: $${loanAmount.toLocaleString()}` : undefined}
            required
          />
          <Input
            label="Interest Rate"
            type="number"
            suffix="%"
            placeholder="7.5"
            step="0.1"
            value={form.interestRate || ''}
            onChange={(e) => update('interestRate', parseFloat(e.target.value) || 0)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Loan Term</label>
            <select
              className="w-full bg-gray-800/60 border border-gray-700 rounded-xl text-white text-sm py-2.5 px-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
              value={form.loanTermYears}
              onChange={(e) => update('loanTermYears', parseInt(e.target.value))}
            >
              <option value={15}>15 Years</option>
              <option value={20}>20 Years</option>
              <option value={25}>25 Years</option>
              <option value={30}>30 Years</option>
            </select>
          </div>
          <Input
            label="Property Size"
            type="number"
            suffix="sqft"
            placeholder="12,000"
            value={form.propertySize || ''}
            onChange={(e) => update('propertySize', parseFloat(e.target.value) || 0)}
            hint={pricePerSqft !== '-' ? `$${pricePerSqft}/sqft` : undefined}
          />
        </div>
      </div>

      {/* Tenant & Lease Details */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3 pb-2 border-b border-gray-800">
          Tenant & Lease Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Number of Tenants"
            type="number"
            placeholder="3"
            min="1"
            value={form.numberOfTenants || ''}
            onChange={(e) => update('numberOfTenants', parseInt(e.target.value) || 1)}
          />
          <Input
            label="Average Lease Term"
            type="number"
            suffix="years"
            placeholder="3"
            min="1"
            max="30"
            value={form.averageLeaseTermYears || ''}
            onChange={(e) => update('averageLeaseTermYears', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Income & Expenses */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3 pb-2 border-b border-gray-800">
          Income & Expenses
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Gross Monthly Rent"
            type="number"
            prefix="$"
            placeholder="18,000"
            value={form.grossMonthlyRent || ''}
            onChange={(e) => update('grossMonthlyRent', parseFloat(e.target.value) || 0)}
            error={errors.grossMonthlyRent}
            hint={form.grossMonthlyRent > 0 ? `Annual: $${(form.grossMonthlyRent * 12).toLocaleString()}` : undefined}
            required
          />
          <Input
            label="Vacancy Rate"
            type="number"
            suffix="%"
            placeholder="10"
            min="0"
            max="100"
            step="0.5"
            value={form.vacancyRate || ''}
            onChange={(e) => update('vacancyRate', parseFloat(e.target.value) || 0)}
            error={errors.vacancyRate}
          />
          <Input
            label="Monthly Operating Expenses"
            type="number"
            prefix="$"
            placeholder="3,500"
            value={form.monthlyOperatingExpenses || ''}
            onChange={(e) => update('monthlyOperatingExpenses', parseFloat(e.target.value) || 0)}
            hint="Taxes, insurance, maintenance, mgmt"
          />
        </div>
      </div>

      {/* Preview */}
      {form.grossMonthlyRent > 0 && form.purchasePrice > 0 && (
        <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
          <p className="text-xs text-gray-400 mb-2 font-medium">Estimated Metrics</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500">Est. Cap Rate</div>
              <div className={`text-sm font-bold ${parseFloat(estimatedCapRate) >= 6 ? 'text-green-400' : 'text-yellow-400'}`}>
                {estimatedCapRate}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Annual NOI</div>
              <div className="text-sm font-bold text-white">${Math.round(annualNOI).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Price/Sqft</div>
              <div className="text-sm font-bold text-white">${pricePerSqft}</div>
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
