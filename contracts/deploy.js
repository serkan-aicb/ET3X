// Deployment script for TalentRating contract
import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

dotenv.config();

async function main() {
  console.log("Deploying TalentRating contract...");
  
  // Check if required environment variables are set
  if (!process.env.POLYGON_RPC_URL || !process.env.WALLET_PRIVATE_KEY) {
    throw new Error("Please set POLYGON_RPC_URL and WALLET_PRIVATE_KEY in your .env file");
  }
  
  // Connect to the Polygon Amoy testnet
  const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
  
  // Create a wallet instance
  const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);
  
  console.log("Deployer address:", wallet.address);
  
  // Read the contract artifact
  const contractPath = path.join(process.cwd(), "contracts", "TalentRating.sol");
  const source = fs.readFileSync(contractPath, "utf8");
  
  // Compile the contract
  console.log("Compiling contract...");
  const input = {
    language: "Solidity",
    sources: {
      "TalentRating.sol": {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
    },
  };
  
  const solc = require("solc");
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  // Check for compilation errors
  if (output.errors) {
    console.error("Compilation errors:");
    output.errors.forEach((err) => {
      if (err.severity === "error") {
        console.error(err);
      }
    });
    // Only exit if there are actual errors (not warnings)
    if (output.errors.some(err => err.severity === "error")) {
      process.exit(1);
    }
  }
  
  // Get the contract bytecode and ABI
  const contractName = "TalentRating";
  const bytecode = output.contracts["TalentRating.sol"][contractName].evm.bytecode.object;
  const abi = output.contracts["TalentRating.sol"][contractName].abi;
  
  // Deploy the contract
  console.log("Deploying contract...");
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  
  console.log("Contract deployed at address:", await contract.getAddress());
  
  // Wait for the transaction to be mined
  await contract.deploymentTransaction().wait();
  
  console.log("Contract deployed successfully!");
  console.log("Transaction hash:", contract.deploymentTransaction().hash);
  
  // Save the contract address and ABI
  const deploymentInfo = {
    address: await contract.getAddress(),
    abi: abi,
    transactionHash: contract.deploymentTransaction().hash,
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), "contracts", "deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment information saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });