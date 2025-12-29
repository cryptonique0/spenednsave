import hre from "hardhat";
const { ethers } = hre as any;

async function main() {
  console.log("Deploying VaultFactory to Base Sepolia...");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.chainId);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const VaultFactory = await ethers.getContractFactory("VaultFactory");
  const factory = await VaultFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ VaultFactory deployed:", factoryAddress);

  console.log("\nNext steps:");
  console.log("1) Update lib/contracts.ts -> CONTRACTS_BASE_SEPOLIA.VaultFactory =", factoryAddress);
  console.log("2) In the frontend, call factory.createVault(quorum) to create your per-user vault + guardian token.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
