'use client';

import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, ON_CHAIN_RESUME_ABI } from '@/lib/contract';
import type { Profile } from '@/types';

export function useProfile(address: string | undefined) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ON_CHAIN_RESUME_ABI,
    functionName: 'getProfile',
    args: address ? [address as `0x${string}`] : undefined,
  });

  return {
    profile: data as Profile | undefined,
    isLoading,
    isError,
    refetch,
  };
}

export function useCredentials(address: string | undefined) {
  const { data, isError, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ON_CHAIN_RESUME_ABI,
    functionName: 'getCredentials',
    args: address ? [address as `0x${string}`] : undefined,
  });

  return {
    credentials: data || [],
    isLoading,
    isError,
  };
}

export function useAchievements(address: string | undefined) {
  const { data, isError, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ON_CHAIN_RESUME_ABI,
    functionName: 'getAchievements',
    args: address ? [address as `0x${string}`] : undefined,
  });

  return {
    achievements: data || [],
    isLoading,
    isError,
  };
}

export function useReputation(address: string | undefined) {
  const { data, isError, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ON_CHAIN_RESUME_ABI,
    functionName: 'getReputation',
    args: address ? [address as `0x${string}`] : undefined,
  });

  return {
    reputation: data ? Number(data) : 0,
    isLoading,
    isError,
  };
}
