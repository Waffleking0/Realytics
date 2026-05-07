import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { TIERS, type UserTier } from '@/lib/tier';
import { fetchRealComparables, fetchPropertyTax } from '@/lib/analysis/rentcast';
import type {
  PropertyType,
  ResidentialInputs,
  LandInputs,
  CommercialInputs,
  MultifamilyInputs,
  DevelopmentInputs,
  AnalysisResult,
} from '@/types';
import {
  calculateResidential,
  calculateMultifamily,
  calculateCommercial,
  calculateLand,
  calculateDevelopment,
  generateCashFlowProjections,
} from '@/lib/calculations/financial';
import { findComparables } from '@/lib/analysis/comparables';
import { analyzeMarket } from '@/lib/analysis/market';
import { generateAIReport } from '@/lib/analysis/aiReport';

async function resolveUserTier(): Promise<{ tier: UserTier; userId: string | null }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return { tier: 'FREE', userId: null };

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, tier: true, monthlyAnalyses: true, analysisResetAt: true },
    });

    if (!user) return { tier: 'FREE', userId: null };
    return { tier: user.tier as UserTier, userId: user.id };
  } catch {
    return { tier: 'FREE', userId: null };
  }
}

async function checkAndIncrementUsage(userId: string, tier: UserTier): Promise<boolean> {
  const limit = TIERS[tier].monthlyAnalyses;
  if (limit === -1) {
    // unlimited — still increment for analytics
    await prisma.user.update({ where: { id: userId }, data: { monthlyAnalyses: { increment: 1 } } });
    return true;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { monthlyAnalyses: true, analysisResetAt: true },
  });
  if (!user) return false;

  const now = new Date();
  const resetAt = new Date(user.analysisResetAt);
  const sameMonth =
    now.getFullYear() === resetAt.getFullYear() && now.getMonth() === resetAt.getMonth();
  const count = sameMonth ? user.monthlyAnalyses : 0;

  if (count >= limit) return false;

  await prisma.user.update({
    where: { id: userId },
    data: {
      monthlyAnalyses: sameMonth ? { increment: 1 } : 1,
      ...(sameMonth ? {} : { analysisResetAt: now }),
    },
  });

  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, inputs } = body as {
      type: PropertyType;
      inputs: ResidentialInputs | LandInputs | CommercialInputs | MultifamilyInputs | DevelopmentInputs;
    };

    if (!type || !inputs) {
      return NextResponse.json(
        { error: 'Missing required fields: type and inputs' },
        { status: 400 }
      );
    }

    const { tier, userId } = await resolveUserTier();

    // Enforce monthly limit for authenticated users
    if (userId) {
      const allowed = await checkAndIncrementUsage(userId, tier);
      if (!allowed) {
        const limit = TIERS[tier].monthlyAnalyses;
        return NextResponse.json(
          {
            error: `You've reached your ${limit} analyses/month limit on the ${TIERS[tier].name} plan. Upgrade to continue.`,
            limitReached: true,
          },
          { status: 429 }
        );
      }
    }

    // Financial calculations
    let financialResults;
    let location = '';
    let purchasePrice = 0;
    let propertySize: number | undefined;

    switch (type) {
      case 'residential': {
        const res = inputs as ResidentialInputs;
        financialResults = calculateResidential(res);
        location = `${res.address || ''} ${res.zipCode || ''}`.trim();
        purchasePrice = res.purchasePrice;
        break;
      }
      case 'multifamily': {
        const mf = inputs as MultifamilyInputs;
        financialResults = calculateMultifamily(mf);
        location = `${mf.location || ''} ${mf.zipCode || ''}`.trim();
        purchasePrice = mf.purchasePrice;
        propertySize = mf.propertySize;
        break;
      }
      case 'commercial': {
        const com = inputs as CommercialInputs;
        financialResults = calculateCommercial(com);
        location = `${com.location || ''} ${com.zipCode || ''}`.trim();
        purchasePrice = com.purchasePrice;
        propertySize = com.propertySize;
        break;
      }
      case 'land': {
        const land = inputs as LandInputs;
        financialResults = calculateLand(land);
        location = `${land.location || ''} ${land.zipCode || ''}`.trim();
        purchasePrice = land.purchasePrice;
        break;
      }
      case 'development': {
        const dev = inputs as DevelopmentInputs;
        financialResults = calculateDevelopment(dev);
        location = `${dev.location || ''} ${dev.zipCode || ''}`.trim();
        purchasePrice = dev.landCost + dev.constructionCost;
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid property type' }, { status: 400 });
    }

    // Comparables: real data for Pro (if Rentcast key is set), mock otherwise
    let comparables = findComparables(type, purchasePrice, propertySize);
    let propertyTax = undefined;

    if (tier === 'PRO' && location) {
      const [realComps, taxData] = await Promise.all([
        fetchRealComparables(location, type, purchasePrice),
        fetchPropertyTax(location),
      ]);
      if (realComps.length > 0) comparables = realComps;
      if (taxData.annualTax !== undefined) propertyTax = taxData;
    }

    const marketAnalysis = analyzeMarket(
      type,
      location,
      financialResults.capRate,
      financialResults.cashOnCashReturn
    );

    const aiReport = generateAIReport(
      type,
      inputs as unknown as Record<string, unknown>,
      financialResults,
      marketAnalysis
    );

    const appreciationRate =
      type === 'land' ? (inputs as LandInputs).expectedAppreciationRate / 100 : 0.04;
    const downPayment =
      type === 'residential' ? (inputs as ResidentialInputs).downPayment :
      type === 'multifamily'  ? (inputs as MultifamilyInputs).downPayment :
      type === 'commercial'   ? (inputs as CommercialInputs).downPayment :
      purchasePrice * 0.25;

    const projections = generateCashFlowProjections(
      financialResults.annualCashFlow,
      10,
      0.03,
      purchasePrice,
      appreciationRate,
      downPayment
    );

    const result: AnalysisResult = {
      inputs,
      type,
      financialResults,
      comparables,
      marketAnalysis,
      aiReport,
      projections,
      timestamp: new Date().toISOString(),
      userTier: tier,
      propertyTax,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze property. Please check your inputs and try again.' },
      { status: 500 }
    );
  }
}
