"use client";

import { useState } from "react";
import { useAccount } from "wagmi";

interface TransferRequest {
  id: string;
  newOwner: string;
  approvals?: string[];
  executed?: boolean;
}

export function VaultTransfer() {
  const { address } = useAccount();
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAddress, setTransferAddress] = useState("");
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestTransfer = async () => {
    if (!transferAddress) return;
    setIsLoading(true);
    try {
      // TODO: Implement actual transfer request logic
      const newRequest: TransferRequest = {
        id: Date.now().toString(),
        newOwner: transferAddress,
        approvals: [],
        executed: false,
      };
      setTransferRequests([...transferRequests, newRequest]);
      setTransferAddress("");
      setShowTransferModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteTransfer = (id: string) => {
    setTransferRequests(
      transferRequests.map((tr) =>
        tr.id === id ? { ...tr, executed: true } : tr
      )
    );
  };

  return (
    <>
      <div className="bg-surface-dark border border-surface-border rounded-2xl p-6 mt-8">
        <h3 className="text-white text-lg font-bold mb-2">Transfer Vault Ownership</h3>
        <p className="text-slate-400 text-sm mb-4">
          Transfer vault ownership to a new address. Requires guardian approval.
        </p>
        <button
          onClick={() => setShowTransferModal(true)}
          className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-xl mb-4"
        >
          Request Transfer
        </button>
        {/* List pending transfer requests */}
        {transferRequests.length > 0 && (
          <div className="mt-4">
            <h4 className="text-white font-semibold mb-2">Pending Transfer Requests</h4>
            {transferRequests.map((tr) => (
              <div
                key={tr.id}
                className="flex items-center justify-between bg-slate-800 rounded-lg p-3 mb-2"
              >
                <span className="text-slate-200 text-sm">To: {tr.newOwner}</span>
                <span className="text-slate-400 text-xs">
                  Approvals: {tr.approvals?.length || 0}
                </span>
                {!tr.executed && (
                  <button
                    onClick={() => handleExecuteTransfer(tr.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs"
                  >
                    Execute Transfer
                  </button>
                )}
                {tr.executed && (
                  <span className="text-emerald-400 text-xs">Executed</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowTransferModal(false)}
        >
          <div
            className="bg-surface-dark border border-surface-border rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-xl font-bold">Request Vault Transfer</h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  New Owner Address
                </label>
                <input
                  type="text"
                  value={transferAddress}
                  onChange={(e) => setTransferAddress(e.target.value)}
                  className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
                  placeholder="0x..."
                />
              </div>
              <button
                onClick={handleRequestTransfer}
                disabled={isLoading || !transferAddress}
                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {isLoading ? "Processing..." : "Submit Transfer Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
