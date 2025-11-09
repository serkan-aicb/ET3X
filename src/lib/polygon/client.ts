// Polygon client for blockchain integration
import { ethers } from 'ethers';

// ABI for the TalentRating contract
const TALENT_RATING_ABI = [
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
      }
    ],
    "name": "anchorRating",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export async function anchorRating(cid: string, taskId: string, studentDid: string): Promise<string> {
  const rpcUrl = process.env.POLYGON_RPC_URL;
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!rpcUrl || !privateKey || !contractAddress) {
    throw new Error('Polygon configuration is not set');
  }
  
  try {
    // Connect to the Polygon network
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Create a contract instance
    const contract = new ethers.Contract(contractAddress, TALENT_RATING_ABI, wallet);
    
    // Call the anchorRating function
    const tx = await contract.anchorRating(cid, taskId, studentDid);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    // Return the transaction hash
    return receipt.hash;
  } catch (error) {
    console.error('Error anchoring rating to Polygon:', error);
    throw new Error('Failed to anchor rating to blockchain');
  }
}