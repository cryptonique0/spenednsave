import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSendTransaction } from 'wagmi';
import { GuardianSBTABI } from '@/lib/abis/GuardianSBT';
import { SpendVaultABI } from '@/lib/abis/SpendVault';
import { VaultFactoryABI } from '@/lib/abis/VaultFactory';
import { getContractAddresses } from '@/lib/contracts';
import { parseEther, type Address } from 'viem';

/**
 * Hook to get factory address for the current chain
 */
export function useFactoryAddress() {
    const { chain } = useAccount();

    if (!chain) {
        return null;
    }

    try {
        const addresses = getContractAddresses(chain.id);
        return addresses.VaultFactory as Address;
    } catch {
        return null;
    }
}

/**
 * Hook to get user's vault and guardian token addresses from factory
 */
export function useUserContracts(userAddress?: Address) {
    const factoryAddress = useFactoryAddress();

    return useReadContract({
        address: factoryAddress as Address,
        abi: VaultFactoryABI,
        functionName: 'getUserContracts',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!factoryAddress && !!userAddress,
        },
    });
}

/**
 * Hook to check if user has created a vault
 */
export function useHasVault(userAddress?: Address) {
    const factoryAddress = useFactoryAddress();

    return useReadContract({
        address: factoryAddress as Address,
        abi: VaultFactoryABI,
        functionName: 'hasVault',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!factoryAddress && !!userAddress,
        },
    });
}

/**
 * Hook to create a new vault
 */
export function useCreateVault() {
    const factoryAddress = useFactoryAddress();
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const createVault = (quorum: number) => {
        if (!factoryAddress) {
            throw new Error('Factory not deployed on this chain');
        }

        writeContract({
            address: factoryAddress,
            abi: VaultFactoryABI,
            functionName: 'createVault',
            args: [BigInt(quorum)],
        });
    };

    return {
        createVault,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Hook to check if an address is a guardian
 */
export function useIsGuardian(guardianTokenAddress?: Address, address?: Address) {
    return useReadContract({
        address: guardianTokenAddress as Address,
        abi: GuardianSBTABI,
        functionName: 'isGuardian',
        args: address ? [address] : undefined,
        query: {
            enabled: !!guardianTokenAddress && !!address,
        },
    });
}

/**
 * Hook to get vault balance (ETH)
 */
export function useVaultETHBalance(vaultAddress?: Address) {
    return useReadContract({
        address: vaultAddress as Address,
        abi: SpendVaultABI,
        functionName: 'getETHBalance',
        query: {
            enabled: !!vaultAddress,
        },
    });
}

/**
 * Hook to get vault balance (ERC20)
 */
export function useVaultTokenBalance(vaultAddress?: Address, tokenAddress?: Address) {
    return useReadContract({
        address: vaultAddress as Address,
        abi: SpendVaultABI,
        functionName: 'getTokenBalance',
        args: tokenAddress ? [tokenAddress] : undefined,
        query: {
            enabled: !!vaultAddress && !!tokenAddress,
        },
    });
}

/**
 * Hook to get current nonce
 */
export function useVaultNonce(vaultAddress?: Address) {
    return useReadContract({
        address: vaultAddress as Address,
        abi: SpendVaultABI,
        functionName: 'nonce',
        query: {
            enabled: !!vaultAddress,
        },
    });
}

/**
 * Hook to get quorum
 */
export function useVaultQuorum(vaultAddress?: Address) {
    return useReadContract({
        address: vaultAddress as Address,
        abi: SpendVaultABI,
        functionName: 'quorum',
        query: {
            enabled: !!vaultAddress,
        },
    });
}

/**
 * Hook to deposit ETH to vault
 */
export function useDepositETH(vaultAddress?: Address) {
    const { sendTransaction, data: hash, isPending, error } = useSendTransaction();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const deposit = (amount: string) => {
        if (!vaultAddress) {
            throw new Error('No vault address provided');
        }

        // Send ETH directly to vault - the receive() function will handle it
        sendTransaction({
            to: vaultAddress,
            value: parseEther(amount),
        } as any);
    };

    return {
        deposit,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}


/**
 * Hook to add a guardian
 */
export function useAddGuardian(guardianTokenAddress?: Address) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const addGuardian = (guardianAddress: Address) => {
        if (!guardianTokenAddress) {
            throw new Error('No guardian token address provided');
        }

        writeContract({
            address: guardianTokenAddress,
            abi: GuardianSBTABI,
            functionName: 'mint',
            args: [guardianAddress],
        });
    };

    return {
        addGuardian,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Hook to remove a guardian
 */
export function useRemoveGuardian(guardianTokenAddress?: Address) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const removeGuardian = (tokenId: bigint) => {
        if (!guardianTokenAddress) {
            throw new Error('No guardian token address provided');
        }

        writeContract({
            address: guardianTokenAddress,
            abi: GuardianSBTABI,
            functionName: 'burn',
            args: [tokenId],
        });
    };

    return {
        removeGuardian,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Hook to request emergency unlock
 */
export function useRequestEmergencyUnlock(vaultAddress?: Address) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const requestUnlock = () => {
        if (!vaultAddress) {
            throw new Error('No vault address provided');
        }

        writeContract({
            address: vaultAddress,
            abi: SpendVaultABI,
            functionName: 'requestEmergencyUnlock',
        });
    };

    return {
        requestUnlock,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Hook to get emergency unlock time remaining
 */
export function useEmergencyUnlockTimeRemaining(vaultAddress?: Address) {
    return useReadContract({
        address: vaultAddress as Address,
        abi: SpendVaultABI,
        functionName: 'getEmergencyUnlockTimeRemaining',
        query: {
            enabled: !!vaultAddress,
        },
    });
}
