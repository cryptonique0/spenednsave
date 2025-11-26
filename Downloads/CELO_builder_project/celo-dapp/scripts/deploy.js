// Hardhat deployment script that uses the Hardhat Runtime Environment (hre).
// Usage (local): npx hardhat run scripts/deploy.js --network alfajores
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying SimplePayments with account:", deployer.address);

  const Factory = await hre.ethers.getContractFactory("SimplePayments");
  const contract = await Factory.deploy();
  await contract.deployed();

  console.log("SimplePayments deployed to:", contract.address);

  // Write a small artifact to the repository root so workflows or frontends can read it.
  try {
    const out = {
      network: hre.network ? hre.network.name : 'unknown',
      address: contract.address,
      deployer: deployer.address
    };
    const outPath = path.resolve(__dirname, '../../deployed-address.json');
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log('Wrote deployed-address.json to', outPath);
  } catch (e) {
    console.warn('Could not write deployed-address.json:', e.message || e);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
