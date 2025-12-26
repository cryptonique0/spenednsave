'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { formatAddress } from '@/lib/wallet';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="glass-effect px-4 py-2 rounded-lg">
          <span className="text-sm font-mono">{formatAddress(address)}</span>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-3 flex-wrap">
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          className="gradient-primary px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Connect {connector.name}
        </button>
      ))}
    </div>
  );
}
