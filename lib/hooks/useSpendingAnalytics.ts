/**
 * Spending Analytics Hooks
 *
 * React hooks for spending data fetching, analysis, and budget tracking
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  SpendingTransaction,
  SpendingCategory,
  CategoryBudget,
  TimePeriod,
  CategorySpending,
  SpendingSummary,
  VelocityWarning,
  BudgetComparison,
  SpendingTrend,
  calculateTotalSpending,
  calculateDailyAverage,
  calculateSpendingTrend,
  detectVelocityWarnings,
  compareBudgets,
  getSpendingSummary,
  CATEGORY_INFO,
} from '@/lib/spending-analytics';

/**
 * Hook to fetch and manage spending transactions
 */
export function useSpendingData() {
  const [transactions, setTransactions] = useState<SpendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch spending data from localStorage
  useEffect(() => {
    try {
      setLoading(true);
      const stored = localStorage.getItem('spending_transactions');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to dates
        const transactions = parsed.map((tx: any) => ({
          ...tx,
          timestamp: new Date(tx.timestamp),
        }));
        setTransactions(transactions);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load spending data');
      console.error('Error loading spending data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new transaction
  const addTransaction = useCallback(
    (transaction: Omit<SpendingTransaction, 'id' | 'timestamp'>) => {
      try {
        const newTx: SpendingTransaction = {
          ...transaction,
          id: `tx_${Date.now()}_${Math.random()}`,
          timestamp: new Date(),
        };

        setTransactions(prev => {
          const updated = [...prev, newTx];
          localStorage.setItem('spending_transactions', JSON.stringify(updated));
          return updated;
        });
        return newTx;
      } catch (err) {
        setError('Failed to add transaction');
        throw err;
      }
    },
    []
  );

  // Delete transaction
  const deleteTransaction = useCallback((id: string) => {
    try {
      setTransactions(prev => {
        const updated = prev.filter(tx => tx.id !== id);
        localStorage.setItem('spending_transactions', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      setError('Failed to delete transaction');
      throw err;
    }
  }, []);

  // Clear all transactions
  const clearAllTransactions = useCallback(() => {
    try {
      setTransactions([]);
      localStorage.removeItem('spending_transactions');
    } catch (err) {
      setError('Failed to clear transactions');
      throw err;
    }
  }, []);

  return {
    transactions,
    loading,
    error,
    addTransaction,
    deleteTransaction,
    clearAllTransactions,
  };
}

/**
 * Hook to manage spending budgets
 */
export function useSpendingBudgets() {
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [loading, setLoading] = useState(true);

  // Load default budgets
  useEffect(() => {
    try {
      const stored = localStorage.getItem('spending_budgets');
      if (stored) {
        setBudgets(JSON.parse(stored));
      } else {
        // Initialize with default budgets
        const defaultBudgets: CategoryBudget[] = [
          {
            category: SpendingCategory.RENT,
            dailyBudget: 50,
            weeklyBudget: 350,
            monthlyBudget: 1500,
          },
          {
            category: SpendingCategory.FOOD,
            dailyBudget: 30,
            weeklyBudget: 210,
            monthlyBudget: 900,
          },
          {
            category: SpendingCategory.UTILITIES,
            dailyBudget: 10,
            weeklyBudget: 70,
            monthlyBudget: 300,
          },
          {
            category: SpendingCategory.TRANSPORTATION,
            dailyBudget: 15,
            weeklyBudget: 105,
            monthlyBudget: 450,
          },
          {
            category: SpendingCategory.ENTERTAINMENT,
            dailyBudget: 10,
            weeklyBudget: 70,
            monthlyBudget: 300,
          },
          {
            category: SpendingCategory.SHOPPING,
            dailyBudget: 20,
            weeklyBudget: 140,
            monthlyBudget: 600,
          },
          {
            category: SpendingCategory.HEALTHCARE,
            dailyBudget: 5,
            weeklyBudget: 35,
            monthlyBudget: 150,
          },
          {
            category: SpendingCategory.EDUCATION,
            dailyBudget: 10,
            weeklyBudget: 70,
            monthlyBudget: 300,
          },
          {
            category: SpendingCategory.SAVINGS,
            dailyBudget: 25,
            weeklyBudget: 175,
            monthlyBudget: 750,
          },
          {
            category: SpendingCategory.INVESTMENT,
            dailyBudget: 15,
            weeklyBudget: 105,
            monthlyBudget: 450,
          },
          {
            category: SpendingCategory.BUSINESS,
            dailyBudget: 20,
            weeklyBudget: 140,
            monthlyBudget: 600,
          },
          {
            category: SpendingCategory.OTHER,
            dailyBudget: 10,
            weeklyBudget: 70,
            monthlyBudget: 300,
          },
        ];
        setBudgets(defaultBudgets);
        localStorage.setItem('spending_budgets', JSON.stringify(defaultBudgets));
      }
    } catch (err) {
      console.error('Error loading budgets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update budget
  const updateBudget = useCallback((category: SpendingCategory, updates: Partial<CategoryBudget>) => {
    setBudgets(prev => {
      const updated = prev.map(b =>
        b.category === category ? { ...b, ...updates, category } : b
      );
      localStorage.setItem('spending_budgets', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Reset to default budgets
  const resetBudgets = useCallback(() => {
    const defaultBudgets: CategoryBudget[] = Object.values(SpendingCategory).map(cat => ({
      category: cat,
      dailyBudget: 20,
      weeklyBudget: 140,
      monthlyBudget: 600,
    }));
    setBudgets(defaultBudgets);
    localStorage.setItem('spending_budgets', JSON.stringify(defaultBudgets));
  }, []);

  return { budgets, loading, updateBudget, resetBudgets };
}

/**
 * Hook to get spending summary for a time period
 */
export function useSpendingSummary(period: TimePeriod = TimePeriod.MONTHLY) {
  const { transactions, loading: txLoading } = useSpendingData();
  const [summary, setSummary] = useState<SpendingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (txLoading) return;

    try {
      setLoading(true);
      const summary = getSpendingSummary(transactions, period);
      setSummary(summary);
    } catch (err) {
      console.error('Error calculating summary:', err);
    } finally {
      setLoading(false);
    }
  }, [transactions, period, txLoading]);

  return { summary, loading };
}

/**
 * Hook to get spending by category breakdown
 */
export function useSpendingByCategory() {
  const { transactions, loading } = useSpendingData();
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategorySpending[]>([]);

  useEffect(() => {
    if (loading) return;

    try {
      const byCategory = new Map<SpendingCategory, SpendingTransaction[]>();
      Object.values(SpendingCategory).forEach(cat => {
        byCategory.set(cat, []);
      });

      transactions.forEach(tx => {
        const cat = byCategory.get(tx.category) || [];
        byCategory.set(tx.category, [...cat, tx]);
      });

      const total = calculateTotalSpending(transactions);
      const breakdown = Array.from(byCategory.entries())
        .map(([category, txs]) => {
          const amount = calculateTotalSpending(txs);
          return {
            category,
            amount,
            count: txs.length,
            percentage: total > 0 ? (amount / total) * 100 : 0,
            trend: 0,
            transactions: txs,
          };
        })
        .sort((a, b) => b.amount - a.amount);

      setCategoryBreakdown(breakdown);
    } catch (err) {
      console.error('Error calculating category breakdown:', err);
    }
  }, [transactions, loading]);

  return { categoryBreakdown, loading };
}

/**
 * Hook to get spending trends
 */
export function useSpendingTrends(days: number = 30) {
  const { transactions, loading } = useSpendingData();
  const [trends, setTrends] = useState<SpendingTrend[]>([]);

  useEffect(() => {
    if (loading) return;

    try {
      const trends = calculateSpendingTrend(transactions, days);
      setTrends(trends);
    } catch (err) {
      console.error('Error calculating trends:', err);
    }
  }, [transactions, days, loading]);

  return { trends, loading };
}

/**
 * Hook to get budget comparisons
 */
export function useBudgetComparison(period: TimePeriod = TimePeriod.MONTHLY) {
  const { transactions, loading: txLoading } = useSpendingData();
  const { budgets, loading: budgetLoading } = useSpendingBudgets();
  const [comparisons, setComparisons] = useState<BudgetComparison[]>([]);

  useEffect(() => {
    if (txLoading || budgetLoading) return;

    try {
      const comparisons = compareBudgets(transactions, budgets, period);
      setComparisons(comparisons.sort((a, b) => b.percentageUsed - a.percentageUsed));
    } catch (err) {
      console.error('Error comparing budgets:', err);
    }
  }, [transactions, budgets, period, txLoading, budgetLoading]);

  return { comparisons, loading: txLoading || budgetLoading };
}

/**
 * Hook to get velocity warnings
 */
export function useVelocityWarnings(period: TimePeriod = TimePeriod.MONTHLY) {
  const { transactions, loading: txLoading } = useSpendingData();
  const { budgets, loading: budgetLoading } = useSpendingBudgets();
  const [warnings, setWarnings] = useState<VelocityWarning[]>([]);

  useEffect(() => {
    if (txLoading || budgetLoading) return;

    try {
      const warnings = detectVelocityWarnings(transactions, budgets, period);
      setWarnings(warnings.sort((a, b) => {
        // Sort by severity (critical first) then by percentage used
        const severityOrder = { critical: 0, warning: 1, safe: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.percentageUsed - a.percentageUsed;
      }));
    } catch (err) {
      console.error('Error detecting velocity warnings:', err);
    }
  }, [transactions, budgets, period, txLoading, budgetLoading]);

  return { warnings, loading: txLoading || budgetLoading };
}

/**
 * Hook to get overall spending statistics
 */
export function useSpendingStats() {
  const { transactions, loading } = useSpendingData();
  const [stats, setStats] = useState({
    totalSpent: 0,
    averageTransaction: 0,
    largestTransaction: 0,
    smallestTransaction: 0,
    transactionCount: 0,
    uniqueCategories: 0,
    dailyAverage: 0,
    weeklyAverage: 0,
    monthlyAverage: 0,
  });

  useEffect(() => {
    if (loading || transactions.length === 0) return;

    try {
      const totalSpent = calculateTotalSpending(transactions);
      const amounts = transactions.map(t => t.amountUSD || 0);
      const dailyAvg = calculateDailyAverage(transactions, 1);
      const weeklyAvg = calculateDailyAverage(transactions, 7);
      const monthlyAvg = calculateDailyAverage(transactions, 30);

      const uniqueCategories = new Set(transactions.map(t => t.category)).size;

      setStats({
        totalSpent,
        averageTransaction: amounts.length > 0 ? totalSpent / amounts.length : 0,
        largestTransaction: Math.max(...amounts, 0),
        smallestTransaction: amounts.length > 0 ? Math.min(...amounts, Infinity) : 0,
        transactionCount: transactions.length,
        uniqueCategories,
        dailyAverage: dailyAvg,
        weeklyAverage: weeklyAvg,
        monthlyAverage: monthlyAvg,
      });
    } catch (err) {
      console.error('Error calculating stats:', err);
    }
  }, [transactions, loading]);

  return { stats, loading };
}

/**
 * Hook to get category details
 */
export function useCategoryDetails(category: SpendingCategory) {
  const { transactions, loading } = useSpendingData();
  const { budgets } = useSpendingBudgets();
  const [categoryData, setCategoryData] = useState({
    transactions: [] as SpendingTransaction[],
    totalSpent: 0,
    count: 0,
    average: 0,
    budget: null as CategoryBudget | null,
    info: CATEGORY_INFO[category],
  });

  useEffect(() => {
    if (loading) return;

    try {
      const categoryTxs = transactions.filter(tx => tx.category === category);
      const totalSpent = calculateTotalSpending(categoryTxs);
      const budget = budgets.find(b => b.category === category);

      setCategoryData({
        transactions: categoryTxs,
        totalSpent,
        count: categoryTxs.length,
        average: categoryTxs.length > 0 ? totalSpent / categoryTxs.length : 0,
        budget: budget || null,
        info: CATEGORY_INFO[category],
      });
    } catch (err) {
      console.error('Error getting category details:', err);
    }
  }, [transactions, category, budgets, loading]);

  return { ...categoryData, loading };
}

/**
 * Hook to filter transactions by date range
 */
export function useTransactionsByDateRange(startDate: Date, endDate: Date) {
  const { transactions, loading } = useSpendingData();
  const [filtered, setFiltered] = useState<SpendingTransaction[]>([]);

  useEffect(() => {
    if (loading) return;

    try {
      const filtered = transactions.filter(
        tx => tx.timestamp >= startDate && tx.timestamp <= endDate
      );
      setFiltered(filtered);
    } catch (err) {
      console.error('Error filtering transactions:', err);
    }
  }, [transactions, startDate, endDate, loading]);

  return { transactions: filtered, loading };
}

/**
 * Hook to get spending progress towards budget
 */
export function useSpendingProgress(category: SpendingCategory, period: TimePeriod) {
  const { categoryData, loading } = useCategoryDetails(category);
  const { comparisons } = useBudgetComparison(period);

  const comparison = comparisons.find(c => c.category === category);

  return {
    budget: categoryData.budget,
    spent: categoryData.totalSpent,
    remaining: comparison?.remaining || 0,
    percentage: comparison?.percentageUsed || 0,
    status: comparison?.status || 'safe',
    loading,
  };
}
