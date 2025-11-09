// Script to demonstrate how to interact with the deployed TalentRating contract
import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

async function interactWithContract() {
  console.log("Interacting with TalentRating contract...");
  
  // Check if deployment info exists
  const deploymentPath = path.join(process.cwd(), "contracts", "deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    console.log("Deployment info not found. Please deploy the contract first.");
    console.log("Run: node contracts/deploy.js");
    return;
  }
  
  // Load deployment info
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  // Connect to the Polygon Amoy testnet
  const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
  
  // Create a wallet instance
  const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);
  
  // Create contract instance
  const talentRatingContract = new ethers.Contract(
    deploymentInfo.address,
    deploymentInfo.abi,
    wallet
  );
  
  console.log("Contract address:", deploymentInfo.address);
  
  // Get current rating count
  const ratingCount = await talentRatingContract.ratingCount();
  console.log("Current rating count:", ratingCount.toString());
  
  // Example: Anchor a sample rating
  console.log("\n--- Anchoring a sample rating ---");
  try {
    // Sample data (in a real application, these would come from your system)
    const cid = "QmSampleCID1234567890"; // IPFS CID
    const taskId = "task_sample_001";
    const studentDid = "did:example:student123";
    const educatorDid = "did:example:educator456";
    
    console.log("Anchoring rating with:");
    console.log("  CID:", cid);
    console.log("  Task ID:", taskId);
    console.log("  Student DID:", studentDid);
    console.log("  Educator DID:", educatorDid);
    
    // Anchor the rating
    const tx = await talentRatingContract.anchorRating(cid, taskId, studentDid, educatorDid);
    console.log("Transaction sent:", tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    
    // Extract the ratingHash from the event
    const event = receipt.logs.find(log => {
      try {
        return talentRatingContract.interface.parseLog(log)?.name === "RatingAnchored";
      } catch (e) {
        return false;
      }
    });
    
    if (event) {
      const parsedEvent = talentRatingContract.interface.parseLog(event);
      const ratingHash = parsedEvent.args.ratingHash;
      console.log("Rating anchored with hash:", ratingHash);
      
      // Retrieve the rating
      console.log("\n--- Retrieving the anchored rating ---");
      const rating = await talentRatingContract.getRating(ratingHash);
      console.log("Retrieved rating:");
      console.log("  CID:", rating.cid);
      console.log("  Task ID:", rating.taskId);
      console.log("  Student DID:", rating.studentDid);
      console.log("  Educator DID:", rating.educatorDid);
      console.log("  Timestamp:", new Date(rating.timestamp * 1000).toISOString());
    }
    
    // Get updated rating count
    const newRatingCount = await talentRatingContract.ratingCount();
    console.log("\nNew rating count:", newRatingCount.toString());
    
  } catch (error) {
    console.error("Error anchoring rating:", error.message);
  }
}

// Function to retrieve a specific rating by hash
async function getRatingByHash(ratingHash) {
  try {
    // Load deployment info
    const deploymentPath = path.join(process.cwd(), "contracts", "deployment.json");
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    
    // Connect to the Polygon Amoy testnet
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    
    // Create contract instance (read-only)
    const talentRatingContract = new ethers.Contract(
      deploymentInfo.address,
      deploymentInfo.abi,
      provider
    );
    
    // Retrieve the rating
    const rating = await talentRatingContract.getRating(ratingHash);
    console.log("Rating details:");
    console.log("  CID:", rating.cid);
    console.log("  Task ID:", rating.taskId);
    console.log("  Student DID:", rating.studentDid);
    console.log("  Educator DID:", rating.educatorDid);
    console.log("  Timestamp:", new Date(rating.timestamp * 1000).toISOString());
    
    return rating;
  } catch (error) {
    console.error("Error retrieving rating:", error.message);
  }
}

// Example usage
interactWithContract()
  .then(() => {
    console.log("\n--- Usage Examples ---");
    console.log("To retrieve a specific rating, call:");
    console.log("getRatingByHash('0xRatingHashHere')");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Export functions for use in other scripts
export { interactWithContract, getRatingByHash };