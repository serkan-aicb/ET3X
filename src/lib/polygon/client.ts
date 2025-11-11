// Polygon client for blockchain integration
import { ethers } from 'ethers';

// Use the ABI from the compiled contract
const TALENT_RATING_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "ratingHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "cid",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "taskId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "studentDid",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "educatorDid",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "RatingAnchored",
    "type": "event"
  },
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

export async function anchorRating(cid: string, taskId: string, studentDid: string, educatorDid: string): Promise<string> {
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
    const tx = await contract.anchorRating(cid, taskId, studentDid, educatorDid);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    // Return the transaction hash
    return receipt.hash;
  } catch (error) {
    console.error('Error anchoring rating to Polygon:', error);
    throw new Error('Failed to anchor rating to blockchain');
  }
}