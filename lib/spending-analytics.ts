/**
 * Spending Analytics System
 *
 * Provides comprehensive spending analysis with:
 * - Category-based spending tracking
 * - Historical trends and patterns
 * - Budget vs actual comparisons
 * - Velocity warnings for overspending
 * - Monthly/weekly summaries
 */

/**
 * Spending categories for organizing withdrawals
 */
export enum SpendingCategory {
  RENT = 'rent',
  FOOD = 'food',
  UTILITIES = 'utilities',
  TRANSPORTATION = 'transportation',
  ENTERTAINMENT = 'entertainment',
  HEALTHCARE = 'healthcare',
  SHOPPING = 'shopping',
  EDUCATION = 'education',
  SAVINGS = 'savings',
  INVESTMENT = 'investment',
  BUSINESS = 'business',
  OTHER = 'other',
}

export interface CategoryMetadata {
  label: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
}

/**
 * Category metadata with colors and descriptions
 */
export const CATEGORY_INFO = {
  [SpendingCategory.RENT]: {
    label: 'Rent & Housing',
    description: 'Rent, mortgage, property expenses',
    icon: '🏠',
    color: '#6366f1',
    bgColor: 'bg-indigo-100 dark:bg-indigo-500/10',
  },
  [SpendingCategory.FOOD]: {
    label: 'Food & Dining',
    description: 'Groceries, restaurants, food delivery',
    icon: '🍔',
    color: '#f97316',
    bgColor: 'bg-orange-100 dark:bg-orange-500/10',
  },
  [SpendingCategory.UTILITIES]: {
    label: 'Utilities',
    description: 'Electricity, water, internet, phone',
    icon: '⚡',
    color: '#fbbf24',
    bgColor: 'bg-amber-100 dark:bg-amber-500/10',
  },
  [SpendingCategory.TRANSPORTATION]: {
    label: 'Transportation',
    description: 'Gas, public transit, car maintenance',
    icon: '🚗',
    color: '#06b6d4',
    bgColor: 'bg-cyan-100 dark:bg-cyan-500/10',
  },
  [SpendingCategory.ENTERTAINMENT]: {
    label: 'Entertainment',
    description: 'Movies, games, streaming, events',
    icon: '🎬',
    color: '#8b5cf6',
    bgColor: 'bg-violet-100 dark:bg-violet-500/10',
  },
  [SpendingCategory.HEALTHCARE]: {
    label: 'Healthcare',
    description: 'Medical, pharmacy, insurance',
    icon: '🏥',
    color: '#ef4444',
    bgColor: 'bg-red-100 dark:bg-red-500/10',
  },
  [SpendingCategory.SHOPPING]: {
    label: 'Shopping',
    description: 'Clothing, home goods, retail',
    icon: '🛍️',
    color: '#ec4899',
    bgColor: 'bg-pink-100 dark:bg-pink-500/10',
  },
  [SpendingCategory.EDUCATION]: {
    label: 'Education',
    description: 'Tuition, courses, books',
    icon: '📚',
    color: '#14b8a6',
    bgColor: 'bg-teal-100 dark:bg-teal-500/10',
  },
  [SpendingCategory.SAVINGS]: {
    label: 'Savings',
    description: 'Savings transfers, deposits',
    icon: '💰',
    color: '#10b981',
    bgColor: 'bg-emerald-100 dark:bg-emerald-500/10',
  },
  [SpendingCategory.INVESTMENT]: {
    label: 'Investment',
    description: 'Stock, crypto, bonds purchases',
    icon: '📈',
    color: '#059669',
    bgColor: 'bg-green-100 dark:bg-green-500/10',
  },
  [SpendingCategory.BUSINESS]: {
    label: 'Business',
    description: 'Business expenses, supplies',
    icon: '💼',
    color: '#64748b',
    bgColor: 'bg-slate-100 dark:bg-slate-500/10',
  },
  [SpendingCategory.OTHER]: {
    label: 'Other',
    description: 'Miscellaneous expenses',
    icon: '📌',
    color: '#6b7280',
    bgColor: 'bg-gray-100 dark:bg-gray-500/10',
  },
} as const satisfies Record<SpendingCategory, CategoryMetadata>;

/**
 * Time period for analysis
 */
export enum TimePeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/**
 * Severity level for spending warnings
 */
export enum VelocitySeverity {
  SAFE = 'safe',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

/**
 * Individual spending transaction
 */
export interface SpendingTransaction {
  id: string;
  amount: bigint;              // Amount in wei
  amountUSD?: number;          // USD equivalent
  category: SpendingCategory;
  description: string;
  timestamp: Date;
  token: string;               // ETH, USDC, etc.
  transactionHash?: string;
  blockNumber?: number;
}

/**
 * Budget allocation for a category
 */
export interface CategoryBudget {
  category: SpendingCategory;
  dailyBudget: number;         // In USD
  weeklyBudget: number;
  monthlyBudget: number;
}

/**
 * Spending data for a category in a period
 */
export interface CategorySpending {
  category: SpendingCategory;
  amount: number;              // In USD
  count: number;               // Transaction count
  percentage: number;          // % of total
  trend: number;               // % change vs previous period
  transactions: SpendingTransaction[];
}

/**
 * Spending summary for a time period
 */
export interface SpendingSummary {
  period: TimePeriod;
  startDate: Date;
  endDate: Date;
  totalSpent: number;          // In USD
  categoryBreakdown: CategorySpending[];
  avgDailySpend: number;
  maxDaySpend: number;
  minDaySpend: number;
  transactionCount: number;
}

/**
 * Velocity warning for overspending
 */
export interface VelocityWarning {
  id: string;
  category: SpendingCategory;
  period: TimePeriod;
  severity: VelocitySeverity;
  currentAmount: number;       // Current spend in USD
  budgetAmount: number;        // Budget in USD
  percentageUsed: number;      // % of budget used
  projectedTotal: number;      // Projected end-of-period total
  daysRemaining: number;
  message: string;
  recommendation: string;
  timestamp: Date;
}

/**
 * Budget comparison data
 */
export interface BudgetComparison {
  category: SpendingCategory;
  period: TimePeriod;
  budgetAmount: number;
  actualAmount: number;
  remaining: number;
  percentageUsed: number;
  status: 'safe' | 'warning' | 'exceeded';
  projectedOverage?: number;
}

/**
 * Spending trend data for charting
 */
export interface SpendingTrend {
  date: Date;
  amount: number;              // Total spending for date
  movingAverage7: number;      // 7-day moving average
  movingAverage30: number;     // 30-day moving average
  byCategory: Record<SpendingCategory, number>;
}

/**
 * Format USD amount for display
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get category info by category type
 */
export function getCategoryInfo(category: SpendingCategory) {
  return CATEGORY_INFO[category];
}

/**
 * Calculate total spending across transactions
 */
export function calculateTotalSpending(transactions: SpendingTransaction[]): number {
  return transactions.reduce((sum, tx) => sum + (tx.amountUSD || 0), 0);
}

/**
 * Calculate category breakdown percentages
 */
export function calculateCategoryPercentages(
  categories: CategorySpending[]
): CategorySpending[] {
  const total = calculateTotalSpending(
    categories.flatMap(c => c.transactions)
  );

  return categories.map(cat => ({
    ...cat,
    percentage: total > 0 ? (cat.amount / total) * 100 : 0,
  }));
}

/**
 * Calculate daily average spending
 */
export function calculateDailyAverage(
  transactions: SpendingTransaction[],
  days: number = 30
): number {
  const total = calculateTotalSpending(transactions);
  return days > 0 ? total / days : 0;
}

/**
 * Calculate spending trend from transactions
 */
export function calculateSpendingTrend(
  transactions: SpendingTransaction[],
  days: number = 30
): SpendingTrend[] {
  const trends: Record<string, SpendingTrend> = {};
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  // Initialize empty trend data for all days
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];

    trends[dateKey] = {
      date,
      amount: 0,
      movingAverage7: 0,
      movingAverage30: 0,
      byCategory: Object.values(SpendingCategory).reduce(
        (acc, cat) => ({ ...acc, [cat]: 0 }),
        {} as Record<SpendingCategory, number>
      ),
    };
  }

  // Aggregate transactions by date and category
  transactions.forEach(tx => {
    const dateKey = tx.timestamp.toISOString().split('T')[0];
    if (trends[dateKey]) {
      trends[dateKey].amount += tx.amountUSD || 0;
      trends[dateKey].byCategory[tx.category] += tx.amountUSD || 0;
    }
  });

  // Convert to array and calculate moving averages
  const trendArray = Object.values(trends).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  return trendArray.map((trend, index) => ({
    ...trend,
    movingAverage7: calculateMovingAverage(trendArray, index, 7),
    movingAverage30: calculateMovingAverage(trendArray, index, 30),
  }));
}

/**
 * Calculate moving average for a specific day
 */
function calculateMovingAverage(
  trends: SpendingTrend[],
  index: number,
  windowSize: number
): number {
  const start = Math.max(0, index - windowSize + 1);
  const window = trends.slice(start, index + 1);
  const sum = window.reduce((acc, t) => acc + t.amount, 0);
  return window.length > 0 ? sum / window.length : 0;
}

/**
 * Detect velocity warnings based on spending rate
 */
export function detectVelocityWarnings(
  transactions: SpendingTransaction[],
  budgets: CategoryBudget[],
  period: TimePeriod = TimePeriod.MONTHLY
): VelocityWarning[] {
  const warnings: VelocityWarning[] = [];
  const now = new Date();

  // Group transactions by category
  const byCategory = new Map<SpendingCategory, SpendingTransaction[]>();
  Object.values(SpendingCategory).forEach(cat => {
    byCategory.set(cat, []);
  });

  transactions.forEach(tx => {
    const cat = byCategory.get(tx.category) || [];
    byCategory.set(tx.category, [...cat, tx]);
  });

  // Check each category
  budgets.forEach(budget => {
    const categoryTxs = byCategory.get(budget.category) || [];
    const currentAmount = calculateTotalSpending(categoryTxs);

    let budgetAmount = 0;
    let daysInPeriod = 0;
    let daysRemaining = 0;

    if (period === TimePeriod.DAILY) {
      budgetAmount = budget.dailyBudget;
      daysInPeriod = 1;
      daysRemaining = 0;
    } else if (period === TimePeriod.WEEKLY) {
      budgetAmount = budget.weeklyBudget;
      daysInPeriod = 7;
      const dayOfWeek = now.getDay();
      daysRemaining = 7 - dayOfWeek;
    } else if (period === TimePeriod.MONTHLY) {
      budgetAmount = budget.monthlyBudget;
      daysInPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      daysRemaining = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    }

    const percentageUsed = budgetAmount > 0 ? (currentAmount / budgetAmount) * 100 : 0;
    const dailyRate = currentAmount / Math.max(daysInPeriod - daysRemaining, 1);
    const projectedTotal = dailyRate * daysInPeriod;

    let severity = VelocitySeverity.SAFE;
    if (percentageUsed > 100) {
      severity = VelocitySeverity.CRITICAL;
    } else if (percentageUsed > 75) {
      severity = VelocitySeverity.WARNING;
    }

    if (severity !== VelocitySeverity.SAFE) {
      const category = CATEGORY_INFO[budget.category];
      warnings.push({
        id: `${budget.category}-${period}`,
        category: budget.category,
        period,
        severity,
        currentAmount,
        budgetAmount,
        percentageUsed,
        projectedTotal,
        daysRemaining,
        message:
          severity === VelocitySeverity.CRITICAL
            ? `${category.label} budget exceeded! You've spent ${formatUSD(currentAmount)} of ${formatUSD(budgetAmount)}`
            : `${category.label} spending at ${percentageUsed.toFixed(0)}% of budget`,
        recommendation:
          severity === VelocitySeverity.CRITICAL
            ? `Consider reducing ${category.label.toLowerCase()} spending immediately`
            : `Slow down ${category.label.toLowerCase()} spending to stay within budget`,
        timestamp: new Date(),
      });
    }
  });

  return warnings;
}

/**
 * Compare actual spending vs budget
 */
export function compareBudgets(
  transactions: SpendingTransaction[],
  budgets: CategoryBudget[],
  period: TimePeriod = TimePeriod.MONTHLY
): BudgetComparison[] {
  const comparisons: BudgetComparison[] = [];

  budgets.forEach(budget => {
    // Filter transactions for this category and period
    const categoryTxs = transactions.filter(tx => tx.category === budget.category);
    const actual = calculateTotalSpending(categoryTxs);

    let budgetAmount = 0;
    let daysInPeriod = 0;
    const now = new Date();

    if (period === TimePeriod.DAILY) {
      budgetAmount = budget.dailyBudget;
      daysInPeriod = 1;
    } else if (period === TimePeriod.WEEKLY) {
      budgetAmount = budget.weeklyBudget;
      daysInPeriod = 7;
    } else if (period === TimePeriod.MONTHLY) {
      budgetAmount = budget.monthlyBudget;
      daysInPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    }

    const remaining = budgetAmount - actual;
    const percentageUsed = budgetAmount > 0 ? (actual / budgetAmount) * 100 : 0;
    const dailyRate = actual / Math.max(daysInPeriod - (now.getDate() - 1), 1);
    const daysInPeriodTotal = daysInPeriod;
    const projectedOverage =
      percentageUsed > 100 ? Math.max(0, dailyRate * daysInPeriodTotal - budgetAmount) : undefined;

    let status: 'safe' | 'warning' | 'exceeded' = 'safe';
    if (percentageUsed > 100) {
      status = 'exceeded';
    } else if (percentageUsed > 75) {
      status = 'warning';
    }

    comparisons.push({
      category: budget.category,
      period,
      budgetAmount,
      actualAmount: actual,
      remaining,
      percentageUsed,
      status,
      projectedOverage,
    });
  });

  return comparisons;
}

/**
 * Get spending summary for a time period
 */
export function getSpendingSummary(
  transactions: SpendingTransaction[],
  period: TimePeriod,
  endDate: Date = new Date()
): SpendingSummary {
  // Filter transactions for the period
  const startDate = new Date(endDate);
  let daysInPeriod = 1;

  if (period === TimePeriod.WEEKLY) {
    startDate.setDate(startDate.getDate() - 7);
    daysInPeriod = 7;
  } else if (period === TimePeriod.MONTHLY) {
    startDate.setMonth(startDate.getMonth() - 1);
    daysInPeriod = 30;
  } else if (period === TimePeriod.YEARLY) {
    startDate.setFullYear(startDate.getFullYear() - 1);
    daysInPeriod = 365;
  }

  const periodTxs = transactions.filter(
    tx => tx.timestamp >= startDate && tx.timestamp <= endDate
  );

  // Group by category
  const byCategory = new Map<SpendingCategory, SpendingTransaction[]>();
  Object.values(SpendingCategory).forEach(cat => {
    byCategory.set(cat, []);
  });

  periodTxs.forEach(tx => {
    const cat = byCategory.get(tx.category) || [];
    byCategory.set(tx.category, [...cat, tx]);
  });

  const totalSpent = calculateTotalSpending(periodTxs);
  const categoryBreakdown = Array.from(byCategory.entries())
    .map(([category, txs]) => ({
      category,
      amount: calculateTotalSpending(txs),
      count: txs.length,
      percentage: totalSpent > 0 ? (calculateTotalSpending(txs) / totalSpent) * 100 : 0,
      trend: 0, // Would compare with previous period
      transactions: txs,
    }))
    .filter(c => c.count > 0);

  // Calculate daily statistics
  const dailySpends: number[] = [];
  for (let i = 0; i < daysInPeriod; i++) {
    const day = new Date(startDate);
    day.setDate(day.getDate() + i);
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const dayTxs = periodTxs.filter(tx => tx.timestamp >= dayStart && tx.timestamp <= dayEnd);
    const daySpend = calculateTotalSpending(dayTxs);
    if (daySpend > 0) dailySpends.push(daySpend);
  }

  return {
    period,
    startDate,
    endDate,
    totalSpent,
    categoryBreakdown,
    avgDailySpend: totalSpent / daysInPeriod,
    maxDaySpend: dailySpends.length > 0 ? Math.max(...dailySpends) : 0,
    minDaySpend: dailySpends.length > 0 ? Math.min(...dailySpends) : 0,
    transactionCount: periodTxs.length,
  };
}

/**
 * Format percentage for display
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}

/**
 * Get status color based on budget usage
 */
export function getStatusColor(percentageUsed: number): string {
  if (percentageUsed > 100) return '#ef4444'; // red
  if (percentageUsed > 75) return '#f97316'; // orange
  return '#10b981'; // green
}

/**
 * Get severity badge color
 */
export function getSeverityColor(severity: VelocitySeverity): string {
  switch (severity) {
    case VelocitySeverity.CRITICAL:
      return 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400';
    case VelocitySeverity.WARNING:
      return 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400';
    case VelocitySeverity.SAFE:
      return 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  }
}
