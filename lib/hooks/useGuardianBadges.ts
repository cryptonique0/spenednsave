import { useEffect, useState } from "react";
import { ethers, BrowserProvider, Contract } from "ethers";
import GuardianBadgeABI from "../abis/GuardianBadge.json";

export interface GuardianBadge {
  badgeType: number;
  level: number;
  timestamp: number;
}

export function useGuardianBadges(guardianBadgeAddress: string | undefined, guardian: string | undefined) {
  const [badges, setBadges] = useState<GuardianBadge[]>([]);
  useEffect(() => {
    if (!guardianBadgeAddress || !guardian || !window.ethereum) return;
    const provider = new BrowserProvider(window.ethereum as any);
    const contract = new Contract(
      guardianBadgeAddress,
      GuardianBadgeABI.default ?? GuardianBadgeABI,
      provider
    );
    (async () => {
      try {
        const badgeArr = await contract.getBadges(guardian);
        setBadges(badgeArr.map((b: any) => ({
          badgeType: Number(b.badgeType),
          level: Number(b.level),
          timestamp: Number(b.timestamp),
        })));
      } catch (e) {
        setBadges([]);
      }
    })();
  }, [guardianBadgeAddress, guardian]);
  return badges;
}
