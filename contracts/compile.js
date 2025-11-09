// Script to compile the TalentRating contract and output ABI and bytecode
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

async function compileContract() {
  console.log("Compiling TalentRating contract...");
  
  // Read the contract artifact
  const contractPath = path.join(process.cwd(), "contracts", "TalentRating.sol");
  const source = fs.readFileSync(contractPath, "utf8");
  
  // Compile the contract
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
  
  console.log("Contract compiled successfully!");
  console.log("Bytecode length:", bytecode.length);
  console.log("ABI functions:", abi.filter(item => item.type === "function").map(item => item.name));
  
  // Save the contract artifacts
  const artifacts = {
    abi: abi,
    bytecode: bytecode
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), "contracts", "TalentRating.json"),
    JSON.stringify(artifacts, null, 2)
  );
  
  console.log("Contract artifacts saved to TalentRating.json");
}

compileContract()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });