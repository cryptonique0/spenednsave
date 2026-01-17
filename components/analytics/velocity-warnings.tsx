'use client';

import React from 'react';
import { useVelocityWarnings } from '@/lib/hooks/useSpendingAnalytics';
import { CATEGORY_INFO, TimePeriod, formatUSD, getSeverityColor } from '@/lib/spending-analytics';
import { AlertTriangle, AlertCircle, Zap } from 'lucide-react';

interface VelocityAlertsProps {
  period?: TimePeriod;
}

export default function VelocityAlerts({ period = TimePeriod.MONTHLY }: VelocityAlertsProps) {
  const { warnings, loading } = useVelocityWarnings(period);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          ⚠️ Spending Velocity Warnings
        </h2>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        ⚠️ Spending Velocity Warnings
      </h2>

      {warnings.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/10 mb-3">
            <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="font-medium text-gray-900 dark:text-white">All clear!</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            You're on track with your spending budget.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {warnings.map(warning => {
            const categoryInfo = CATEGORY_INFO[warning.category];
            const isCritical = warning.severity === 'critical';
            const isWarning = warning.severity === 'warning';

            return (
              <div
                key={warning.id}
                className={`p-4 rounded-lg border ${
                  isCritical
                    ? 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20'
                    : isWarning
                    ? 'bg-orange-50 dark:bg-orange-500/5 border-orange-200 dark:border-orange-500/20'
                    : 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 mt-0.5 ${
                      isCritical
                        ? 'text-red-600 dark:text-red-400'
                        : isWarning
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isCritical ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{categoryInfo.icon}</span>
                      <h3
                        className={`font-semibold ${
                          isCritical
                            ? 'text-red-900 dark:text-red-300'
                            : isWarning
                            ? 'text-orange-900 dark:text-orange-300'
                            : 'text-emerald-900 dark:text-emerald-300'
                        }`}
                      >
                        {categoryInfo.label}
                      </h3>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${getSeverityColor(
                          warning.severity
                        )}`}
                      >
                        {warning.severity.toUpperCase()}
                      </span>
                    </div>

                    {/* Message */}
                    <p
                      className={`text-sm mb-3 ${
                        isCritical
                          ? 'text-red-800 dark:text-red-400'
                          : isWarning
                          ? 'text-orange-800 dark:text-orange-400'
                          : 'text-emerald-800 dark:text-emerald-400'
                      }`}
                    >
                      {warning.message}
                    </p>

                    {/* Progress Bar and Stats */}
                    <div className="space-y-2">
                      {/* Budget Progress */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span
                            className={
                              isCritical
                                ? 'text-red-700 dark:text-red-300'
                                : isWarning
                                ? 'text-orange-700 dark:text-orange-300'
                                : 'text-emerald-700 dark:text-emerald-300'
                            }
                          >
                            {formatUSD(warning.currentAmount)} of {formatUSD(warning.budgetAmount)}
                          </span>
                          <span
                            className={
                              isCritical
                                ? 'text-red-700 dark:text-red-300'
                                : isWarning
                                ? 'text-orange-700 dark:text-orange-300'
                                : 'text-emerald-700 dark:text-emerald-300'
                            }
                          >
                            {warning.percentageUsed.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600">
                          <div
                            className={`h-full transition-all ${
                              isCritical
                                ? 'bg-red-600 dark:bg-red-500'
                                : isWarning
                                ? 'bg-orange-500 dark:bg-orange-400'
                                : 'bg-emerald-500 dark:bg-emerald-400'
                            }`}
                            style={{
                              width: `${Math.min(warning.percentageUsed, 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Projected and Days Remaining */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p
                            className={
                              isCritical
                                ? 'text-red-600 dark:text-red-400'
                                : isWarning
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }
                          >
                            Projected Total
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatUSD(warning.projectedTotal)}
                          </p>
                        </div>
                        <div>
                          <p
                            className={
                              isCritical
                                ? 'text-red-600 dark:text-red-400'
                                : isWarning
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }
                          >
                            Days Remaining
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {warning.daysRemaining}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <p
                      className={`text-xs mt-3 p-2 rounded bg-opacity-20 ${
                        isCritical
                          ? 'bg-red-500 text-red-800 dark:text-red-200'
                          : isWarning
                          ? 'bg-orange-500 text-orange-800 dark:text-orange-200'
                          : 'bg-emerald-500 text-emerald-800 dark:text-emerald-200'
                      }`}
                    >
                      💡 {warning.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
