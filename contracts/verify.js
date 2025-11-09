// Script to verify anchored ratings on the blockchain
import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

class RatingVerifier {
  constructor() {
    // Connect to the Polygon Amoy testnet
    this.provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    
    // Load deployment info if available
    const deploymentPath = path.join(process.cwd(), "contracts", "deployment.json");
    if (fs.existsSync(deploymentPath)) {
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
      this.contractAddress = deploymentInfo.address;
      this.contractABI = deploymentInfo.abi;
    } else {
      // Fallback to default values (you should update these with your actual deployed contract)
      this.contractAddress = process.env.CONTRACT_ADDRESS || "0x...";
      this.contractABI = [
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "_cid",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_taskId",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_studentDid",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_educatorDid",
              "type": "string"
            }
          ],
          "name": "anchorRating",
          "outputs": [
            {
              "internalType": "bytes32",
              "name": "ratingHash",
              "type": "bytes32"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "bytes32",
              "name": "_ratingHash",
              "type": "bytes32"
            }
          ],
          "name": "getRating",
          "outputs": [
            {
              "internalType": "string",
              "name": "cid",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "taskId",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "studentDid",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "educatorDid",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "ratingCount",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "bytes32",
              "name": "",
              "type": "bytes32"
            }
          ],
          "name": "ratings",
          "outputs": [
            {
              "internalType": "string",
              "name": "cid",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "taskId",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "studentDid",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "educatorDid",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ];
    }
    
    // Create read-only contract instance
    this.contract = new ethers.Contract(
      this.contractAddress,
      this.contractABI,
      this.provider
    );
  }
  
  async verifyRating(ratingHash) {
    try {
      console.log("Verifying rating with hash:", ratingHash);
      
      // Check if the rating exists
      const rating = await this.contract.getRating(ratingHash);
      
      // Check if the rating has valid data
      if (rating.cid === "" && rating.taskId === "" && rating.studentDid === "" && rating.educatorDid === "") {
        return {
          verified: false,
          error: "Rating not found on blockchain"
        };
      }
      
      return {
        verified: true,
        data: {
          cid: rating.cid,
          taskId: rating.taskId,
          studentDid: rating.studentDid,
          educatorDid: rating.educatorDid,
          timestamp: rating.timestamp
        }
      };
    } catch (error) {
      return {
        verified: false,
        error: error.message
      };
    }
  }
  
  async getRatingCount() {
    try {
      const count = await this.contract.ratingCount();
      return {
        success: true,
        count: count.toString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async getContractInfo() {
    return {
      address: this.contractAddress,
      provider: process.env.POLYGON_RPC_URL
    };
  }
}

// CLI usage
async function main() {
  const verifier = new RatingVerifier();
  
  console.log("=== TalentRating Contract Verifier ===");
  
  // Show contract info
  const contractInfo = await verifier.getContractInfo();
  console.log("Contract Address:", contractInfo.address);
  console.log("RPC Provider:", contractInfo.provider);
  console.log("");
  
  // Show total ratings
  const ratingCount = await verifier.getRatingCount();
  if (ratingCount.success) {
    console.log("Total Ratings Anchored:", ratingCount.count);
  }
  console.log("");
  
  // If rating hash provided as argument, verify it
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const ratingHash = args[0];
    const result = await verifier.verifyRating(ratingHash);
    
    if (result.verified) {
      console.log("✓ Rating VERIFIED on blockchain");
      console.log("CID:", result.data.cid);
      console.log("Task ID:", result.data.taskId);
      console.log("Student DID:", result.data.studentDid);
      console.log("Educator DID:", result.data.educatorDid);
      console.log("Timestamp:", new Date(result.data.timestamp * 1000).toISOString());
    } else {
      console.log("✗ Rating NOT FOUND on blockchain");
      console.log("Error:", result.error);
    }
  } else {
    console.log("Usage: node verify.js <ratingHash>");
    console.log("Example: node verify.js 0x1234567890abcdef...");
  }
}

// Export for use in other modules
export default RatingVerifier;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}