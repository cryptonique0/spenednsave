// Minimal Hardhat-style deployment script that works if configured with provider and private key.
// This script is intentionally simple: it deploys SimplePayments and prints the address.
const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
  // Use environment variables: CELO_RPC and PRIVATE_KEY
  const rpc = process.env.CELO_RPC || "https://alfajores-forno.celo-testnet.org";
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("Please set PRIVATE_KEY environment variable (test key) to deploy");
    process.exit(1);
  }

  const provider = new ethers.providers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(privateKey, provider);

  const abi = JSON.parse(fs.readFileSync("./artifacts/SimplePayments.abi.json", "utf8"));
  const bytecode = fs.readFileSync("./artifacts/SimplePayments.bytecode.txt", "utf8");

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  console.log("Deploying SimplePayments from", wallet.address);
  const contract = await factory.deploy();
  await contract.deployed();
  console.log("SimplePayments deployed at:", contract.address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
