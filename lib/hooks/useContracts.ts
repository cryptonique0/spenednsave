import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSendTransaction } from 'wagmi';
import { GuardianSBTABI } from '@/lib/abis/GuardianSBT';
import { SpendVaultABI } from '@/lib/abis/SpendVault';
import { VaultFactoryABI } from '@/lib/abis/VaultFactory';
import { ERC20ABI } from '@/lib/abis/ERC20';
import { getContractAddresses } from '@/lib/contracts';
import { GuardianBadgeABI } from '@/lib/abis/GuardianBadge';
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
 * Returns [guardianToken, vault]
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
    }) as any;
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
 * Hook to check if an address is the vault owner
 */
export function useIsVaultOwner(vaultAddress?: Address, address?: Address) {
    const vaultOwnerResult = useReadContract({
        address: vaultAddress as Address,
        abi: SpendVaultABI,
        functionName: 'owner',
        query: {
            enabled: !!vaultAddress,
        },
    });

    // Check if the owner matches the provided address
    const isOwner = vaultOwnerResult.data && address ? (vaultOwnerResult.data as Address).toLowerCase() === address.toLowerCase() : false;

    return {
        data: isOwner,
        isLoading: vaultOwnerResult.isLoading,
        error: vaultOwnerResult.error,
    };
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
            refetchInterval: 3000, // Refetch every 3 seconds
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
 * Hook to approve USDC spending to vault
 */
export function useApproveUSDC(usdcAddress?: Address, vaultAddress?: Address) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const approve = (amount: bigint) => {
        if (!usdcAddress || !vaultAddress) {
            throw new Error('USDC or vault address not provided');
        }

        writeContract({
            address: usdcAddress,
            abi: ERC20ABI,
            functionName: 'approve',
            args: [vaultAddress, amount],
        } as any);
    };

    return { approve, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Hook to deposit USDC to vault
 */
export function useDepositUSDC(usdcAddress?: Address, vaultAddress?: Address) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const deposit = (amount: string) => {
        if (!usdcAddress || !vaultAddress) {
            throw new Error('USDC or vault address not provided');
        }

        // USDC has 6 decimals
        const amountInWei = BigInt(parseFloat(amount) * 1e6);

        // Call the vault's deposit function for ERC20 tokens
        writeContract({
            address: vaultAddress,
            abi: SpendVaultABI,
            functionName: 'deposit',
            args: [usdcAddress, amountInWei],
        } as any);
    };

    return { deposit, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Hook to get USDC balance
 */
export function useUSDCBalance(usdcAddress?: Address, userAddress?: Address) {
    return useReadContract({
        address: usdcAddress as Address,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: userAddress ? [userAddress] : undefined,
        query: { enabled: !!usdcAddress && !!userAddress },
    }) as any;
}

/**
 * Hook to get vault USDC balance
 */
export function useVaultUSDCBalance(usdcAddress?: Address, vaultAddress?: Address) {
    return useReadContract({
        address: usdcAddress as Address,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: vaultAddress ? [vaultAddress] : undefined,
        query: { enabled: !!usdcAddress && !!vaultAddress },
    }) as any;
}

/**
 * Hook to get USDC allowance
 */
export function useUSDCAllowance(usdcAddress?: Address, ownerAddress?: Address, spenderAddress?: Address) {
    return useReadContract({
        address: usdcAddress as Address,
        abi: ERC20ABI,
        functionName: 'allowance',
        args: ownerAddress && spenderAddress ? [ownerAddress, spenderAddress] : undefined,
        query: { enabled: !!usdcAddress && !!ownerAddress && !!spenderAddress },
    }) as any;
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
            refetchInterval: 1000, // Refetch every second for countdown
        },
    });
}

/**
 * Hook to get unlock request time
 */
export function useUnlockRequestTime(vaultAddress?: Address) {
    return useReadContract({
        address: vaultAddress as Address,
        abi: SpendVaultABI,
        functionName: 'unlockRequestTime',
        query: {
            enabled: !!vaultAddress,
            refetchInterval: 3000,
        },
    });
}

/**
 * Hook to execute emergency unlock (withdraw all funds after timelock)
 */
export function useExecuteEmergencyUnlock(vaultAddress?: Address) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const executeUnlock = (tokenAddress: Address) => {
        if (!vaultAddress) {
            throw new Error('No vault address provided');
        }

        writeContract({
            address: vaultAddress,
            abi: SpendVaultABI,
            functionName: 'executeEmergencyUnlock',
            args: [tokenAddress],
        });
    };

    return {
        executeUnlock,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Hook to cancel emergency unlock
 */
export function useCancelEmergencyUnlock(vaultAddress?: Address) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const cancelUnlock = () => {
        if (!vaultAddress) {
            throw new Error('No vault address provided');
        }

        writeContract({
            address: vaultAddress,
            abi: SpendVaultABI,
            functionName: 'cancelEmergencyUnlock',
        });
    };

    return {
        cancelUnlock,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Hook to execute withdrawal with guardian signatures
 */
export function useExecuteWithdrawal(vaultAddress?: Address) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const executeWithdrawal = (
        token: Address,
        amount: bigint,
        recipient: Address,
        reason: string,
        signatures: `0x${string}`[]
    ) => {
        if (!vaultAddress) {
            throw new Error('No vault address provided');
        }

        writeContract({
            address: vaultAddress,
            abi: SpendVaultABI,
            functionName: 'withdraw',
            args: [token, amount, recipient, reason, signatures],
        });
    };

    return {
        executeWithdrawal,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Hook to read guardian badges for an address
 */
export function useGuardianBadges(badgeContractAddress?: Address, account?: Address) {
    return useReadContract({
        address: badgeContractAddress as Address,
        abi: GuardianBadgeABI,
        functionName: 'badgesOf',
        args: account ? [account] : undefined,
        query: { enabled: !!badgeContractAddress && !!account },
    }) as any;
}

/**
 * Hook to mint a badge (owner must call)
 */
export function useMintBadge(badgeContractAddress?: Address) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const mint = (to: Address, badgeType: number) => {
        if (!badgeContractAddress) throw new Error('No badge contract configured');

        writeContract({
            address: badgeContractAddress,
            abi: GuardianBadgeABI,
            functionName: 'mintBadge',
            args: [to, badgeType],
        } as any);
    };

    return { mint, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Hook to set withdrawal policies (owner only)
 */
export function useSetWithdrawalPolicies(vaultAddress?: Address) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const setPolicies = (policies: { minAmount: bigint | number | string; maxAmount: bigint | number | string; requiredApprovals: bigint | number | string; cooldown: bigint | number | string; }[]) => {
        if (!vaultAddress) throw new Error('No vault address provided');

        // Convert to tuple[] expected by the contract
        const tuples = policies.map(p => [BigInt(p.minAmount), BigInt(p.maxAmount), BigInt(p.requiredApprovals), BigInt(p.cooldown)]);

        writeContract({
            address: vaultAddress,
            abi: SpendVaultABI,
            functionName: 'setWithdrawalPolicies',
            args: [tuples],
        } as any);
    };

    return { setPolicies, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Hook to read number of withdrawal policies
 */
export function useWithdrawalPoliciesCount(vaultAddress?: Address) {
    return useReadContract({
        address: vaultAddress as Address,
        abi: SpendVaultABI,
        functionName: 'withdrawalPoliciesCount',
        query: { enabled: !!vaultAddress },
    });
}

/**
 * Hook to read a single withdrawal policy by index
 */
export function useWithdrawalPolicyAt(vaultAddress?: Address, index?: bigint | number) {
    return useReadContract({
        address: vaultAddress as Address,
        abi: SpendVaultABI,
        functionName: 'withdrawalPolicies',
        args: index !== undefined && index !== null ? [BigInt(index as any)] : undefined,
        query: { enabled: !!vaultAddress && index !== undefined && index !== null },
    }) as any;
}

/**
 * Hook to get the applicable policy for a given amount
 */
export function useGetPolicyForAmount(vaultAddress?: Address, amount?: bigint) {
    return useReadContract({
        address: vaultAddress as Address,
        abi: SpendVaultABI,
        functionName: 'getPolicy',
        args: amount !== undefined ? [amount] : undefined,
        query: { enabled: !!vaultAddress && amount !== undefined },
    }) as any;
}

/**
 * Hook to read withdrawal caps for a token (address(0) for ETH)
 */
export function useGetWithdrawalCaps(vaultAddress?: Address, token?: Address) {
    return useReadContract({
        address: vaultAddress as Address,
        abi: SpendVaultABI,
        functionName: 'withdrawalCaps',
        args: token ? [token] : undefined,
        query: { enabled: !!vaultAddress && !!token },
    }) as any;
}

/**
 * Hook to set withdrawal caps (owner only)
 */
export function useSetWithdrawalCaps(vaultAddress?: Address) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const setCaps = (token: Address, daily: bigint | number | string, weekly: bigint | number | string, monthly: bigint | number | string) => {
        if (!vaultAddress) throw new Error('No vault address provided');

        writeContract({
            address: vaultAddress,
            abi: SpendVaultABI,
            functionName: 'setWithdrawalCaps',
            args: [token, BigInt(daily as any), BigInt(weekly as any), BigInt(monthly as any)],
        } as any);
    };

    return { setCaps, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Hook to read withdrawn amount for current period (daily/weekly/monthly)
 */
export function useVaultWithdrawnInPeriod(vaultAddress?: Address, token?: Address, period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    if (!vaultAddress || !token) return { data: undefined, isLoading: false, error: null } as any;

    // compute index
    const now = Math.floor(Date.now() / 1000);
    let index = 0n;
    if (period === 'daily') index = BigInt(Math.floor(now / 86400));
    else if (period === 'weekly') index = BigInt(Math.floor(now / (86400 * 7)));
    else index = BigInt(Math.floor(now / (86400 * 30)));

    const fn = period === 'daily' ? 'withdrawnDaily' : period === 'weekly' ? 'withdrawnWeekly' : 'withdrawnMonthly';

    return useReadContract({
        address: vaultAddress as Address,
        abi: SpendVaultABI,
        functionName: fn,
        args: [token, index],
        query: { enabled: !!vaultAddress && !!token },
    }) as any;
}
