'use client';

import React, { useState } from 'react';
import { useSpendingByCategory } from '@/lib/hooks/useSpendingAnalytics';
import { CATEGORY_INFO, formatUSD, formatPercentage } from '@/lib/spending-analytics';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function SpendingByCategory() {
  const { categoryBreakdown, loading } = useSpendingByCategory();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          📊 Spending by Category
        </h2>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalSpent = categoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0);
  const topCategories = categoryBreakdown.slice(0, 5);
  const otherCategories = categoryBreakdown.slice(5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        📊 Spending by Category
      </h2>

      <div className="space-y-3">
        {topCategories.map(category => {
          const info = CATEGORY_INFO[category.category];
          const isExpanded = expanded === category.category;

          return (
            <div key={category.category}>
              {/* Category Bar */}
              <div
                onClick={() => setExpanded(isExpanded ? null : category.category)}
                className="cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xl">{info.icon}</span>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {info.label}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {category.count} transaction{category.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">{formatUSD(category.amount)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatPercentage(category.percentage)}
                    </p>
                  </div>
                  {category.transactions.length > 0 && (
                    <button className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>

              {/* Expanded Transactions */}
              {isExpanded && category.transactions.length > 0 && (
                <div className="mt-3 pl-8 space-y-2 pb-3 border-l-2 border-indigo-200 dark:border-indigo-500/30">
                  {category.transactions.slice(0, 5).map(tx => (
                    <div key={tx.id} className="flex justify-between text-sm">
                      <div>
                        <p className="text-gray-900 dark:text-gray-100">{tx.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {tx.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatUSD(tx.amountUSD || 0)}
                      </p>
                    </div>
                  ))}
                  {category.transactions.length > 5 && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      +{category.transactions.length - 5} more
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Other Categories Summary */}
        {otherCategories.length > 0 && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <details className="group">
              <summary className="cursor-pointer flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span>📁</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Other Categories ({otherCategories.length})
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>

              <div className="space-y-2 mt-2">
                {otherCategories.map(category => {
                  const info = CATEGORY_INFO[category.category];
                  return (
                    <div key={category.category} className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{info.icon}</span>
                        <span className="text-gray-600 dark:text-gray-400">{info.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatUSD(category.amount)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-500 text-xs ml-2">
                          {formatPercentage(category.percentage)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          </div>
        )}
      </div>

      {categoryBreakdown.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No spending data yet. Add your first transaction to see category breakdowns.
          </p>
        </div>
      )}
    </div>
  );
}
