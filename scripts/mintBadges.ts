// This script scans on-chain events and mints badges for eligible guardians.
// Run with: npx tsx scripts/mintBadges.ts
import { ethers } from "ethers";
import GuardianBadgeABI from "../lib/abis/GuardianBadge.json";
import GuardianSBTABI from "../lib/abis/GuardianSBT.json";
import SpendVaultABI from "../lib/abis/SpendVault.json";
import dotenv from "dotenv";
dotenv.config();

const GUARDIAN_BADGE_ADDRESS = process.env.GUARDIAN_BADGE_ADDRESS!;
const GUARDIAN_SBT_ADDRESS = process.env.GUARDIAN_SBT_ADDRESS!;
const SPEND_VAULT_ADDRESS = process.env.SPEND_VAULT_ADDRESS!;
const PROVIDER_URL = process.env.RPC_URL!;
const PRIVATE_KEY = process.env.MINTER_PRIVATE_KEY!;

const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const badgeContract = new ethers.Contract(GUARDIAN_BADGE_ADDRESS, GuardianBadgeABI.default ?? GuardianBadgeABI, signer);
const guardianSBT = new ethers.Contract(GUARDIAN_SBT_ADDRESS, GuardianSBTABI, provider);
const spendVault = new ethers.Contract(SPEND_VAULT_ADDRESS, SpendVaultABI, provider);

async function main() {
  // 1. Get all guardians from GuardianSBT
  // 2. For each guardian, scan on-chain events for approvals, response time, longevity
  // 3. If eligible and not already minted, mint badge
  // 4. Log results
  // ...
  console.log("[TODO] Implement on-chain scan and badge minting logic");
}

main().catch(console.error);
