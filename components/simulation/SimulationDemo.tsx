"use client";
import { useSimulation } from "./SimulationContext";
import { ShieldCheck, UserCheck, Timer, CheckCircle, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

const DUMMY_GUARDIANS = [
  { address: "0x123...abcd", name: "Alice" },
  { address: "0x456...ef01", name: "Bob" },
  { address: "0x789...2345", name: "Charlie" },
];

export function SimulationDemo() {
  const {
    enabled,
    guardianApprovals,
    approveGuardian,
    countdownStarted,
    countdownEnd,
    startCountdown,
    recoverySuccess,
    completeRecovery,
    reset,
  } = useSimulation();
  const [countdown, setCountdown] = useState(0);


  // Countdown logic (pure)
  useEffect(() => {
    if (countdownStarted && countdownEnd && !recoverySuccess) {
      const tick = () => {
        const msLeft = countdownEnd - Date.now();
        setCountdown(msLeft > 0 ? msLeft : 0);
        if (msLeft <= 0) {
          completeRecovery();
        }
      };
      tick();
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }
  }, [countdownStarted, countdownEnd, recoverySuccess, completeRecovery]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[350px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="text-yellow-500" />
        <h2 className="font-bold text-lg">Simulation: Vault Owner Lost Access</h2>
      </div>
      <ol className="space-y-4">
        <li>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="text-blue-500" />
            <span className="font-semibold">Guardian Approvals</span>
          </div>
          <div className="flex flex-col gap-2 ml-7">
            {DUMMY_GUARDIANS.map((g) => (
              <button
                key={g.address}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-sm font-medium transition-colors ${guardianApprovals[g.address] ? 'bg-green-100 border-green-400 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'}`}
                onClick={() => approveGuardian(g.address)}
                disabled={guardianApprovals[g.address]}
              >
                <UserCheck className="w-4 h-4" />
                {g.name} {guardianApprovals[g.address] && <CheckCircle className="w-4 h-4 text-green-500 ml-1" />}
              </button>
            ))}
          </div>
        </li>
        <li>
          <div className="flex items-center gap-2 mb-1">
            <Timer className="text-red-500" />
            <span className="font-semibold">Emergency Unlock Countdown</span>
          </div>
          <div className="ml-7">
            {!countdownStarted ? (
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700"
                onClick={() => startCountdown(10)} // 10s for demo
                disabled={Object.values(guardianApprovals).filter(Boolean).length < 2}
              >
                Start 10s Countdown
              </button>
            ) : !recoverySuccess ? (
              <div className="text-red-600 font-mono text-lg">
                {Math.max(0, Math.ceil(countdown / 1000))} seconds left...
              </div>
            ) : (
              <span className="text-green-600 font-bold">Unlocked!</span>
            )}
          </div>
        </li>
        <li>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="text-green-500" />
            <span className="font-semibold">Recovery Success</span>
          </div>
          <div className="ml-7">
            {recoverySuccess ? (
              <span className="text-green-700 font-bold">Vault successfully recovered!</span>
            ) : (
              <span className="text-slate-500">Complete the steps above to recover the vault.</span>
            )}
          </div>
        </li>
      </ol>
      <button
        className="mt-6 w-full py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
        onClick={reset}
      >
        Reset Simulation
      </button>
    </div>
  );
}
