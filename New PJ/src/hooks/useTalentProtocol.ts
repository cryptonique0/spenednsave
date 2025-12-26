import { useState, useCallback } from 'react';
import {
  fetchTalentProfile,
  fetchTalentCredentials,
  fetchTalentAchievements,
  type TalentProfile,
  type TalentCredential,
  type TalentAchievement,
} from '@/lib/talent-protocol';

export interface UseTalentProtocolReturn {
  loading: boolean;
  error: string | null;
  profile: TalentProfile | null;
  credentials: TalentCredential[];
  achievements: TalentAchievement[];
  getProfile: (handle: string) => Promise<void>;
  getCredentials: (handle: string) => Promise<void>;
  getAchievements: (handle: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export function useTalentProtocol(): UseTalentProtocolReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [credentials, setCredentials] = useState<TalentCredential[]>([]);
  const [achievements, setAchievements] = useState<TalentAchievement[]>([]);

  const getProfile = useCallback(async (handle: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTalentProfile(handle);
      setProfile(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCredentials = useCallback(async (handle: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTalentCredentials(handle);
      setCredentials(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch credentials';
      setError(message);
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAchievements = useCallback(async (handle: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTalentAchievements(handle);
      setAchievements(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch achievements';
      setError(message);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setProfile(null);
    setCredentials([]);
    setAchievements([]);
    setError(null);
  }, []);

  return {
    loading,
    error,
    profile,
    credentials,
    achievements,
    getProfile,
    getCredentials,
    getAchievements,
    clearError,
    reset,
  };
}
