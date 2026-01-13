import { useContractRead } from "wagmi";
import { SpendVaultABI } from "@/lib/abis/SpendVault";

export function useVaultHealth(vaultAddress?: string) {
  return useContractRead({
    address: vaultAddress,
    abi: SpendVaultABI,
    functionName: "getVaultHealth",
    enabled: !!vaultAddress,
  });
}
