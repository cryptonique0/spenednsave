// AI risk assessment utility for withdrawal requests
// No private keys or signatures are ever sent

export type WithdrawalRequest = {
  amount: string;
  token: string;
  recipient: string;
  reason: string;
  vaultBalance: string;
};

export type RiskLevel = 'low risk' | 'medium risk' | 'high risk';

// Dummy AI summarization function (replace with real API integration)
export async function getWithdrawalRiskAssessment(
  request: WithdrawalRequest
): Promise<RiskLevel> {
  // Example logic: high risk if amount > 80% of vault, medium if > 30%, else low
  const amount = Number(request.amount);
  const vaultBalance = Number(request.vaultBalance);
  if (vaultBalance === 0) return 'high risk';
  const ratio = amount / vaultBalance;
  if (ratio > 0.8) return 'high risk';
  if (ratio > 0.3) return 'medium risk';
  return 'low risk';
}
