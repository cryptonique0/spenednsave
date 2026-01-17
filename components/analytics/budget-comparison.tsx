'use client';

import React, { useState } from 'react';
import { useBudgetComparison } from '@/lib/hooks/useSpendingAnalytics';
import { CATEGORY_INFO, TimePeriod, formatUSD } from '@/lib/spending-analytics';
import { ChevronDown } from 'lucide-react';

interface BudgetComparisonProps {
  period?: TimePeriod;
}

export default function BudgetComparison({ period = TimePeriod.MONTHLY }: BudgetComparisonProps) {
  const { comparisons, loading } = useBudgetComparison(period);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          💰 Budget Comparison
        </h2>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const withBudget = comparisons.filter(c => c.budgetAmount > 0);
  const noBudget = comparisons.filter(c => c.budgetAmount === 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          💰 Budget Comparison
        </h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {period.charAt(0).toUpperCase() + period.slice(1)}
        </span>
      </div>

      {withBudget.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No budget data available. Set up budgets in settings to track spending.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {withBudget.map(comparison => {
            const categoryInfo = CATEGORY_INFO[comparison.category];
            const isExceeded = comparison.status === 'exceeded';
            const isWarning = comparison.status === 'warning';
            const isSafe = comparison.status === 'safe';

            const statusColor = isExceeded
              ? 'from-red-500 to-red-600'
              : isWarning
              ? 'from-orange-500 to-orange-600'
              : 'from-emerald-500 to-emerald-600';

            const bgColor = isExceeded
              ? 'bg-red-50 dark:bg-red-500/5'
              : isWarning
              ? 'bg-orange-50 dark:bg-orange-500/5'
              : 'bg-emerald-50 dark:bg-emerald-500/5';

            const borderColor = isExceeded
              ? 'border-red-200 dark:border-red-500/20'
              : isWarning
              ? 'border-orange-200 dark:border-orange-500/20'
              : 'border-emerald-200 dark:border-emerald-500/20';

            const textColor = isExceeded
              ? 'text-red-900 dark:text-red-300'
              : isWarning
              ? 'text-orange-900 dark:text-orange-300'
              : 'text-emerald-900 dark:text-emerald-300';

            const isExpanded = expandedCategory === comparison.category;

            return (
              <div key={comparison.category} className={`${bgColor} border ${borderColor} rounded-lg overflow-hidden`}>
                {/* Main Row */}
                <button
                  onClick={() =>
                    setExpandedCategory(isExpanded ? null : comparison.category)
                  }
                  className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <span className="text-xl">{categoryInfo.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {categoryInfo.label}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formatUSD(comparison.actualAmount)} of {formatUSD(comparison.budgetAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right mr-2">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {comparison.percentageUsed.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {formatUSD(comparison.remaining)}
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Progress Bar */}
                <div className="px-4 pb-2">
                  <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${statusColor} transition-all`}
                      style={{
                        width: `${Math.min(comparison.percentageUsed, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className={`px-4 pb-4 border-t ${borderColor} space-y-3 pt-3`}>
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isExceeded
                            ? 'bg-red-200 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                            : isWarning
                            ? 'bg-orange-200 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300'
                            : 'bg-emerald-200 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {comparison.status.toUpperCase()}
                      </span>
                      {isExceeded && (
                        <span className="text-sm text-red-700 dark:text-red-300">
                          Over budget by {formatUSD(comparison.projectedOverage || 0)}
                        </span>
                      )}
                    </div>

                    {/* Breakdown Grid */}
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="bg-white dark:bg-gray-700 p-2 rounded">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Budget
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatUSD(comparison.budgetAmount)}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 p-2 rounded">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Actual Spent
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatUSD(comparison.actualAmount)}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 p-2 rounded">
                        <p className={`text-xs mb-1 ${textColor}`}>
                          {comparison.remaining >= 0 ? 'Remaining' : 'Over'}
                        </p>
                        <p
                          className={`font-semibold ${
                            comparison.remaining >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {formatUSD(Math.abs(comparison.remaining))}
                        </p>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div
                      className={`p-3 rounded text-xs ${
                        isExceeded
                          ? 'bg-red-100 dark:bg-red-500/10 text-red-800 dark:text-red-200'
                          : isWarning
                          ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-800 dark:text-orange-200'
                          : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                      }`}
                    >
                      {isExceeded && (
                        <>
                          <strong>⚠️ Budget Exceeded</strong> - You've exceeded your budget for this
                          category. Consider reviewing your transactions or adjusting your budget.
                        </>
                      )}
                      {isWarning && (
                        <>
                          <strong>⚡ Warning</strong> - You're approaching your budget limit. Slow
                          down spending to stay within budget.
                        </>
                      )}
                      {isSafe && (
                        <>
                          <strong>✓ On Track</strong> - Keep up the good spending habits! You're
                          well within your budget.
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Categories with no budget */}
          {noBudget.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer flex items-center gap-2 py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                Categories without budget ({noBudget.length})
              </summary>
              <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                {noBudget.map(cat => (
                  <div
                    key={cat.category}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <span>{CATEGORY_INFO[cat.category].icon}</span>
                    <span>{CATEGORY_INFO[cat.category].label}</span>
                    <span className="ml-auto font-medium text-gray-900 dark:text-white">
                      {formatUSD(cat.actualAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
