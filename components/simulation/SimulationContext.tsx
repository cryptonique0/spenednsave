"use client";
import React, { createContext, useContext, useState } from 'react';

export type SimulationState = {
  enabled: boolean;
  guardianApprovals: Record<string, boolean>; // guardian address => approved
  countdownStarted: boolean;
  countdownEnd: number | null; // timestamp
  recoverySuccess: boolean;
  setEnabled: (enabled: boolean) => void;
  approveGuardian: (guardian: string) => void;
  startCountdown: (durationSeconds: number) => void;
  completeRecovery: () => void;
  reset: () => void;
};

const SimulationContext = createContext<SimulationState | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enabled, setEnabled] = useState(false);
  const [guardianApprovals, setGuardianApprovals] = useState<Record<string, boolean>>({});
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [countdownEnd, setCountdownEnd] = useState<number | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const approveGuardian = (guardian: string) => {
    setGuardianApprovals((prev) => ({ ...prev, [guardian]: true }));
  };

  const startCountdown = (durationSeconds: number) => {
    setCountdownStarted(true);
    setCountdownEnd(Date.now() + durationSeconds * 1000);
  };

  const completeRecovery = () => {
    setRecoverySuccess(true);
  };

  const reset = () => {
    setEnabled(false);
    setGuardianApprovals({});
    setCountdownStarted(false);
    setCountdownEnd(null);
    setRecoverySuccess(false);
  };

  return (
    <SimulationContext.Provider
      value={{
        enabled,
        guardianApprovals,
        countdownStarted,
        countdownEnd,
        recoverySuccess,
        setEnabled,
        approveGuardian,
        startCountdown,
        completeRecovery,
        reset,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider');
  return ctx;
};
