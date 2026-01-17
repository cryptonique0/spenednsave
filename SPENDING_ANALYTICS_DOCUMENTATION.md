# Spending Analytics & Dashboard - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Core Library](#core-library)
4. [React Hooks](#react-hooks)
5. [UI Components](#ui-components)
6. [Category Management](#category-management)
7. [Budget Tracking](#budget-tracking)
8. [Velocity Warnings](#velocity-warnings)
9. [Usage Examples](#usage-examples)
10. [API Reference](#api-reference)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The Spending Analytics system provides comprehensive spending tracking, analysis, and budget management capabilities for SpendGuard. It allows users to:

- **Track spending** across 12 customizable categories
- **Visualize patterns** with category breakdowns and trends
- **Monitor budgets** with real-time comparisons
- **Receive warnings** when spending exceeds limits
- **Analyze trends** with historical data and moving averages

### Key Statistics Provided

- Total spending amount
- Daily/weekly/monthly averages
- Largest and smallest transactions
- Category breakdown by percentage
- Budget utilization percentages
- Spending velocity (rate of spending)
- Trend analysis with 7-day and 30-day moving averages

---

## Features

### 📊 Spending Analytics Dashboard

The main dashboard provides an at-a-glance view of your spending:

- **Key Statistics Cards** - Total spent, daily average, largest transaction, categories used
- **Alert Section** - Highlighted warnings for budget overruns
- **Category Breakdown** - Pie/donut chart showing spending distribution
- **Spending Trends** - Line chart with historical data and moving averages
- **Velocity Warnings** - Detailed alerts with severity levels
- **Budget Comparison** - Side-by-side budget vs actual spending

### 🏷️ 12 Spending Categories

Pre-configured categories with customizable budgets:

1. **Rent & Housing** 🏠 - Rent, mortgage, property expenses
2. **Food & Dining** 🍔 - Groceries, restaurants, delivery
3. **Utilities** ⚡ - Electricity, water, internet, phone
4. **Transportation** 🚗 - Gas, transit, car maintenance
5. **Entertainment** 🎬 - Movies, games, streaming, events
6. **Healthcare** 🏥 - Medical, pharmacy, insurance
7. **Shopping** 🛍️ - Clothing, home goods, retail
8. **Education** 📚 - Tuition, courses, books
9. **Savings** 💰 - Savings transfers, deposits
10. **Investment** 📈 - Stock, crypto, bonds
11. **Business** 💼 - Business expenses, supplies
12. **Other** 📌 - Miscellaneous expenses

### 📈 Time Period Analysis

Analyze spending across different time periods:

- **Daily** - Day-by-day spending breakdown
- **Weekly** - 7-day summary with weekly budgets
- **Monthly** - Month-by-month analysis with monthly budgets
- **Custom Ranges** - Filter by date range

### ⚠️ Severity Levels

Spending warnings have three severity levels:

- **SAFE** (Green) - Spending is within budget
- **WARNING** (Orange) - Spending exceeds 75% of budget
- **CRITICAL** (Red) - Spending exceeds 100% of budget

---

## Core Library

### File Location

`lib/spending-analytics.ts` (550+ lines)

### Main Types

```typescript
// Categories
enum SpendingCategory {
  RENT = 'rent',
  FOOD = 'food',
  UTILITIES = 'utilities',
  TRANSPORTATION = 'transportation',
  // ... 8 more categories
}

// Transactions
interface SpendingTransaction {
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

// Budgets
interface CategoryBudget {
  category: SpendingCategory;
  dailyBudget: number;         // In USD
  weeklyBudget: number;
  monthlyBudget: number;
}

// Analysis Results
interface CategorySpending {
  category: SpendingCategory;
  amount: number;              // In USD
  count: number;               // Transaction count
  percentage: number;          // % of total
  trend: number;               // % change vs previous period
  transactions: SpendingTransaction[];
}

interface SpendingSummary {
  period: TimePeriod;
  startDate: Date;
  endDate: Date;
  totalSpent: number;
  categoryBreakdown: CategorySpending[];
  avgDailySpend: number;
  maxDaySpend: number;
  minDaySpend: number;
  transactionCount: number;
}

interface VelocityWarning {
  id: string;
  category: SpendingCategory;
  period: TimePeriod;
  severity: VelocitySeverity;
  currentAmount: number;
  budgetAmount: number;
  percentageUsed: number;
  projectedTotal: number;
  daysRemaining: number;
  message: string;
  recommendation: string;
  timestamp: Date;
}

interface BudgetComparison {
  category: SpendingCategory;
  period: TimePeriod;
  budgetAmount: number;
  actualAmount: number;
  remaining: number;
  percentageUsed: number;
  status: 'safe' | 'warning' | 'exceeded';
  projectedOverage?: number;
}
```

### Key Functions

#### Calculation Functions

```typescript
// Calculate total spending
calculateTotalSpending(transactions: SpendingTransaction[]): number

// Calculate daily average
calculateDailyAverage(transactions: SpendingTransaction[], days?: number): number

// Calculate spending trends
calculateSpendingTrend(transactions: SpendingTransaction[], days?: number): SpendingTrend[]

// Detect velocity warnings
detectVelocityWarnings(
  transactions: SpendingTransaction[],
  budgets: CategoryBudget[],
  period?: TimePeriod
): VelocityWarning[]

// Compare budgets
compareBudgets(
  transactions: SpendingTransaction[],
  budgets: CategoryBudget[],
  period?: TimePeriod
): BudgetComparison[]

// Get spending summary
getSpendingSummary(
  transactions: SpendingTransaction[],
  period: TimePeriod,
  endDate?: Date
): SpendingSummary
```

#### Utility Functions

```typescript
// Format USD amounts
formatUSD(amount: number): string
// Example: 1234.56 → "$1,234.56"

// Format percentages
formatPercentage(percentage: number): string
// Example: 75.5 → "75.5%"

// Get category info
getCategoryInfo(category: SpendingCategory): CategoryMetadata

// Get status color
getStatusColor(percentageUsed: number): string

// Get severity color
getSeverityColor(severity: VelocitySeverity): string
```

---

## React Hooks

### File Location

`lib/hooks/useSpendingAnalytics.ts` (450+ lines)

### Available Hooks

#### 1. useSpendingData()

Manages spending transactions with localStorage persistence.

```typescript
const {
  transactions,           // Array of SpendingTransaction
  loading,               // boolean
  error,                 // string | null
  addTransaction,        // (tx: TransactionData) => SpendingTransaction
  deleteTransaction,     // (id: string) => void
  clearAllTransactions   // () => void
} = useSpendingData();

// Add a transaction
const newTx = addTransaction({
  amount: BigInt('1000000000000000000'), // 1 token in wei
  amountUSD: 1234.56,
  category: SpendingCategory.FOOD,
  description: 'Grocery shopping',
  token: 'USDC'
});
```

#### 2. useSpendingBudgets()

Manages category budgets with defaults.

```typescript
const {
  budgets,              // Array of CategoryBudget
  loading,              // boolean
  updateBudget,         // (category, updates) => void
  resetBudgets          // () => void
} = useSpendingBudgets();

// Update a budget
updateBudget(SpendingCategory.FOOD, {
  dailyBudget: 35,
  weeklyBudget: 245,
  monthlyBudget: 1050
});
```

#### 3. useSpendingSummary(period)

Gets spending summary for a time period.

```typescript
const {
  summary,  // SpendingSummary | null
  loading   // boolean
} = useSpendingSummary(TimePeriod.MONTHLY);

// Access summary data
if (summary) {
  console.log('Total spent:', summary.totalSpent);
  console.log('Daily average:', summary.avgDailySpend);
  console.log('Category breakdown:', summary.categoryBreakdown);
}
```

#### 4. useSpendingByCategory()

Gets category-wise spending breakdown.

```typescript
const {
  categoryBreakdown,  // Array of CategorySpending (sorted by amount)
  loading            // boolean
} = useSpendingByCategory();

// Access breakdown
categoryBreakdown.forEach(cat => {
  console.log(`${cat.category}: ${cat.amount} (${cat.percentage}%)`);
});
```

#### 5. useSpendingTrends(days)

Gets historical spending trends.

```typescript
const {
  trends,   // Array of SpendingTrend
  loading   // boolean
} = useSpendingTrends(30); // Last 30 days

// Access trend data
trends.forEach(trend => {
  console.log(`${trend.date}: ${trend.amount}`);
  console.log(`  7-day avg: ${trend.movingAverage7}`);
  console.log(`  30-day avg: ${trend.movingAverage30}`);
});
```

#### 6. useBudgetComparison(period)

Compares actual spending vs budgets.

```typescript
const {
  comparisons,  // Array of BudgetComparison
  loading       // boolean
} = useBudgetComparison(TimePeriod.MONTHLY);

// Access comparisons
comparisons.forEach(comp => {
  console.log(`${comp.category}:`);
  console.log(`  Budget: ${comp.budgetAmount}`);
  console.log(`  Actual: ${comp.actualAmount}`);
  console.log(`  Status: ${comp.status}`);
});
```

#### 7. useVelocityWarnings(period)

Gets velocity warnings for overspending.

```typescript
const {
  warnings,  // Array of VelocityWarning
  loading    // boolean
} = useVelocityWarnings(TimePeriod.MONTHLY);

// Handle warnings
warnings.forEach(warning => {
  console.log(`⚠️ ${warning.message}`);
  console.log(`   Spent: ${warning.currentAmount}/${warning.budgetAmount}`);
  console.log(`   Status: ${warning.severity}`);
  console.log(`   💡 ${warning.recommendation}`);
});
```

#### 8. useSpendingStats()

Gets overall spending statistics.

```typescript
const {
  stats,  // Spending statistics
  loading // boolean
} = useSpendingStats();

// Access stats
console.log({
  totalSpent: stats.totalSpent,
  averageTransaction: stats.averageTransaction,
  largestTransaction: stats.largestTransaction,
  transactionCount: stats.transactionCount,
  uniqueCategories: stats.uniqueCategories,
  dailyAverage: stats.dailyAverage,
  weeklyAverage: stats.weeklyAverage,
  monthlyAverage: stats.monthlyAverage
});
```

#### 9. useCategoryDetails(category)

Gets detailed information about a specific category.

```typescript
const {
  transactions,   // Category transactions
  totalSpent,     // Category total
  count,          // Transaction count
  average,        // Average per transaction
  budget,         // CategoryBudget | null
  info,           // Category metadata
  loading         // boolean
} = useCategoryDetails(SpendingCategory.FOOD);
```

#### 10. useTransactionsByDateRange(startDate, endDate)

Filters transactions by date range.

```typescript
const {
  transactions,  // Filtered transactions
  loading        // boolean
} = useTransactionsByDateRange(
  new Date('2024-01-01'),
  new Date('2024-01-31')
);
```

#### 11. useSpendingProgress(category, period)

Gets budget progress for a specific category.

```typescript
const {
  budget,    // CategoryBudget | null
  spent,     // Amount spent
  remaining, // Budget remaining
  percentage,// Percentage used
  status,    // 'safe' | 'warning' | 'exceeded'
  loading    // boolean
} = useSpendingProgress(SpendingCategory.FOOD, TimePeriod.MONTHLY);
```

---

## UI Components

### File Locations

All components are in `components/analytics/`

#### 1. SpendingAnalyticsDashboard

Main dashboard component that brings together all analytics.

```typescript
import SpendingAnalyticsDashboard from '@/components/analytics/spending-analytics-dashboard';

export default function AnalyticsPage() {
  return <SpendingAnalyticsDashboard />;
}
```

**Features:**
- Key statistics cards
- Period selector (Daily, Weekly, Monthly)
- Alert section for warnings
- Responsive grid layout
- Integration of all sub-components

#### 2. SpendingByCategory

Category breakdown with expandable transactions.

```typescript
import SpendingByCategory from '@/components/analytics/spending-by-category';

export default function CategoryAnalysis() {
  return <SpendingByCategory />;
}
```

**Features:**
- Category list with amounts and percentages
- Progress bars for visual representation
- Expandable transaction details
- Collapsible "Other Categories" section
- Icon and color coding per category

#### 3. SpendingTrends

Historical spending trends with moving averages.

```typescript
import SpendingTrends from '@/components/analytics/spending-trends';

export default function TrendsView() {
  return <SpendingTrends days={30} />;
}
```

**Properties:**
- `days?: number` (default: 30) - Number of days to display

**Features:**
- Bar chart visualization
- Max, min, and average statistics
- 7-day and 30-day moving averages
- Trend analysis messages
- Responsive design

#### 4. VelocityAlerts (velocity-warnings)

Spending velocity warnings with severity levels.

```typescript
import VelocityAlerts from '@/components/analytics/velocity-warnings';

export default function WarningsView() {
  return <VelocityAlerts period={TimePeriod.MONTHLY} />;
}
```

**Properties:**
- `period?: TimePeriod` (default: MONTHLY) - Analysis period

**Features:**
- Severity-based color coding
- Budget progress bars
- Projected overage calculations
- Days remaining tracking
- Actionable recommendations

#### 5. BudgetComparison

Budget vs actual spending comparison.

```typescript
import BudgetComparison from '@/components/analytics/budget-comparison';

export default function BudgetView() {
  return <BudgetComparison period={TimePeriod.MONTHLY} />;
}
```

**Properties:**
- `period?: TimePeriod` (default: MONTHLY) - Analysis period

**Features:**
- Expandable category cards
- Status indicators (safe, warning, exceeded)
- Budget breakdown grids
- Recommendations based on status
- Categories without budget section

---

## Category Management

### Adding Custom Categories

While the system comes with 12 pre-configured categories, the architecture supports adding more:

```typescript
// In lib/spending-analytics.ts
enum SpendingCategory {
  // ... existing categories
  CUSTOM_CATEGORY = 'custom_category',
}

// Add metadata
const CATEGORY_INFO = {
  // ... existing entries
  [SpendingCategory.CUSTOM_CATEGORY]: {
    label: 'Custom Category',
    description: 'Your custom category',
    icon: '🎯',
    color: '#your-color',
    bgColor: 'bg-your-color-100 dark:bg-your-color-500/10',
  },
};
```

### Category Metadata

Each category includes:

- **label** - Display name
- **description** - What goes in this category
- **icon** - Emoji icon
- **color** - Hex color code for charts
- **bgColor** - Tailwind classes for background

---

## Budget Tracking

### Default Budgets

The system initializes with sensible default budgets:

```typescript
{
  category: SpendingCategory.FOOD,
  dailyBudget: 30,        // $30 per day
  weeklyBudget: 210,      // $210 per week
  monthlyBudget: 900      // $900 per month
}
```

### Updating Budgets

```typescript
// Using the hook
const { updateBudget } = useSpendingBudgets();

updateBudget(SpendingCategory.FOOD, {
  dailyBudget: 35,
  weeklyBudget: 245,
  monthlyBudget: 1050
});

// Reset to defaults
resetBudgets();
```

### Budget Calculations

Budgets are compared against actual spending:

```
Percentage Used = (Actual Spending / Budget) * 100%
Remaining = Budget - Actual Spending
Status = 
  - 'safe' if Percentage Used <= 75%
  - 'warning' if 75% < Percentage Used <= 100%
  - 'exceeded' if Percentage Used > 100%
```

---

## Velocity Warnings

### Understanding Velocity Warnings

Velocity warnings alert you when spending rate indicates you might exceed your budget:

```
Daily Rate = Current Spending / Days Elapsed
Projected Total = Daily Rate * Days in Period
Overage = Max(0, Projected Total - Budget)
```

### Warning Severity

| Severity | Condition | Color | Action |
|----------|-----------|-------|--------|
| SAFE | <= 75% of budget | Green | Keep monitoring |
| WARNING | 75% - 100% of budget | Orange | Reduce spending |
| CRITICAL | > 100% of budget | Red | Immediate action |

### Example Warning Message

```
Category: Food & Dining
Severity: CRITICAL
Message: Food & Dining budget exceeded! You've spent $950 of $900
Spent: $950 / Budget: $900 (105.6%)
Projected Total: $1,050 (for the month)
Days Remaining: 15
Recommendation: Consider reducing Food & Dining spending immediately
```

---

## Usage Examples

### Example 1: Display Current Month Spending

```typescript
'use client';

import { useSpendingData, useSpendingSummary } from '@/lib/hooks/useSpendingAnalytics';
import { TimePeriod, formatUSD } from '@/lib/spending-analytics';

export function MonthlySpendingCard() {
  const { summary, loading } = useSpendingSummary(TimePeriod.MONTHLY);

  if (loading) return <div>Loading...</div>;
  if (!summary) return <div>No data</div>;

  return (
    <div>
      <h2>This Month</h2>
      <p>Total Spent: {formatUSD(summary.totalSpent)}</p>
      <p>Daily Average: {formatUSD(summary.avgDailySpend)}</p>
      <p>Transactions: {summary.transactionCount}</p>
    </div>
  );
}
```

### Example 2: Add Transaction with Category

```typescript
'use client';

import { useSpendingData } from '@/lib/hooks/useSpendingAnalytics';
import { SpendingCategory } from '@/lib/spending-analytics';

export function AddTransaction() {
  const { addTransaction } = useSpendingData();

  const handleAdd = () => {
    const tx = addTransaction({
      amount: BigInt('1000000000000000000'), // 1 token
      amountUSD: 100,
      category: SpendingCategory.FOOD,
      description: 'Dinner at restaurant',
      token: 'USDC'
    });
    console.log('Added:', tx);
  };

  return <button onClick={handleAdd}>Add Transaction</button>;
}
```

### Example 3: Display Warnings

```typescript
'use client';

import { useVelocityWarnings } from '@/lib/hooks/useSpendingAnalytics';
import { TimePeriod, VelocitySeverity } from '@/lib/spending-analytics';

export function WarningsList() {
  const { warnings, loading } = useVelocityWarnings(TimePeriod.MONTHLY);

  if (loading) return <div>Loading...</div>;

  const criticalWarnings = warnings.filter(w => w.severity === VelocitySeverity.CRITICAL);

  return (
    <div>
      {criticalWarnings.length > 0 && (
        <div className="bg-red-100 p-4">
          ⚠️ {criticalWarnings.length} critical warnings!
          {criticalWarnings.map(w => (
            <p key={w.id}>{w.message}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Example 4: Category Budget Progress

```typescript
'use client';

import { useSpendingProgress } from '@/lib/hooks/useSpendingAnalytics';
import { SpendingCategory, TimePeriod, formatUSD } from '@/lib/spending-analytics';

export function BudgetProgressBar() {
  const { budget, spent, remaining, percentage, status } = useSpendingProgress(
    SpendingCategory.FOOD,
    TimePeriod.MONTHLY
  );

  if (!budget) return <div>No budget set</div>;

  return (
    <div>
      <h3>Food & Dining</h3>
      <p>{formatUSD(spent)} of {formatUSD(budget.monthlyBudget)}</p>
      <progress value={percentage} max="100" />
      <p className={status === 'exceeded' ? 'text-red-600' : 'text-green-600'}>
        {percentage.toFixed(1)}% - Status: {status}
      </p>
    </div>
  );
}
```

---

## API Reference

### Core Functions

#### formatUSD(amount: number): string

Formats a number as USD currency.

```typescript
formatUSD(1234.56) // "$1,234.56"
formatUSD(0) // "$0.00"
```

#### formatPercentage(percentage: number): string

Formats a number as a percentage.

```typescript
formatPercentage(75.5) // "75.5%"
formatPercentage(100) // "100.0%"
```

#### getCategoryInfo(category: SpendingCategory)

Gets metadata for a category.

```typescript
const info = getCategoryInfo(SpendingCategory.FOOD);
// { label: 'Food & Dining', icon: '🍔', color: '#f97316', ... }
```

#### getStatusColor(percentageUsed: number): string

Returns hex color based on budget usage.

```typescript
getStatusColor(50) // "#10b981" (green)
getStatusColor(80) // "#f97316" (orange)
getStatusColor(110) // "#ef4444" (red)
```

#### calculateTotalSpending(transactions: SpendingTransaction[]): number

Sums all transaction amounts.

```typescript
const total = calculateTotalSpending(transactions);
// Returns sum in USD
```

#### calculateDailyAverage(transactions: SpendingTransaction[], days?: number): number

Calculates average daily spending.

```typescript
const avg = calculateDailyAverage(transactions, 30);
// Returns average amount per day
```

---

## Best Practices

### 1. Regular Budget Review

Review and adjust budgets monthly based on actual spending patterns:

```typescript
const { comparisons } = useBudgetComparison(TimePeriod.MONTHLY);

// Find categories consistently exceeding budget
const overBudget = comparisons.filter(c => c.status === 'exceeded');

// Adjust budgets for these categories
overBudget.forEach(cat => {
  // Increase budget or identify spending issues
});
```

### 2. Act on Warnings

Don't ignore velocity warnings:

```typescript
const { warnings } = useVelocityWarnings(TimePeriod.MONTHLY);

const criticalWarnings = warnings.filter(w => w.severity === VelocitySeverity.CRITICAL);

if (criticalWarnings.length > 0) {
  // Show prominent alerts
  // Send notifications
  // Restrict further spending
}
```

### 3. Categorize Transactions Accurately

Accurate categorization makes analytics valuable:

- Don't use "Other" - find the right category
- Be consistent - same types of spending in same category
- Split transactions if they span categories

### 4. Set Realistic Budgets

Base budgets on historical spending:

```typescript
const { stats } = useSpendingStats();

// Set budget to 10% above average
const recommendedBudget = stats.monthlyAverage * 1.1;
```

### 5. Monitor Trends

Use trends to identify behavioral patterns:

```typescript
const { trends } = useSpendingTrends(90); // 3 months

// Check if spending is trending up
const lastWeek = trends.slice(-7);
const avgLastWeek = lastWeek.reduce((s, t) => s + t.amount, 0) / 7;
```

### 6. Regular Data Maintenance

Keep data clean for accurate analysis:

```typescript
// Delete duplicate or incorrect transactions
const { deleteTransaction } = useSpendingData();
deleteTransaction(incorrectTxId);

// Review old data periodically
const { clearAllTransactions } = useSpendingData();
// Only clear when migrating or starting fresh
```

---

## Troubleshooting

### Issue: Data Not Persisting

**Problem:** Transactions disappear after page reload

**Solution:**
```typescript
// Check localStorage is enabled
if (typeof window !== 'undefined' && localStorage) {
  console.log(localStorage.getItem('spending_transactions'));
}

// Clear and reinitialize
localStorage.removeItem('spending_transactions');
localStorage.removeItem('spending_budgets');
```

### Issue: Incorrect USD Amounts

**Problem:** USD amounts not showing correctly

**Solution:**
```typescript
// Ensure amountUSD is provided when adding transaction
const tx = addTransaction({
  amount: BigInt('1000000000000000000'),
  amountUSD: 100,  // Required for USD calculations
  category: SpendingCategory.FOOD,
  description: 'Test',
  token: 'USDC'
});
```

### Issue: Budget Calculations Wrong

**Problem:** Percentages and comparisons seem off

**Solution:**
```typescript
// Verify budget exists and is set correctly
const { budgets } = useSpendingBudgets();
const budget = budgets.find(b => b.category === SpendingCategory.FOOD);
console.log('Budget:', budget);

// Ensure you're using correct period
// Daily uses dailyBudget, Weekly uses weeklyBudget, etc.
```

### Issue: Performance with Large Datasets

**Problem:** Slow rendering with many transactions

**Solution:**
```typescript
// Limit date range
const { transactions } = useTransactionsByDateRange(
  new Date('2024-01-01'),
  new Date('2024-01-31')  // Don't load years of data
);

// Archive old transactions
const oldTxs = transactions.filter(t => t.timestamp < archiveDate);
// Store separately or export
```

### Issue: Categories Not Showing

**Problem:** Custom categories don't appear in dropdowns

**Solution:**
```typescript
// Ensure category is added to enum AND metadata
// Check:
// 1. Enum has the category
// 2. CATEGORY_INFO has an entry for that category
// 3. Type matches exactly (case-sensitive)

// Verify with:
const info = CATEGORY_INFO[SpendingCategory.YOUR_CATEGORY];
console.log(info); // Should not be undefined
```

---

## Summary

The Spending Analytics system provides powerful spending insights while remaining simple to use. Start with tracking transactions in the main categories, set realistic budgets, and adjust as you learn your spending patterns.

For questions or issues, refer to the [SPENDING_ANALYTICS_QUICKREF.md](./SPENDING_ANALYTICS_QUICKREF.md) for quick answers.
