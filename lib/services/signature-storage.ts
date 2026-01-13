import type { PendingWithdrawalRequest, SignedWithdrawal } from '@/lib/types/guardian-signatures';
import type { Address, Hex } from 'viem';

/**
 * Local storage keys
 */
const STORAGE_KEYS = {
    PENDING_REQUESTS: 'spendguard:pending-requests',
    SIGNED_WITHDRAWALS: 'spendguard:signed-withdrawals',
} as const;

/**
 * DEPRECATED: Storage service for managing pending withdrawal requests
 * Uses localStorage for persistence across sessions (legacy, browser-only)
 * Use GuardianSignatureDB (see guardian-signature-db.ts) for persistent, server-side storage (e.g., SQLite)
 */
export class SignatureStorageService {
    /**
     * Generate a unique ID for a withdrawal request
     */
    static generateRequestId(
        vaultAddress: Address,
        nonce: bigint,
        timestamp: number
    ): string {
        return `${vaultAddress}-${nonce}-${timestamp}`;
    }

    /**
     * Get all pending requests
     */
    static getPendingRequests(): PendingWithdrawalRequest[] {
        if (typeof window === 'undefined') return [];
        
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.PENDING_REQUESTS);
            if (!stored) return [];
            
            const parsed = JSON.parse(stored);
            
            // Convert BigInt fields back from strings
            return parsed.map((req: any) => ({
                ...req,
                request: {
                    ...req.request,
                    amount: BigInt(req.request.amount),
                    nonce: BigInt(req.request.nonce),
                },
            }));
        } catch (error) {
            console.error('Error loading pending requests:', error);
            return [];
        }
    }

    /**
     * Get pending requests for a specific vault
     */
    static getVaultPendingRequests(vaultAddress: Address): PendingWithdrawalRequest[] {
        const all = this.getPendingRequests();
        return all.filter(
            (req) => req.vaultAddress.toLowerCase() === vaultAddress.toLowerCase()
        );
    }

    /**
     * Get a specific pending request by ID
     */
    static getPendingRequest(requestId: string): PendingWithdrawalRequest | null {
        const all = this.getPendingRequests();
        return all.find((req) => req.id === requestId) || null;
    }

    /**
     * Save a new pending request
     */
    static savePendingRequest(request: PendingWithdrawalRequest): void {
        if (typeof window === 'undefined') return;
        
        try {
            const all = this.getPendingRequests();
            
            // Check if already exists
            const existingIndex = all.findIndex((req) => req.id === request.id);
            
            let updated: PendingWithdrawalRequest[];
            if (existingIndex >= 0) {
                // Update existing
                updated = [...all];
                updated[existingIndex] = request;
            } else {
                // Add new
                updated = [...all, request];
            }
            
            // Convert BigInt to string for JSON serialization
            const serializable = updated.map((req) => ({
                ...req,
                request: {
                    ...req.request,
                    amount: req.request.amount.toString(),
                    nonce: req.request.nonce.toString(),
                },
            }));
            
            localStorage.setItem(
                STORAGE_KEYS.PENDING_REQUESTS,
                JSON.stringify(serializable)
            );
        } catch (error) {
            console.error('Error saving pending request:', error);
            throw error;
        }
    }

    /**
     * Add a signature to a pending request
     */
    static addSignatureToPendingRequest(
        requestId: string,
        signedWithdrawal: SignedWithdrawal
    ): void {
        const request = this.getPendingRequest(requestId);
        if (!request) {
            throw new Error(`Request ${requestId} not found`);
        }

        // Check if this guardian already signed
        const existingSignature = request.signatures.find(
            (sig) => sig.signer.toLowerCase() === signedWithdrawal.signer.toLowerCase()
        );

        if (existingSignature) {
            throw new Error('Guardian has already signed this request');
        }

        // Add the new signature
        const updated: PendingWithdrawalRequest = {
            ...request,
            signatures: [...request.signatures, signedWithdrawal],
        };

        // Check if quorum is met
        if (updated.signatures.length >= updated.requiredQuorum) {
            updated.status = 'approved';
        }

        this.savePendingRequest(updated);
    }

    /**
     * Mark a request as executed
     */
    static markAsExecuted(
        requestId: string,
        txHash: Hex
    ): void {
        const request = this.getPendingRequest(requestId);
        if (!request) {
            throw new Error(`Request ${requestId} not found`);
        }

        const updated: PendingWithdrawalRequest = {
            ...request,
            status: 'executed',
            executedAt: Date.now(),
            executionTxHash: txHash,
        };

        this.savePendingRequest(updated);
    }

    /**
     * Mark a request as rejected
     */
    static markAsRejected(requestId: string): void {
        const request = this.getPendingRequest(requestId);
        if (!request) {
            throw new Error(`Request ${requestId} not found`);
        }

        const updated: PendingWithdrawalRequest = {
            ...request,
            status: 'rejected',
        };

        this.savePendingRequest(updated);
    }

    /**
     * Delete a pending request
     */
    static deletePendingRequest(requestId: string): void {
        if (typeof window === 'undefined') return;
        
        try {
            const all = this.getPendingRequests();
            const filtered = all.filter((req) => req.id !== requestId);
            
            const serializable = filtered.map((req) => ({
                ...req,
                request: {
                    ...req.request,
                    amount: req.request.amount.toString(),
                    nonce: req.request.nonce.toString(),
                },
            }));
            
            localStorage.setItem(
                STORAGE_KEYS.PENDING_REQUESTS,
                JSON.stringify(serializable)
            );
        } catch (error) {
            console.error('Error deleting pending request:', error);
            throw error;
        }
    }

    /**
     * Clean up old executed/rejected requests
     */
    static cleanupOldRequests(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): void {
        if (typeof window === 'undefined') return;
        
        try {
            const all = this.getPendingRequests();
            const now = Date.now();
            
            const filtered = all.filter((req) => {
                // Keep pending and approved requests
                if (req.status === 'pending' || req.status === 'approved') {
                    return true;
                }
                
                // For executed/rejected, check age
                const age = now - req.createdAt;
                return age < maxAgeMs;
            });
            
            const serializable = filtered.map((req) => ({
                ...req,
                request: {
                    ...req.request,
                    amount: req.request.amount.toString(),
                    nonce: req.request.nonce.toString(),
                },
            }));
            
            localStorage.setItem(
                STORAGE_KEYS.PENDING_REQUESTS,
                JSON.stringify(serializable)
            );
        } catch (error) {
            console.error('Error cleaning up old requests:', error);
        }
    }

    /**
     * Get signatures for a specific guardian address
     */
    static getGuardianSignatures(guardianAddress: Address): SignedWithdrawal[] {
        const all = this.getPendingRequests();
        const signatures: SignedWithdrawal[] = [];
        
        for (const request of all) {
            const guardianSig = request.signatures.find(
                (sig) => sig.signer.toLowerCase() === guardianAddress.toLowerCase()
            );
            if (guardianSig) {
                signatures.push(guardianSig);
            }
        }
        
        return signatures;
    }

    /**
     * Export all data (for backup)
     */
    static exportData(): string {
        const all = this.getPendingRequests();
        const serializable = all.map((req) => ({
            ...req,
            request: {
                ...req.request,
                amount: req.request.amount.toString(),
                nonce: req.request.nonce.toString(),
            },
        }));
        return JSON.stringify(serializable, null, 2);
    }

    /**
     * Import data (from backup)
     */
    static importData(jsonData: string): void {
        if (typeof window === 'undefined') return;
        
        try {
            const parsed = JSON.parse(jsonData);
            
            // Validate structure
            if (!Array.isArray(parsed)) {
                throw new Error('Invalid data format: expected array');
            }
            
            localStorage.setItem(STORAGE_KEYS.PENDING_REQUESTS, jsonData);
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }

    /**
     * Migrate localStorage pending requests to the server-side DB via API
     */
    static async migrateToServer(apiPath: string = '/api/guardian-signatures/import') {
        if (typeof window === 'undefined') return;

        try {
            const data = this.exportData();
            // exportData returns a JSON string with amounts and nonces as strings
            const parsed = JSON.parse(data);

            const res = await fetch(apiPath, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed),
            });

            if (!res.ok) {
                throw new Error(`Migration failed: ${res.status}`);
            }

            return await res.json();
        } catch (err) {
            console.error('Migration to server failed:', err);
            throw err;
        }
    }

    /**
     * Migrate cached chain activity (deposits, withdrawals, guardians) to server activities DB
     * This reads the local cache keys and posts them to `/api/activities/import`.
     */
    static async migrateChainActivityToServer(vaultAddress: string, guardianTokenAddress?: string, apiPath: string = '/api/activities/import') {
        if (typeof window === 'undefined') return;

        try {
            const payload: any[] = [];

            // Deposits cache key
            try {
                const depositsRaw = localStorage.getItem(`deposits-cache-${vaultAddress.toLowerCase()}`);
                if (depositsRaw) {
                    const deposits = JSON.parse(depositsRaw);
                    for (const d of deposits) {
                        payload.push({
                            id: `${vaultAddress}-deposit-${d.txHash || d.blockNumber}-${d.timestamp}`,
                            account: vaultAddress,
                            type: 'deposit',
                            details: d,
                            timestamp: d.timestamp,
                        });
                    }
                }
            } catch (e) {
                console.warn('Failed to read deposits cache', e);
            }

            // Withdrawals cache key
            try {
                const withdrawalsRaw = localStorage.getItem(`withdrawals-cache-${vaultAddress.toLowerCase()}`);
                if (withdrawalsRaw) {
                    const withdrawals = JSON.parse(withdrawalsRaw);
                    for (const w of withdrawals) {
                        payload.push({
                            id: `${vaultAddress}-withdrawal-${w.txHash || w.blockNumber}-${w.timestamp}`,
                            account: vaultAddress,
                            type: 'withdrawal',
                            details: w,
                            timestamp: w.timestamp,
                        });
                    }
                }
            } catch (e) {
                console.warn('Failed to read withdrawals cache', e);
            }

            // Guardians cache key (if present)
            if (guardianTokenAddress) {
                try {
                    const cacheKey = `guardians-cache-${guardianTokenAddress.toLowerCase()}`;
                    const guardiansRaw = localStorage.getItem(cacheKey);
                    if (guardiansRaw) {
                        const guardians = JSON.parse(guardiansRaw);
                        for (const g of guardians) {
                            payload.push({
                                id: `${vaultAddress}-guardian-${g.address}-${g.addedAt}`,
                                account: vaultAddress,
                                type: 'guardian_added',
                                details: g,
                                timestamp: g.addedAt,
                            });
                        }
                    }
                } catch (e) {
                    console.warn('Failed to read guardians cache', e);
                }
            }

            if (payload.length === 0) return { ok: true, migrated: 0 };

            const res = await fetch(apiPath, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(`Migration failed: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('Migration of chain activity failed:', err);
            throw err;
        }
    }

    /**
     * Clear all data (use with caution!)
     */
    static clearAll(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(STORAGE_KEYS.PENDING_REQUESTS);
        localStorage.removeItem(STORAGE_KEYS.SIGNED_WITHDRAWALS);
    }
}
