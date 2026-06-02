import { BudgetItem, Expense, Property, SaleInfo } from '@/types';

/**
 * Financial calculation helpers for NGI Property Hub V2.
 *
 * All calculations are pure functions — no side effects, no AsyncStorage.
 * They operate on data already loaded by DataContext.
 *
 * Calculation definitions:
 *   renovationBudget   = sum of all budgetItems.estimated
 *   budgetActual       = sum of all budgetItems.actual
 *   totalExpenses      = sum of all Expense.amount for the property
 *   totalInvested      = purchasePrice + closingCosts + totalExpenses
 *   saleProceeds       = salePrice − sellingClosingCosts − realtorCommission
 *                        − attorneyFee − lenderPayoff − otherSellingExpenses
 *   netProfit          = saleProceeds − totalInvested
 *   roi                = (netProfit / totalInvested) × 100
 *   budgetVariance     = renovationBudget − budgetActual (positive = under budget)
 */

// ─── Budget helpers ──────────────────────────────────────────────────────────

export function calcRenovationBudget(budgetItems: BudgetItem[]): number {
  return budgetItems.reduce((sum, item) => sum + item.estimated, 0);
}

export function calcBudgetActual(budgetItems: BudgetItem[]): number {
  return budgetItems.reduce((sum, item) => sum + item.actual, 0);
}

export function calcBudgetVariance(budgetItems: BudgetItem[]): number {
  return calcRenovationBudget(budgetItems) - calcBudgetActual(budgetItems);
}

export function calcBudgetUsedPercent(budgetItems: BudgetItem[]): number {
  const budget = calcRenovationBudget(budgetItems);
  if (budget === 0) return 0;
  return Math.min((calcBudgetActual(budgetItems) / budget) * 100, 100);
}

// ─── Expense helpers ─────────────────────────────────────────────────────────

export function calcTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function calcExpensesByCategory(expenses: Expense[]): Record<string, number> {
  return expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
}

// ─── Investment helpers ───────────────────────────────────────────────────────

export function calcTotalInvested(property: Property, expenses: Expense[]): number {
  return property.purchasePrice + property.closingCosts + calcTotalExpenses(expenses);
}

// ─── Sale / profit helpers ────────────────────────────────────────────────────

export function calcSaleProceeds(sale: SaleInfo): number {
  return (
    sale.salePrice
    - sale.sellingClosingCosts
    - sale.realtorCommission
    - sale.attorneyFee
    - sale.lenderPayoff
    - sale.otherSellingExpenses
  );
}

export function calcNetProfit(property: Property, expenses: Expense[]): number {
  if (!property.saleInfo) return 0;
  return calcSaleProceeds(property.saleInfo) - calcTotalInvested(property, expenses);
}

export function calcROI(property: Property, expenses: Expense[]): number {
  const invested = calcTotalInvested(property, expenses);
  if (invested === 0) return 0;
  return (calcNetProfit(property, expenses) / invested) * 100;
}

// ─── Portfolio summary ────────────────────────────────────────────────────────

export interface PortfolioSummary {
  totalPropertiesActive: number;
  totalPropertiesSold: number;
  totalInvestedActive: number;
  totalNetProfit: number;
  averageROI: number;
}

export function calcPortfolioSummary(
  properties: Property[],
  allExpenses: Expense[],
): PortfolioSummary {
  const active = properties.filter(
    (p) => !['Sold', 'Completed'].includes(p.status),
  );
  const sold = properties.filter((p) => ['Sold', 'Completed'].includes(p.status));

  const totalInvestedActive = active.reduce((sum, p) => {
    const expenses = allExpenses.filter((e) => e.propertyId === p.id);
    return sum + calcTotalInvested(p, expenses);
  }, 0);

  const profits = sold.map((p) => {
    const expenses = allExpenses.filter((e) => e.propertyId === p.id);
    return calcNetProfit(p, expenses);
  });

  const totalNetProfit = profits.reduce((sum, n) => sum + n, 0);

  const rois = sold.map((p) => {
    const expenses = allExpenses.filter((e) => e.propertyId === p.id);
    return calcROI(p, expenses);
  }).filter((r) => r !== 0);

  const averageROI = rois.length > 0 ? rois.reduce((a, b) => a + b, 0) / rois.length : 0;

  return {
    totalPropertiesActive: active.length,
    totalPropertiesSold: sold.length,
    totalInvestedActive,
    totalNetProfit,
    averageROI,
  };
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
