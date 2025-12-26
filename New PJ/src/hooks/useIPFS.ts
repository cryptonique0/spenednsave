import { useState, useCallback } from 'react';
import { uploadToIPFS, fetchFromIPFS } from '@/lib/ipfs';

export interface UseIPFSState {
  hash: string | null;
  data: any | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for IPFS operations
 */
export const useIPFS = () => {
  const [state, setState] = useState<UseIPFSState>({
    hash: null,
    data: null,
    loading: false,
    error: null,
  });

  const upload = useCallback(async (data: any) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const hash = await uploadToIPFS(data);
      setState(prev => ({ ...prev, hash, loading: false }));
      return hash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, []);

  const fetch = useCallback(async (hash: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchFromIPFS(hash);
      setState(prev => ({ ...prev, data, loading: false }));
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fetch failed';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, []);

  return { ...state, upload, fetch };
};

export default useIPFS;
