import { NextRequest, NextResponse } from 'next/server';
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

    // Run financial calculations
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

    // Find comparable properties
    const comparables = findComparables(type, purchasePrice, propertySize);

    // Run market analysis
    const marketAnalysis = analyzeMarket(
      type,
      location,
      financialResults.capRate,
      financialResults.cashOnCashReturn
    );

    // Generate AI report
    const aiReport = generateAIReport(type, inputs as unknown as Record<string, unknown>, financialResults, marketAnalysis);

    // Generate cash flow projections
    const appreciationRate = type === 'land' ? (inputs as LandInputs).expectedAppreciationRate / 100 : 0.04;
    const downPayment =
      type === 'residential' ? (inputs as ResidentialInputs).downPayment :
      type === 'multifamily' ? (inputs as MultifamilyInputs).downPayment :
      type === 'commercial' ? (inputs as CommercialInputs).downPayment :
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
