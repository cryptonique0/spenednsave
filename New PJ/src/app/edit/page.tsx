'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, ON_CHAIN_RESUME_ABI } from '@/lib/contract';
import { ConnectWallet } from '@/components/ConnectWallet';
import ShareProfile from '@/components/ShareProfile';
import ExportButton from '@/components/ExportButton';

export default function EditProfilePage() {
  const { address, isConnected } = useAccount();
  const [handle, setHandle] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleCreateProfile = async () => {
    if (!handle || !ipfsHash) {
      alert('Please fill in all fields');
      return;
    }

    writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: ON_CHAIN_RESUME_ABI,
      functionName: 'createProfile',
      args: [handle, ipfsHash],
    });
  };

  const handleUpdateProfile = async () => {
    if (!ipfsHash) {
      alert('Please provide IPFS hash');
      return;
    }

    writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: ON_CHAIN_RESUME_ABI,
      functionName: 'updateProfile',
      args: [ipfsHash],
    });
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <h1 className="text-4xl font-bold mb-6">Connect Your Wallet</h1>
        <p className="text-gray-400 mb-8">
          Please connect your wallet to create or edit your profile
        </p>
        <ConnectWallet />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Edit Your Profile</h1>

      {/* Share / Export Actions */}
      {address && (
        <div className="flex items-center gap-3 mb-6">
          <ShareProfile address={address} />
          <ExportButton selector=".glass-effect" />
        </div>
      )}

      <div className="glass-effect p-8 rounded-xl space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Handle</label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="your-username"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Your unique username on the platform
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">IPFS Hash</label>
          <input
            type="text"
            value={ipfsHash}
            onChange={(e) => setIpfsHash(e.target.value)}
            placeholder="QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            IPFS hash containing your complete profile data
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleCreateProfile}
            disabled={isPending || isConfirming}
            className="flex-1 gradient-primary px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending || isConfirming ? 'Creating...' : 'Create Profile'}
          </button>
          <button
            onClick={handleUpdateProfile}
            disabled={isPending || isConfirming}
            className="flex-1 bg-white/10 px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            {isPending || isConfirming ? 'Updating...' : 'Update Profile'}
          </button>
        </div>

        {isSuccess && (
          <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg">
            Transaction successful! View on{' '}
            <a
              href={`https://basescan.org/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              BaseScan
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
