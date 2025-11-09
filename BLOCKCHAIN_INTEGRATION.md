# Blockchain Integration Guide for Talent3X

This guide explains how to integrate the TalentRating smart contract into your Talent3X application.

## Architecture Overview

The blockchain integration consists of:

1. **Smart Contract** - TalentRating.sol deployed on Polygon Amoy
2. **Backend Service** - Node.js service that interacts with the contract
3. **Frontend Integration** - UI components that display blockchain status

## Backend Integration

### 1. Install Dependencies

```bash
npm install ethers dotenv
```

### 2. Environment Configuration

Add to your `.env` file:
```env
POLYGON_RPC_URL=https://polygon-amoy.infura.io/v3/YOUR_PROJECT_ID
WALLET_PRIVATE_KEY=YOUR_WALLET_PRIVATE_KEY
CONTRACT_ADDRESS=DEPLOYED_CONTRACT_ADDRESS
```

### 3. Service Implementation

Create a service file `blockchain-service.js`:

```javascript
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, this.provider);
    
    // Contract ABI (simplified)
    this.contractABI = [
      // ... ABI from compiled contract
    ];
    
    this.contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      this.contractABI,
      this.wallet
    );
  }
  
  async anchorRating(cid, taskId, studentDid, educatorDid) {
    try {
      const tx = await this.contract.anchorRating(cid, taskId, studentDid, educatorDid);
      const receipt = await tx.wait();
      
      // Extract rating hash from event
      const event = receipt.logs.find(log => {
        try {
          return this.contract.interface.parseLog(log)?.name === "RatingAnchored";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedEvent = this.contract.interface.parseLog(event);
        return {
          success: true,
          ratingHash: parsedEvent.args.ratingHash,
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber
        };
      }
      
      return { success: false, error: "Event not found" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getRating(ratingHash) {
    try {
      const rating = await this.contract.getRating(ratingHash);
      return {
        success: true,
        data: {
          cid: rating.cid,
          taskId: rating.taskId,
          studentDid: rating.studentDid,
          educatorDid: rating.educatorDid,
          timestamp: rating.timestamp
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getRatingCount() {
    try {
      const count = await this.contract.ratingCount();
      return { success: true, count: count.toString() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new BlockchainService();
```

## Frontend Integration

### 1. Display Blockchain Status

Create a React component to show blockchain anchoring status:

```jsx
import React, { useState, useEffect } from 'react';

const BlockchainStatus = ({ ratingId }) => {
  const [status, setStatus] = useState('pending');
  const [txHash, setTxHash] = useState(null);
  const [ratingHash, setRatingHash] = useState(null);
  
  const anchorToBlockchain = async () => {
    setStatus('anchoring');
    
    try {
      // Call your backend API to anchor the rating
      const response = await fetch('/api/anchor-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratingId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStatus('anchored');
        setTxHash(result.transactionHash);
        setRatingHash(result.ratingHash);
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };
  
  return (
    <div className="blockchain-status">
      {status === 'pending' && (
        <button onClick={anchorToBlockchain}>
          Anchor to Blockchain
        </button>
      )}
      
      {status === 'anchoring' && (
        <div>Anchoring to blockchain...</div>
      )}
      
      {status === 'anchored' && (
        <div>
          <div>✓ Anchored to blockchain</div>
          <div>Transaction: {txHash?.substring(0, 10)}...</div>
          <div>Rating Hash: {ratingHash?.substring(0, 10)}...</div>
        </div>
      )}
      
      {status === 'error' && (
        <div>
          <div>⚠ Error anchoring to blockchain</div>
          <button onClick={anchorToBlockchain}>Retry</button>
        </div>
      )}
    </div>
  );
};

export default BlockchainStatus;
```

### 2. API Route

Create an API route `/pages/api/anchor-rating.js`:

```javascript
import blockchainService from '../../services/blockchain-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { ratingId } = req.body;
    
    // Get rating data from your database
    // This is pseudocode - replace with your actual data fetching
    const ratingData = await getRatingById(ratingId);
    
    // Anchor to blockchain
    const result = await blockchainService.anchorRating(
      ratingData.cid,
      ratingData.taskId,
      ratingData.studentDid,
      ratingData.educatorDid
    );
    
    if (result.success) {
      // Update your database with blockchain info
      await updateRatingWithBlockchainInfo(ratingId, result);
      
      res.status(200).json(result);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Cost Optimization

To minimize costs when anchoring ratings:

1. **Batch Operations** - Anchor multiple ratings in a single transaction
2. **Off-chain Storage** - Store full rating documents on IPFS, only anchor hashes
3. **Event Monitoring** - Use events for indexing rather than contract storage
4. **Gas Optimization** - Use efficient data structures in the contract

## Verification

Users can verify anchored ratings by:

1. Checking the transaction on PolygonScan
2. Querying the contract directly with the rating hash
3. Verifying the IPFS CID points to the correct document

Example verification URL:
```
https://amoy.polygonscan.com/tx/{transactionHash}
```

## Error Handling

Common errors and solutions:

1. **Insufficient funds** - Ensure wallet has enough MATIC for gas
2. **Network issues** - Implement retry logic with exponential backoff
3. **Contract errors** - Validate inputs before sending transactions
4. **Rate limiting** - Add delays between transactions to avoid RPC limits

## Testing

For testing, use:

1. Polygon Amoy testnet
2. Test MATIC from the faucet
3. Test wallets like MetaMask
4. Mock contracts for unit tests