# Blockchain Deployment Guide for TalentRating Contract

This guide explains how to deploy the TalentRating smart contract to the Polygon Amoy testnet.

## Prerequisites

1. You need a Polygon RPC endpoint (we'll use Infura)
2. You need a wallet with some test MATIC tokens
3. You need the private key for that wallet

## Step 1: Get Infura Credentials

1. Go to [Infura.io](https://infura.io/) and create an account
2. Create a new project
3. Select "Polygon" as the network
4. Copy your project ID

Your RPC URL will be: `https://polygon-amoy.infura.io/v3/YOUR_PROJECT_ID`

## Step 2: Get Test MATIC

1. Go to the [Polygon Amoy Faucet](https://faucet.polygon.technology/)
2. Connect your wallet
3. Request test MATIC for the Amoy network

## Step 3: Get Your Wallet Private Key

1. If using MetaMask:
   - Open MetaMask
   - Select the Amoy test network
   - Click on your account
   - Click the three dots menu
   - Select "Account details"
   - Click "Export private key"
   - Enter your password
   - Copy the private key (keep it secure!)

## Step 4: Update Your .env File

Update your `.env` file with the correct values:

```env
POLYGON_RPC_URL=https://polygon-amoy.infura.io/v3/YOUR_INFURA_PROJECT_ID
WALLET_PRIVATE_KEY=YOUR_WALLET_PRIVATE_KEY
```

## Step 5: Deploy the Contract

Run the deployment script:

```bash
node contracts/deploy.js
```

## What the Contract Does

The TalentRating contract allows you to anchor talent ratings to the blockchain with minimal cost. It stores:

- CID (IPFS Content Identifier) of the rating
- Task ID
- Student DID (Decentralized Identifier)
- Timestamp
- Educator address

Each time you call the `anchorRating` function, it creates an on-chain record that can be verified at any time.

## Using the Deployed Contract

After deployment, the script will create a `deployment.json` file in the contracts directory with:

- Contract address
- ABI (Application Binary Interface)
- Transaction hash

You can use these details to interact with your deployed contract.