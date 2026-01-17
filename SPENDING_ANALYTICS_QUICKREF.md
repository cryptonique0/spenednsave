# Spending Analytics - Quick Reference Guide

## Quick Start (2 Minutes)

### Access Analytics
1. Navigate to `/analytics` page
2. Click "Spending Analytics" tab
3. Add your first transaction

### Add a Transaction
```typescript
const { addTransaction } = useSpendingData();

addTransaction({
  amount: BigInt('1000000000000000000'),
  amountUSD: 100,
  category: SpendingCategory.FOOD,
  description: 'Grocery shopping',
  token: 'USDC'
});
```

### Set a Budget
```typescript
const { updateBudget } = useSpendingBudgets();

updateBudget(SpendingCategory.FOOD, {
  dailyBudget: 35,
  weeklyBudget: 245,
  monthlyBudget: 1050
});
```

### View Analytics
- **Dashboard**: `/analytics` → "Spending Analytics" tab
- **Overview Cards**: Total spent, daily average, largest transaction
- **Charts**: Category breakdown, spending trends
- **Warnings**: Budget overruns with recommendations

---

## Hook Reference

### Getting Data

| Hook | Purpose | Returns |
|------|---------|---------|
| `useSpendingData()` | All transactions | `transactions`, `addTransaction()`, `deleteTransaction()` |
| `useSpendingBudgets()` | Budget settings | `budgets`, `updateBudget()`, `resetBudgets()` |
| `useSpendingStats()` | Overall statistics | `stats` with totals and averages |
| `useSpendingByCategory()` | Category breakdown | `categoryBreakdown` sorted by amount |
| `useSpendingTrends(days)` | Historical trends | `trends` with moving averages |
| `useSpendingSummary(period)` | Period summary | `summary` with detailed breakdown |

### Analysis & Alerts

| Hook | Purpose | Returns |
|------|---------|---------|
| `useBudgetComparison(period)` | Budget vs actual | `comparisons` with status |
| `useVelocityWarnings(period)` | Overspending alerts | `warnings` with severity |
| `useSpendingProgress(category, period)` | Category progress | `percentage`, `status`, `remaining` |
| `useCategoryDetails(category)` | Category data | Transactions, totals, budget |

---

## Categories at a Glance

| Category | Icon | Typical Items |
|----------|------|---|
| Rent & Housing | 🏠 | Rent, mortgage, repairs |
| Food & Dining | 🍔 | Groceries, restaurants |
| Utilities | ⚡ | Electric, water, internet |
| Transportation | 🚗 | Gas, transit, maintenance |
| Entertainment | 🎬 | Movies, games, events |
| Healthcare | 🏥 | Doctor, pharmacy, insurance |
| Shopping | 🛍️ | Clothing, home goods |
| Education | 📚 | Tuition, courses, books |
| Savings | 💰 | Emergency fund, deposits |
| Investment | 📈 | Stocks, crypto, bonds |
| Business | 💼 | Supplies, expenses |
| Other | 📌 | Miscellaneous |

---

## Components at a Glance

| Component | Purpose | Features |
|-----------|---------|----------|
| `SpendingAnalyticsDashboard` | Main view | Stats cards, alerts, all components |
| `SpendingByCategory` | Category breakdown | Pie chart, transaction list |
| `SpendingTrends` | Historical chart | 30-day view, moving averages |
| `VelocityAlerts` | Budget warnings | Severity levels, recommendations |
| `BudgetComparison` | Budget tracking | Expandable category cards |

---

## Format Functions

### Currency
```typescript
formatUSD(1234.56)     // "$1,234.56"
formatUSD(0)           // "$0.00"
formatUSD(1000000)     // "$1,000,000.00"
```

### Percentage
```typescript
formatPercentage(75.5)  // "75.5%"
formatPercentage(100)   // "100.0%"
formatPercentage(0)     // "0.0%"
```

---

## Budget Thresholds

| Status | Condition | Color | Action |
|--------|-----------|-------|--------|
| ✅ SAFE | 0-75% | Green | Continue normally |
| ⚠️ WARNING | 75-100% | Orange | Reduce spending |
| 🛑 CRITICAL | 100%+ | Red | Take action now |

---

## Common Tasks

### Display Total Monthly Spending
```typescript
const { summary } = useSpendingSummary(TimePeriod.MONTHLY);
console.log(summary?.totalSpent);
```

### Get Top Spending Category
```typescript
const { categoryBreakdown } = useSpendingByCategory();
const top = categoryBreakdown[0]; // Already sorted by amount
```

### Check if Budget Exceeded
```typescript
const { comparisons } = useBudgetComparison();
const exceeded = comparisons.filter(c => c.status === 'exceeded');
```

### Get Budget Alert Count
```typescript
const { warnings } = useVelocityWarnings();
console.log(`${warnings.length} warnings`);
```

### Reset All Data
```typescript
const { clearAllTransactions } = useSpendingData();
const { resetBudgets } = useSpendingBudgets();
clearAllTransactions();
resetBudgets();
```

---

## Types Quick Reference

```typescript
// Main types
type SpendingTransaction = { id, amount, amountUSD, category, ... }
type CategoryBudget = { category, dailyBudget, weeklyBudget, monthlyBudget }
type SpendingSummary = { period, totalSpent, categoryBreakdown, ... }
type VelocityWarning = { severity, currentAmount, budgetAmount, ... }
type BudgetComparison = { category, budgetAmount, actualAmount, status }

// Enums
enum SpendingCategory { RENT, FOOD, ... }
enum TimePeriod { DAILY, WEEKLY, MONTHLY, YEARLY }
enum VelocitySeverity { SAFE, WARNING, CRITICAL }
```

---

## Import Examples

### From Main Library
```typescript
import {
  SpendingCategory,
  TimePeriod,
  VelocitySeverity,
  formatUSD,
  formatPercentage,
  calculateTotalSpending,
  CATEGORY_INFO
} from '@/lib/spending-analytics';
```

### From Hooks
```typescript
import {
  useSpendingData,
  useSpendingBudgets,
  useSpendingSummary,
  useSpendingByCategory,
  useSpendingTrends,
  useBudgetComparison,
  useVelocityWarnings,
  useSpendingStats,
  useCategoryDetails
} from '@/lib/hooks/useSpendingAnalytics';
```

### From Components
```typescript
import SpendingAnalyticsDashboard from '@/components/analytics/spending-analytics-dashboard';
import SpendingByCategory from '@/components/analytics/spending-by-category';
import SpendingTrends from '@/components/analytics/spending-trends';
import VelocityAlerts from '@/components/analytics/velocity-warnings';
import BudgetComparison from '@/components/analytics/budget-comparison';
```

---

## File Locations

```
lib/
├── spending-analytics.ts          # Core library (550+ lines)
└── hooks/
    └── useSpendingAnalytics.ts   # React hooks (450+ lines)

components/
└── analytics/
    ├── spending-analytics-dashboard.tsx   # Main dashboard
    ├── spending-by-category.tsx           # Category breakdown
    ├── spending-trends.tsx                # Trends chart
    ├── velocity-warnings.tsx              # Budget alerts
    └── budget-comparison.tsx              # Budget tracking

app/
└── analytics/
    └── page.tsx                   # Analytics page with tabs

SPENDING_ANALYTICS_DOCUMENTATION.md  # Full documentation
SPENDING_ANALYTICS_QUICKREF.md      # This file
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Data not saving | Check localStorage enabled: `typeof localStorage !== 'undefined'` |
| Wrong amounts | Ensure `amountUSD` provided when adding transactions |
| Budget mismatch | Verify correct period (daily/weekly/monthly) used |
| Categories missing | Check CATEGORY_INFO includes category metadata |
| Slow performance | Limit date range: `useTransactionsByDateRange(start, end)` |
| No warnings | Add transactions and budgets first |

---

## Tips & Tricks

✅ **Set realistic budgets** - Base on your average spending
✅ **Review trends** - Look for seasonal patterns
✅ **Act on warnings** - Don't ignore CRITICAL alerts
✅ **Categorize accurately** - Consistent categorization = better insights
✅ **Check daily** - Monitor spending before it becomes a problem
✅ **Export data** - Keep backups of important data
❌ **Don't ignore patterns** - Trends reveal behavioral changes
❌ **Don't set arbitrary budgets** - Base on real data

---

## Performance Notes

- Transactions stored in localStorage (browser-based)
- Auto-calculates on data change
- Memoized components prevent unnecessary renders
- 30-day trends recommended for responsiveness
- 100+ transactions may show minor delays in calculations

---

## Data Persistence

All data stored in localStorage:
- `spending_transactions` - Transaction array
- `spending_budgets` - Budget settings

To backup:
```typescript
const txs = localStorage.getItem('spending_transactions');
const budgets = localStorage.getItem('spending_budgets');
// Save to file or cloud storage
```

To restore:
```typescript
localStorage.setItem('spending_transactions', savedTxs);
localStorage.setItem('spending_budgets', savedBudgets);
// Page will auto-load data
```

---

## Need Help?

1. Check **SPENDING_ANALYTICS_DOCUMENTATION.md** for detailed explanations
2. Review **Usage Examples** section in full documentation
3. Look at component source code for implementation details
4. Check console for error messages: `F12 → Console`

---

**Last Updated**: 2024 | Version: 1.0.0
