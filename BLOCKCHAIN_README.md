# Talent3X Blockchain Implementation

This document provides an overview of the blockchain functionality implemented for the Talent3X platform.

## Smart Contract

The smart contract [TalentRating.sol](contracts/TalentRating.sol) enables anchoring talent ratings to the Polygon Amoy testnet with minimal costs. It stores:

- IPFS CID of the rating document
- Task identifier
- Student DID (Decentralized Identifier)
- Timestamp
- Educator address

## Key Files

1. **[contracts/TalentRating.sol](contracts/TalentRating.sol)** - The Solidity smart contract
2. **[contracts/compile.js](contracts/compile.js)** - Script to compile the contract
3. **[contracts/deploy.js](contracts/deploy.js)** - Script to deploy the contract (requires configuration)
4. **[contracts/interact.js](contracts/interact.js)** - Script to interact with the deployed contract
5. **[contracts/TalentRating.json](contracts/TalentRating.json)** - Compiled contract artifacts
6. **[BLOCKCHAIN_DEPLOYMENT.md](BLOCKCHAIN_DEPLOYMENT.md)** - Detailed deployment instructions
7. **[BLOCKCHAIN_INTEGRATION.md](BLOCKCHAIN_INTEGRATION.md)** - Integration guide for the application
8. **[contracts/USAGE_EXAMPLE.md](contracts/USAGE_EXAMPLE.md)** - Usage examples for the contract

## How It Works

1. When a rating is created in Talent3X, it's stored on IPFS
2. The IPFS CID, along with task ID and student DID, is anchored to the blockchain
3. This creates an immutable, verifiable record of the rating
4. Users can verify ratings by checking the blockchain transaction

## Deployment Steps

1. Set up your Polygon Amoy testnet credentials in `.env`:
   ```
   POLYGON_RPC_URL=https://polygon-amoy.infura.io/v3/YOUR_PROJECT_ID
   WALLET_PRIVATE_KEY=YOUR_WALLET_PRIVATE_KEY
   ```

2. Compile the contract:
   ```bash
   node contracts/compile.js
   ```

3. Deploy the contract:
   ```bash
   node contracts/deploy.js
   ```

4. The deployment information will be saved to `contracts/deployment.json`

## Cost Efficiency

The implementation is designed to minimize blockchain costs:

- Only essential data is stored on-chain
- Efficient data structures minimize gas usage
- Events are used for indexing without additional storage costs
- The contract can anchor ratings for a fraction of a cent

## Verification

Anyone can verify a rating by:

1. Looking up the transaction hash on PolygonScan
2. Checking the contract with the rating hash
3. Verifying the IPFS CID points to the correct document

## Next Steps

1. Follow the detailed instructions in [BLOCKCHAIN_DEPLOYMENT.md](BLOCKCHAIN_DEPLOYMENT.md) to deploy the contract
2. Review [BLOCKCHAIN_INTEGRATION.md](BLOCKCHAIN_INTEGRATION.md) to integrate with your application
3. Test the functionality using [contracts/interact.js](contracts/interact.js)