'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface LeaderboardUser {
  address: string;
  handle: string;
  reputationScore: number;
  verified: boolean;
  rank: number;
}

interface LeaderboardProps {
  users: LeaderboardUser[];
}

const medalColors = {
  1: 'text-yellow-400',
  2: 'text-gray-300',
  3: 'text-orange-400',
};

const medalEmojis = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export function Leaderboard({ users }: LeaderboardProps) {
  return (
    <div className="glass-effect rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-6 text-gradient">🏆 Top Talent</h2>
      
      <div className="space-y-3">
        {users.map((user, index) => (
          <motion.div
            key={user.address}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className={`text-3xl ${index < 3 ? medalColors[index + 1 as keyof typeof medalColors] : 'text-gray-500'}`}>
              {index < 3 ? medalEmojis[index + 1 as keyof typeof medalEmojis] : `#${index + 1}`}
            </div>
            
            <div className="flex-1">
              <Link 
                href={`/profile/${user.address}`}
                className="font-bold hover:text-blue-400 transition-colors flex items-center gap-2"
              >
                @{user.handle}
                {user.verified && (
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </Link>
              <p className="text-xs text-gray-400 font-mono">
                {user.address.slice(0, 6)}...{user.address.slice(-4)}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gradient">
                {user.reputationScore}
              </div>
              <div className="text-xs text-gray-400">reputation</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
