import { 
    type PublicClient, 
    type WalletClient,
    type Address,
    type Hex,
    getContract,
    hashTypedData,
    recoverAddress
} from 'viem';
import { SpendVaultABI } from '@/lib/abis/SpendVault';
import { GuardianSBTABI } from '@/lib/abis/GuardianSBT';
import { getLogsInChunks } from '@/lib/utils/chunked-logs';
import type { 
    WithdrawalRequest, 
    SignedWithdrawal, 
    SignatureVerificationResult 
} from '@/lib/types/guardian-signatures';
// NOTE: DB access is server-only and provided via API routes.
// Do not import server-only modules in this file to keep it safe for client use.

/**
 * EIP-712 Domain for SpendGuard signatures
 */
const EIP712_DOMAIN = {
    name: 'SpendGuard',
    version: '1',
} as const;

/**
 * EIP-712 Types for Withdrawal
 */
const WITHDRAWAL_TYPES = {
    Withdrawal: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'recipient', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'reason', type: 'string' },
    ],
} as const;

/**
 * Guardian Signature Service
 * Handles all guardian signature operations including EIP-712 signing and verification
 */
export class GuardianSignatureService {
    constructor(
        private publicClient: PublicClient,
        private walletClient: WalletClient | undefined
    ) {}

    /**
     * Get the current nonce for a vault
     */
    async getVaultNonce(vaultAddress: Address): Promise<bigint> {
        const nonce = await this.publicClient.readContract({
            address: vaultAddress,
            abi: SpendVaultABI,
            functionName: 'nonce',
        });
        return nonce as bigint;
    }

    /**
     * Get the required quorum for a vault
     */
    async getVaultQuorum(vaultAddress: Address): Promise<number> {
        const quorum = await this.publicClient.readContract({
            address: vaultAddress,
            abi: SpendVaultABI,
            functionName: 'quorum',
        });
        return Number(quorum);
    }

    /**
     * Get the guardian token address for a vault
     */
    async getGuardianTokenAddress(vaultAddress: Address): Promise<Address> {
        const guardianToken = await this.publicClient.readContract({
            address: vaultAddress,
            abi: SpendVaultABI,
            functionName: 'guardianToken',
        });
        return guardianToken as Address;
    }

    /**
     * Check if an address is a guardian for a vault
     */
    async isGuardian(vaultAddress: Address, guardianAddress: Address): Promise<boolean> {
        const guardianTokenAddress = await this.getGuardianTokenAddress(vaultAddress);
        
        const balance = await this.publicClient.readContract({
            address: guardianTokenAddress,
            abi: GuardianSBTABI,
            functionName: 'balanceOf',
            args: [guardianAddress],
        });
        
        return (balance as bigint) > 0n;
    }

    /**
     * Get all guardians for a vault
     */
    async getAllGuardians(vaultAddress: Address): Promise<Address[]> {
        const guardianTokenAddress = await this.getGuardianTokenAddress(vaultAddress);
        
        // Get all Transfer events from the Guardian SBT contract to find minted tokens
        const logs = await getLogsInChunks(
            this.publicClient,
            {
                address: guardianTokenAddress,
                event: {
                    type: 'event',
                    name: 'Transfer',
                    inputs: [
                        { indexed: true, name: 'from', type: 'address' },
                        { indexed: true, name: 'to', type: 'address' },
                        { indexed: true, name: 'tokenId', type: 'uint256' },
                    ],
                },
            },
            0n,
            'latest'
        );

        // Get unique addresses that received tokens (excluding burns)
        const guardianSet = new Set<Address>();
        
        for (const log of logs) {
            const { args } = log as any;
            if (args.to && args.to !== '0x0000000000000000000000000000000000000000') {
                // Check if they still have the token (not burned)
                try {
                    const balance = await this.publicClient.readContract({
                        address: guardianTokenAddress,
                        abi: GuardianSBTABI,
                        functionName: 'balanceOf',
                        args: [args.to],
                    });
                    
                    if ((balance as bigint) > 0n) {
                        guardianSet.add(args.to as Address);
                    }
                } catch (error) {
                    // Skip if balance check fails
                    console.error(`Error checking balance for ${args.to}:`, error);
                }
            }
        }

        return Array.from(guardianSet);
    }

    /**
     * Create EIP-712 typed data for a withdrawal request
     */
    createTypedData(
        vaultAddress: Address,
        chainId: number,
        request: WithdrawalRequest
    ) {
        return {
            domain: {
                ...EIP712_DOMAIN,
                chainId,
                verifyingContract: vaultAddress,
            },
            types: WITHDRAWAL_TYPES,
            primaryType: 'Withdrawal' as const,
            message: {
                token: request.token,
                amount: request.amount,
                recipient: request.recipient,
                nonce: request.nonce,
                reason: request.reason,
            },
        };
    }

    /**
     * Sign a withdrawal request as a guardian
     */
    async signWithdrawal(
        vaultAddress: Address,
        request: WithdrawalRequest
    ): Promise<SignedWithdrawal> {
        if (!this.walletClient) {
            throw new Error('Wallet client not connected');
        }

        const account = this.walletClient.account;
        if (!account) {
            throw new Error('No account connected');
        }

        // Verify signer is a guardian
        const isGuardianCheck = await this.isGuardian(vaultAddress, account.address);
        if (!isGuardianCheck) {
            throw new Error('Signer is not a guardian for this vault');
        }

        const chainId = await this.walletClient.getChainId();
        const typedData = this.createTypedData(vaultAddress, chainId, request);

        // Sign using EIP-712
        const signature = await this.walletClient.signTypedData({
            ...typedData,
            account,
        });

        return {
            request,
            signature: signature as Hex,
            signer: account.address as Address,
            signedAt: Date.now(),
        };
    }

    /**
     * Verify a signature
     */
    async verifySignature(
        vaultAddress: Address,
        chainId: number,
        request: WithdrawalRequest,
        signature: Hex,
        existingSigners: Address[] = []
    ): Promise<SignatureVerificationResult> {
        try {
            // Create the typed data
            const typedData = this.createTypedData(vaultAddress, chainId, request);

            // Hash the typed data
            const hash = hashTypedData(typedData);

            // Recover the signer address from the signature
            const signer = await recoverAddress({
                hash,
                signature,
            });

            // Check if signer is a guardian
            const isGuardianCheck = await this.isGuardian(vaultAddress, signer);
            
            if (!isGuardianCheck) {
                return {
                    isValid: false,
                    signer,
                    isGuardian: false,
                    isDuplicate: false,
                    error: 'Signer is not a guardian',
                };
            }

            // Check for duplicate signatures
            const isDuplicate = existingSigners.some(
                (existingSigner) => existingSigner.toLowerCase() === signer.toLowerCase()
            );

            if (isDuplicate) {
                return {
                    isValid: false,
                    signer,
                    isGuardian: true,
                    isDuplicate: true,
                    error: 'Duplicate signature from same guardian',
                };
            }

            return {
                isValid: true,
                signer,
                isGuardian: true,
                isDuplicate: false,
            };
        } catch (error) {
            return {
                isValid: false,
                signer: '0x0000000000000000000000000000000000000000',
                isGuardian: false,
                isDuplicate: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Verify multiple signatures for a withdrawal request
     */
    async verifySignatures(
        vaultAddress: Address,
        chainId: number,
        request: WithdrawalRequest,
        signatures: Hex[]
    ): Promise<{
        valid: SignatureVerificationResult[];
        invalid: SignatureVerificationResult[];
        meetsQuorum: boolean;
        requiredQuorum: number;
    }> {
        const results: SignatureVerificationResult[] = [];
        const signers: Address[] = [];

        for (const signature of signatures) {
            const result = await this.verifySignature(
                vaultAddress,
                chainId,
                request,
                signature,
                signers
            );
            
            results.push(result);
            
            if (result.isValid) {
                signers.push(result.signer);
            }
        }

        const valid = results.filter((r) => r.isValid);
        const invalid = results.filter((r) => !r.isValid);
        const quorum = await this.getVaultQuorum(vaultAddress);

        return {
            valid,
            invalid,
            meetsQuorum: valid.length >= quorum,
            requiredQuorum: quorum,
        };
    }

    /**
     * Execute a withdrawal with verified signatures
     */
    async executeWithdrawal(
        vaultAddress: Address,
        request: WithdrawalRequest,
        signatures: Hex[]
    ): Promise<Hex> {
        if (!this.walletClient) {
            throw new Error('Wallet client not connected');
        }

        const account = this.walletClient.account;
        if (!account) {
            throw new Error('No account connected');
        }

        // Verify signatures meet quorum before executing
        const chainId = await this.walletClient.getChainId();
        const verification = await this.verifySignatures(
            vaultAddress,
            chainId,
            request,
            signatures
        );

        if (!verification.meetsQuorum) {
            throw new Error(
                `Quorum not met: ${verification.valid.length}/${verification.requiredQuorum} signatures`
            );
        }

        if (verification.invalid.length > 0) {
            const errors = verification.invalid
                .map((r) => r.error)
                .filter(Boolean)
                .join(', ');
            console.warn(`Warning: ${verification.invalid.length} invalid signatures: ${errors}`);
        }

        // Execute the withdrawal
        const hash = await this.walletClient.writeContract({
            address: vaultAddress,
            abi: SpendVaultABI,
            functionName: 'withdraw',
            args: [
                request.token,
                request.amount,
                request.recipient,
                request.reason,
                signatures,
            ],
            account: account.address,
            chain: undefined,
        });

        return hash as Hex;
    }

    /**
     * Wait for a withdrawal transaction to be confirmed
     */
    async waitForWithdrawal(hash: Hex): Promise<boolean> {
        const receipt = await this.publicClient.waitForTransactionReceipt({
            hash,
            confirmations: 1,
        });

        return receipt.status === 'success';
    }
}

/**
 * Create a guardian signature service instance
 */
export function createGuardianSignatureService(
    publicClient: PublicClient,
    walletClient?: WalletClient
): GuardianSignatureService {
    return new GuardianSignatureService(publicClient, walletClient);
}
