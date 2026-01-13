'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePublicClient, useWalletClient, useAccount } from 'wagmi';
import { type Address, type Hex } from 'viem';
import { 
    GuardianSignatureService, 
    createGuardianSignatureService 
} from '@/lib/services/guardian-signatures';
import type { 
    WithdrawalRequest, 
    PendingWithdrawalRequest,
    GuardianSignatureStatus,
    SignatureVerificationResult 
} from '@/lib/types/guardian-signatures';

/**
 * Hook for managing guardian signatures
 */
export function useGuardianSignatures(vaultAddress?: Address) {
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const { address: userAddress } = useAccount();
    const [service, setService] = useState<GuardianSignatureService | null>(null);
    const [pendingRequests, setPendingRequests] = useState<PendingWithdrawalRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize service
    useEffect(() => {
        if (publicClient) {
            const svc = createGuardianSignatureService(publicClient, walletClient);
            setService(svc);
        }
    }, [publicClient, walletClient]);

    /**
     * Get pending requests for current vault
     */
    // Return cached pending requests for sync usage in UI components
    const getPendingRequests = useCallback((): PendingWithdrawalRequest[] => {
        if (!vaultAddress) return [];
        return pendingRequests.filter(req => req.vaultAddress.toLowerCase() === vaultAddress.toLowerCase());
    }, [vaultAddress, pendingRequests]);

    // Load pending requests from server when vault changes
    useEffect(() => {
        if (!vaultAddress) return;

        let mounted = true;

        (async () => {
            try {
                const res = await fetch('/api/guardian-signatures');
                if (!res.ok) throw new Error('Failed to load pending requests');
                const all: PendingWithdrawalRequest[] = await res.json();
                if (!mounted) return;
                setPendingRequests(all.filter(r => r.vaultAddress.toLowerCase() === vaultAddress.toLowerCase()));
            } catch (err) {
                console.error('Failed to fetch pending requests:', err);
            }
        })();

        return () => { mounted = false; };
    }, [vaultAddress]);

    /**
     * Get all guardians for the vault
     */
    const getGuardians = useCallback(async (): Promise<Address[]> => {
        if (!service || !vaultAddress) {
            throw new Error('Service or vault address not initialized');
        }

        setIsLoading(true);
        setError(null);

        try {
            const guardians = await service.getAllGuardians(vaultAddress);
            return guardians;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to get guardians';
            setError(errorMsg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [service, vaultAddress]);

    /**
     * Check if current user is a guardian
     */
    const isUserGuardian = useCallback(async (): Promise<boolean> => {
        if (!service || !vaultAddress || !userAddress) {
            return false;
        }

        try {
            return await service.isGuardian(vaultAddress, userAddress);
        } catch (err) {
            console.error('Error checking guardian status:', err);
            return false;
        }
    }, [service, vaultAddress, userAddress]);

    /**
     * Create a new withdrawal request
     */
    const createWithdrawalRequest = useCallback(async (
        token: Address,
        amount: bigint,
        recipient: Address,
        reason: string
    ): Promise<PendingWithdrawalRequest> => {
        if (!service || !vaultAddress || !userAddress) {
            throw new Error('Service, vault address, or user address not initialized');
        }

        setIsLoading(true);
        setError(null);

        try {
            // Get current nonce and quorum
            const nonce = await service.getVaultNonce(vaultAddress);
            const quorum = await service.getVaultQuorum(vaultAddress);

            const request: WithdrawalRequest = {
                token,
                amount,
                recipient,
                nonce,
                reason,
            };

            const timestamp = Date.now();
            // Use the same ID generation logic
            const requestId = `${vaultAddress}-${nonce}-${timestamp}`;

            const pendingRequest: PendingWithdrawalRequest = {
                id: requestId,
                vaultAddress,
                request,
                signatures: [],
                requiredQuorum: quorum,
                createdAt: timestamp,
                createdBy: userAddress,
                status: 'pending',
            };

            // Save to storage
            GuardianSignatureDB.savePendingRequest(pendingRequest);

            return pendingRequest;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to create withdrawal request';
            setError(errorMsg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [service, vaultAddress, userAddress]);

    /**
     * Sign a withdrawal request
     */
    const signRequest = useCallback(async (
        requestId: string
    ): Promise<void> => {
        if (!service || !vaultAddress) {
            throw new Error('Service or vault address not initialized');
        }

        setIsLoading(true);
        setError(null);

        try {
            const pendingRequest = GuardianSignatureDB.getPendingRequest(requestId);
            if (!pendingRequest) {
                throw new Error('Request not found');
            }

            // Sign the withdrawal
            const signedWithdrawal = await service.signWithdrawal(
                vaultAddress,
                pendingRequest.request
            );

            // Add signature to storage
            // Add signature to the request and save
            if (!pendingRequest) throw new Error('Request not found');
            if (pendingRequest.signatures.some(sig => sig.signer.toLowerCase() === signedWithdrawal.signer.toLowerCase())) {
                throw new Error('Guardian has already signed this request');
            }
            const newStatus = (pendingRequest.signatures.length + 1 >= pendingRequest.requiredQuorum ? 'approved' : pendingRequest.status) as 'pending' | 'approved' | 'executed' | 'rejected';
            const updated = {
                ...pendingRequest,
                signatures: [...pendingRequest.signatures, signedWithdrawal],
                status: newStatus,
            };
            GuardianSignatureDB.savePendingRequest(updated);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to sign request';
            setError(errorMsg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [service, vaultAddress]);

    /**
     * Execute a withdrawal with all signatures
     */
    const executeWithdrawal = useCallback(async (
        requestId: string
    ): Promise<Hex> => {
        if (!service || !vaultAddress) {
            throw new Error('Service or vault address not initialized');
        }

        setIsLoading(true);
        setError(null);

        try {
            const pendingRequest = GuardianSignatureDB.getPendingRequest(requestId);
            if (!pendingRequest) {
                throw new Error('Request not found');
            }

            if (pendingRequest.signatures.length < pendingRequest.requiredQuorum) {
                throw new Error(
                    `Insufficient signatures: ${pendingRequest.signatures.length}/${pendingRequest.requiredQuorum}`
                );
            }

            const signatures = pendingRequest.signatures.map((sig) => sig.signature);

            // Execute the withdrawal
            const txHash = await service.executeWithdrawal(
                vaultAddress,
                pendingRequest.request,
                signatures
            );

            // Wait for confirmation
            const success = await service.waitForWithdrawal(txHash);
            if (!success) {
                throw new Error('Transaction failed');
            }

            // Mark as executed
            if (!pendingRequest) throw new Error('Request not found');
            const executed = {
                ...pendingRequest,
                status: 'executed' as 'executed',
                executedAt: Date.now(),
                executionTxHash: txHash,
            };
            GuardianSignatureDB.savePendingRequest(executed);

            return txHash;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to execute withdrawal';
            setError(errorMsg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [service, vaultAddress]);

    /**
     * Get signature status for all guardians on a request
     */
    const getSignatureStatus = useCallback(async (
        requestId: string
    ): Promise<GuardianSignatureStatus[]> => {
        if (!service || !vaultAddress) {
            throw new Error('Service or vault address not initialized');
        }

        setIsLoading(true);
        setError(null);

        try {
            const pendingRequest = GuardianSignatureDB.getPendingRequest(requestId);
            if (!pendingRequest) {
                throw new Error('Request not found');
            }

            const guardians = await service.getAllGuardians(vaultAddress);
            const statuses: GuardianSignatureStatus[] = [];

            for (const guardian of guardians) {
                const signature = pendingRequest.signatures.find(
                    (sig) => sig.signer.toLowerCase() === guardian.toLowerCase()
                );

                statuses.push({
                    address: guardian,
                    hasToken: true,
                    hasSigned: !!signature,
                    signature: signature?.signature,
                    signedAt: signature?.signedAt,
                });
            }

            return statuses;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to get signature status';
            setError(errorMsg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [service, vaultAddress]);

    /**
     * Verify all signatures for a request
     */
    const verifyRequest = useCallback(async (
        requestId: string
    ): Promise<{
        valid: SignatureVerificationResult[];
        invalid: SignatureVerificationResult[];
        meetsQuorum: boolean;
        requiredQuorum: number;
    }> => {
        if (!service || !vaultAddress || !publicClient) {
            throw new Error('Service, vault address, or public client not initialized');
        }

        setIsLoading(true);
        setError(null);


        try {
            const pendingRequest = GuardianSignatureDB.getPendingRequest(requestId);
            if (!pendingRequest) {
                throw new Error('Request not found');
            }

            const chainId = await publicClient.getChainId();
            const signatures = pendingRequest.signatures.map((sig) => sig.signature);

            const result = await service.verifySignatures(
                vaultAddress,
                chainId,
                pendingRequest.request,
                signatures
            );

            return result;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to verify signatures';
            setError(errorMsg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [service, vaultAddress, publicClient]);

    /**
     * Reject a withdrawal request
     */
    const rejectRequest = useCallback((requestId: string): void => {
        const pendingRequest = GuardianSignatureDB.getPendingRequest(requestId);
        if (pendingRequest) {
            GuardianSignatureDB.savePendingRequest({ ...pendingRequest, status: 'rejected' as 'rejected' });
        }
    }, []);

    /**
     * Delete a withdrawal request
     */
    const deleteRequest = useCallback((requestId: string): void => {
        GuardianSignatureDB.deletePendingRequest(requestId);
    }, []);

    return {
        // State
        isLoading,
        error,
        service,

        // Query functions
        getPendingRequests,
        getGuardians,
        isUserGuardian,
        getSignatureStatus,
        verifyRequest,

        // Action functions
        createWithdrawalRequest,
        signRequest,
        executeWithdrawal,
        rejectRequest,
        deleteRequest,
    };
}
