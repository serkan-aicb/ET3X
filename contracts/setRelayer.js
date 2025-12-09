// Script to set the relayer address for the Talent3XSkillRatings contract
import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

async function main() {
  console.log("Setting relayer address for Talent3XSkillRatings contract...");
  
  // Check if required environment variables are set
  if (!process.env.POLYGON_RPC_URL || !process.env.RELAYER_DEPLOYER_PRIVATE_KEY || !process.env.T3X_SKILL_RATINGS_CONTRACT_ADDRESS || !process.env.RELAYER_ADDRESS) {
    throw new Error("Please set POLYGON_RPC_URL, RELAYER_DEPLOYER_PRIVATE_KEY, T3X_SKILL_RATINGS_CONTRACT_ADDRESS, and RELAYER_ADDRESS in your .env file");
  }
  
  // Connect to the Polygon MAINNET
  const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
  
  // Create a wallet instance
  const wallet = new ethers.Wallet(process.env.RELAYER_DEPLOYER_PRIVATE_KEY, provider);
  
  console.log("Owner address:", wallet.address);
  
  // Load the contract ABI
  const contractArtifactPath = path.join(process.cwd(), "contracts", "Talent3XSkillRatings.json");
  if (!fs.existsSync(contractArtifactPath)) {
    throw new Error("Contract artifact not found. Please deploy the contract first.");
  }
  
  const contractArtifact = JSON.parse(fs.readFileSync(contractArtifactPath, "utf8"));
  const abi = contractArtifact.abi;
  
  // Create contract instance
  const contract = new ethers.Contract(process.env.T3X_SKILL_RATINGS_CONTRACT_ADDRESS, abi, wallet);
  
  // Set the relayer address
  console.log("Setting relayer address to:", process.env.RELAYER_ADDRESS);
  const tx = await contract.setRelayer(process.env.RELAYER_ADDRESS);
  
  console.log("Transaction sent. Hash:", tx.hash);
  
  // Wait for the transaction to be mined
  const receipt = await tx.wait();
  
  console.log("Relayer address set successfully!");
  console.log("Transaction confirmed in block:", receipt.blockNumber);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });