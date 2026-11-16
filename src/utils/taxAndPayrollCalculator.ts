/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Centralized Tax, Hospitality Levy, and Payroll Calculation Module.
 *
 * IMPORTANT: All statutory rates, brackets, pension treatments, and levy bases come
 * from `src/config/taxAndPayrollConfig.ts` and MUST be verified by a qualified
 * accountant before live financial reporting, VAT filing, or payroll disbursement.
 */

import { TAX_AND_PAYROLL_CONFIG } from '../config/taxAndPayrollConfig';

export interface HospitalityLevyOptions {
  vatRatePercent?: number;
  serviceChargeRatePercent?: number;
  includeServiceCharge?: boolean;
  roundDecimals?: number;
}

export interface HospitalityLevyResult {
  subtotal: number;
  vatRatePercent: number;
  serviceChargeRatePercent: number;
  vatAmount: number;
  serviceChargeAmount: number;
  total: number;
}

function roundValue(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculates VAT and Service Charge consistently across POS, Front Office,
 * Events, Laundry, In-Room Ordering, and Night Audit using an additive basis
 * on the pre-tax subtotal. Rates must be verified by an accountant.
 */
export function calculateHospitalityLevies(
  subtotal: number,
  options?: HospitalityLevyOptions
): HospitalityLevyResult {
  const safeSubtotal = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;
  const decimals = options?.roundDecimals ?? 2;
  const vatRatePercent =
    options?.vatRatePercent ?? TAX_AND_PAYROLL_CONFIG.defaultVatRatePercent;
  const includeSC = options?.includeServiceCharge ?? true;
  const serviceChargeRatePercent = includeSC
    ? options?.serviceChargeRatePercent ?? TAX_AND_PAYROLL_CONFIG.defaultServiceChargeRatePercent
    : 0;

  const vatAmount = roundValue(safeSubtotal * (vatRatePercent / 100), decimals);
  const serviceChargeAmount = roundValue(
    safeSubtotal * (serviceChargeRatePercent / 100),
    decimals
  );
  const total = roundValue(safeSubtotal + vatAmount + serviceChargeAmount, decimals);

  return {
    subtotal: roundValue(safeSubtotal, decimals),
    vatRatePercent,
    serviceChargeRatePercent,
    vatAmount,
    serviceChargeAmount,
    total,
  };
}

/**
 * Calculates VAT-only totals (e.g., supplier Purchase Orders).
 * Rates must be verified by an accountant.
 */
export function calculateVatOnly(
  subtotal: number,
  vatRatePercent: number = TAX_AND_PAYROLL_CONFIG.defaultVatRatePercent,
  roundDecimals = 0
): { subtotal: number; vatAmount: number; total: number } {
  const safeSubtotal = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;
  const vatAmount = roundValue(safeSubtotal * (vatRatePercent / 100), roundDecimals);
  return {
    subtotal: roundValue(safeSubtotal, roundDecimals),
    vatAmount,
    total: roundValue(safeSubtotal + vatAmount, roundDecimals),
  };
}

/**
 * Converts a USD amount to ETB using the configured reference FX rate.
 */
export function convertUsdToEtb(
  usdAmount: number,
  rate: number = TAX_AND_PAYROLL_CONFIG.usdToEtbReferenceRate
): number {
  const safeAmount = Number.isFinite(usdAmount) ? usdAmount : 0;
  return Math.round(safeAmount * rate);
}

/**
 * Computes progressive Ethiopian Employment Income Tax from configured brackets.
 * Rates and bracket thresholds MUST be verified by an accountant before use.
 */
export function calculateEthiopianIncomeTax(taxableIncomeEtb: number): number {
  const safeIncome = Number.isFinite(taxableIncomeEtb) ? Math.max(0, taxableIncomeEtb) : 0;
  const bracket = TAX_AND_PAYROLL_CONFIG.incomeTaxBrackets.find(
    (b) => safeIncome > b.minIncomeExclusive && safeIncome <= b.maxIncomeInclusive
  );
  if (!bracket || bracket.marginalRate === 0) return 0;

  const tax =
    (safeIncome - bracket.minIncomeExclusive) * bracket.marginalRate +
    bracket.cumulativeTaxAtLowerBound;
  return Math.max(0, Math.round(tax));
}

export interface PayrollCalculationInput {
  baseSalaryEtb: number;
  serviceChargeShareEtb?: number;
  overtimePayEtb?: number;
  bonusesEtb?: number;
  otherDeductionsEtb?: number;
}

export interface PayrollCalculationResult {
  baseSalary: number;
  serviceChargeShare: number;
  overtimePay: number;
  bonuses: number;
  grossPay: number;
  pensionEmployee: number;
  pensionEmployer: number;
  taxableIncome: number;
  incomeTax: number;
  otherDeductions: number;
  netPay: number;
}

/**
 * Computes an individual employee's monthly payroll breakdown in ETB.
 * IMPORTANT: Statutory rules (taxability of service charge/overtime, pension exemption,
 * and tax brackets) MUST be verified by a qualified accountant before disbursement.
 */
export function calculateEthiopianPayrollItem(
  input: PayrollCalculationInput
): PayrollCalculationResult {
  const baseSalary = Math.max(0, Math.round(input.baseSalaryEtb || 0));
  const serviceChargeShare = Math.max(0, Math.round(input.serviceChargeShareEtb || 0));
  const overtimePay = Math.max(0, Math.round(input.overtimePayEtb || 0));
  const bonuses = Math.max(0, Math.round(input.bonusesEtb || 0));
  const otherDeductions = Math.max(0, Math.round(input.otherDeductionsEtb || 0));

  const grossPay = baseSalary + serviceChargeShare + overtimePay + bonuses;
  const pensionEmployee = Math.round(
    baseSalary * TAX_AND_PAYROLL_CONFIG.pension.employeeRate
  );
  const pensionEmployer = Math.round(
    baseSalary * TAX_AND_PAYROLL_CONFIG.pension.employerRate
  );

  const taxableIncome = Math.max(0, grossPay - pensionEmployee);
  const incomeTax = calculateEthiopianIncomeTax(taxableIncome);
  const netPay = Math.max(0, grossPay - pensionEmployee - incomeTax - otherDeductions);

  return {
    baseSalary,
    serviceChargeShare,
    overtimePay,
    bonuses,
    grossPay,
    pensionEmployee,
    pensionEmployer,
    taxableIncome,
    incomeTax,
    otherDeductions,
    netPay,
  };
}
