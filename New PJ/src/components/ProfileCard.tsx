'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface ProfileCardProps {
  address: string;
  handle: string;
  ipfsHash: string;
  reputationScore: number;
  verified: boolean;
  createdAt: number;
}

export function ProfileCard({
  address,
  handle,
  ipfsHash,
  reputationScore,
  verified,
  createdAt,
}: ProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect p-6 rounded-xl"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-white">
            {handle[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              @{handle}
              {verified && (
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </h3>
            <p className="text-sm text-gray-400 font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Reputation</div>
          <div className="text-2xl font-bold text-gradient">
            {reputationScore}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-700">
        <div>
          <div className="text-xs text-gray-400">IPFS Hash</div>
          <div className="text-sm font-mono text-gray-300 truncate">
            {ipfsHash}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Member Since</div>
          <div className="text-sm text-gray-300">
            {new Date(createdAt * 1000).toLocaleDateString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
