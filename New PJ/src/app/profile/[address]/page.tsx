'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { ProfileCard } from '@/components/ProfileCard';
import { CredentialCard } from '@/components/CredentialCard';
import { AchievementBadge } from '@/components/AchievementBadge';
import { Timeline } from '@/components/Timeline';
import { CONTRACT_ADDRESS, ON_CHAIN_RESUME_ABI } from '@/lib/contract';

export default function ProfilePage({ params }: { params: { address: string } }) {
  const { address: userAddress } = params;
  const [profile, setProfile] = useState<any>(null);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);

  const { data: profileData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ON_CHAIN_RESUME_ABI,
    functionName: 'getProfile',
    args: [userAddress as `0x${string}`],
  });

  const { data: credentialsData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ON_CHAIN_RESUME_ABI,
    functionName: 'getCredentials',
    args: [userAddress as `0x${string}`],
  });

  const { data: achievementsData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ON_CHAIN_RESUME_ABI,
    functionName: 'getAchievements',
    args: [userAddress as `0x${string}`],
  });

  useEffect(() => {
    if (profileData) setProfile(profileData);
    if (credentialsData) setCredentials(credentialsData as any[]);
    if (achievementsData) setAchievements(achievementsData as any[]);
  }, [profileData, credentialsData, achievementsData]);

  if (!profile) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <ProfileCard
        address={userAddress}
        handle={profile.handle}
        ipfsHash={profile.ipfsHash}
        reputationScore={Number(profile.reputationScore)}
        verified={profile.verified}
        createdAt={Number(profile.createdAt)}
      />

      {/* Achievements Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">🏆 Achievements</h2>
        {achievements.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <AchievementBadge
                key={index}
                title={achievement.title}
                description={achievement.description}
                unlockedAt={Number(achievement.unlockedAt)}
                verified={achievement.verified}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No achievements yet</p>
        )}
      </section>

      {/* Credentials Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">📜 Credentials</h2>
        {credentials.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {credentials.map((credential, index) => (
              <CredentialCard
                key={index}
                credentialType={credential.credentialType}
                issuer={credential.issuer}
                issuedDate={Number(credential.issuedDate)}
                expiryDate={Number(credential.expiryDate)}
                proofUrl={credential.proofUrl}
                verified={credential.verified}
                verificationCount={Number(credential.verificationCount)}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No credentials yet</p>
        )}
      </section>

      {/* Timeline Section */}
      {(credentials.length > 0 || achievements.length > 0) && (
        <section>
          <h2 className="text-2xl font-bold mb-6">📅 Timeline</h2>
          <Timeline
            items={[
              ...achievements.map((a) => ({
                id: a.title,
                title: a.title,
                description: a.description,
                date: new Date(Number(a.unlockedAt) * 1000).toLocaleDateString(),
                type: 'achievement' as const,
                verified: a.verified,
              })),
              ...credentials.map((c) => ({
                id: c.credentialType,
                title: c.credentialType,
                description: `Issued by ${c.issuer}`,
                date: new Date(Number(c.issuedDate) * 1000).toLocaleDateString(),
                type: 'credential' as const,
                verified: c.verified,
              })),
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
          />
        </section>
      )}
    </div>
  );
}
