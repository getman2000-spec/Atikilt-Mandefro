/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Centralized Tax, Hospitality Levy, Currency Reference, and Payroll Configuration.
 *
 * IMPORTANT COMPLIANCE NOTICE:
 * All tax rates, pension percentages, taxable-income rules, and statutory income tax
 * brackets below are reference configuration values ONLY. They MUST be verified by a
 * qualified accountant / tax advisor against current Ethiopian Ministry of Revenues
 * (MOR) proclamations and applicable local regulations before use in live accounting
 * or payroll disbursements.
 */

export interface IncomeTaxBracket {
  /** Exclusive lower bound in ETB (0 for first bracket) */
  minIncomeExclusive: number;
  /** Inclusive upper bound in ETB (Infinity for top bracket) */
  maxIncomeInclusive: number;
  /** Marginal tax rate as decimal (e.g. 0.10 = 10%) */
  marginalRate: number;
  /** Cumulative tax payable at minIncomeExclusive */
  cumulativeTaxAtLowerBound: number;
  /** Standard deduction shortcut: tax = income * marginalRate - deduction */
  standardDeduction: number;
}

export const TAX_AND_PAYROLL_CONFIG = {
  /**
   * Reference USD -> ETB conversion rate used when converting legacy USD
   * subscription/approval figures to ETB. Verify against daily commercial/NBE rate.
   */
  usdToEtbReferenceRate: 125,
  usdToEtbRateNote: 'Reference rate: 1 USD = 125 ETB (verify daily FX rate before settlement)',

  /** Default Ethiopian hospitality levies (configurable per property in Financial Rules) */
  defaultVatRatePercent: 15,
  defaultServiceChargeRatePercent: 10,

  /**
   * Calculation basis across POS, Front Office, Events, Laundry, In-Room & Night Audit:
   * 'additive' applies both VAT (15%) and Service Charge (10%) to the base subtotal (total = base * 1.25).
   * Must be verified by an accountant for local municipal/VAT treatment.
   */
  levyCalculationBasis: 'additive' as const,

  /** Statutory Ethiopian Private Organization Employees' Pension rates */
  pension: {
    employeeRate: 0.07, // 7% employee contribution (verified against payroll rules)
    employerRate: 0.11, // 11% employer contribution (employer expense, not employee deduction)
  },

  /**
   * Progressive Monthly Employment Income Tax Brackets (Schedule A Reference).
   * IMPORTANT: Verify bracket thresholds and taxability of service charge, overtime,
   * and pension exemptions with a licensed Ethiopian accountant before payroll disbursement.
   */
  incomeTaxBrackets: [
    { minIncomeExclusive: 0, maxIncomeInclusive: 600, marginalRate: 0, cumulativeTaxAtLowerBound: 0, standardDeduction: 0 },
    { minIncomeExclusive: 600, maxIncomeInclusive: 1650, marginalRate: 0.10, cumulativeTaxAtLowerBound: 0, standardDeduction: 60 },
    { minIncomeExclusive: 1650, maxIncomeInclusive: 3200, marginalRate: 0.15, cumulativeTaxAtLowerBound: 105, standardDeduction: 142.5 },
    { minIncomeExclusive: 3200, maxIncomeInclusive: 5250, marginalRate: 0.20, cumulativeTaxAtLowerBound: 337.5, standardDeduction: 302.5 },
    { minIncomeExclusive: 5250, maxIncomeInclusive: 7800, marginalRate: 0.25, cumulativeTaxAtLowerBound: 747.5, standardDeduction: 565 },
    { minIncomeExclusive: 7800, maxIncomeInclusive: 10900, marginalRate: 0.30, cumulativeTaxAtLowerBound: 1385, standardDeduction: 955 },
    { minIncomeExclusive: 10900, maxIncomeInclusive: Infinity, marginalRate: 0.35, cumulativeTaxAtLowerBound: 2315, standardDeduction: 1500 },
  ] as IncomeTaxBracket[],

  /** Standard ETB property purchase approval thresholds */
  defaultApprovalLimitsEtb: {
    deptHeadLimit: 5000,
    financeManagerLimit: 50000,
    gmLimit: 250000,
  },

  /**
   * Legacy Phase 4 USD thresholds ($250 / $2,500 / $10,000) converted to ETB
   * using usdToEtbReferenceRate (1 USD = 125 ETB).
   */
  convertedLegacyUsdApprovalLimitsEtb: {
    sourceUsd: {
      deptHeadLimitUsd: 250,
      financeManagerLimitUsd: 2500,
      gmLimitUsd: 10000,
    },
    deptHeadLimit: 250 * 125, // 31,250 ETB
    financeManagerLimit: 2500 * 125, // 312,500 ETB
    gmLimit: 10000 * 125, // 1,250,000 ETB
  },
} as const;
