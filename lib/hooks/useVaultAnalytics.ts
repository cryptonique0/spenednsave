import { useDepositHistory, useWithdrawalHistory, useGuardians } from './useVaultData';
import { useMemo } from 'react';
import { type Address } from 'viem';

export function useVaultAnalytics(vaultAddress?: Address, guardianTokenAddress?: Address) {
  const { deposits } = useDepositHistory(vaultAddress, 100);
  const { withdrawals } = useWithdrawalHistory(vaultAddress, 100);
  const { guardians } = useGuardians(guardianTokenAddress);

  // Savings growth over time (daily balance)
  const balanceSeries = useMemo(() => {
    // Combine deposits and withdrawals, sort by timestamp
    const events = [
      ...deposits.map(d => ({ type: 'deposit', amount: d.amount, timestamp: d.timestamp })),
      ...withdrawals.map(w => ({ type: 'withdrawal', amount: w.amount, timestamp: w.timestamp })),
    ].sort((a, b) => a.timestamp - b.timestamp);

    let balance = 0n;
    const series: { date: string, balance: number }[] = [];
    for (const event of events) {
      if (event.type === 'deposit') balance += event.amount;
      else balance -= event.amount;
      const date = new Date(event.timestamp).toISOString().slice(0, 10);
      series.push({ date, balance: Number(balance) / 1e18 });
    }
    return series;
  }, [deposits, withdrawals]);

  // Withdrawal stats
  const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0n);
  const avgWithdrawal = withdrawals.length ? Number(totalWithdrawn) / withdrawals.length / 1e18 : 0;
  const withdrawalFrequency = withdrawals.length;

  // Guardian activity
  const totalGuardians = guardians.length;
  const mostRecentGuardian = guardians.length ? guardians[guardians.length - 1] : null;

  return {
    balanceSeries,
    totalDeposited: deposits.reduce((sum, d) => sum + d.amount, 0n),
    totalWithdrawn,
    avgWithdrawal,
    withdrawalFrequency,
    totalGuardians,
    mostRecentGuardian,
  };
}
