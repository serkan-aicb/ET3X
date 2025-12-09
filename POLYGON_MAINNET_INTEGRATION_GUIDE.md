# Polygon MAINNET Integration Guide for Talent3X

This guide explains how to deploy and integrate the new Polygon MAINNET skill ratings system into Talent3X.

## Overview

The new system implements:
1. One blockchain transaction per skill rating
2. No PII stored on-chain (only hashed identifiers)
3. Normalized database schema with session-level and per-skill tables
4. TypeScript relayer service to anchor ratings to Polygon MAINNET

## Prerequisites

Ensure you have the following environment variables in your `.env` file:
```
POLYGON_RPC_URL=your_polygon_mainnet_rpc_url
RELAYER_DEPLOYER_PRIVATE_KEY=private_key_for_contract_deployment
RELAYER_PRIVATE_KEY=private_key_for_relayer_transactions
T3X_SKILL_RATINGS_CONTRACT_ADDRESS=will_be_set_after_deployment
```

## Step 1: Deploy Smart Contract

1. Deploy the new `Talent3XSkillRatings` contract:
   ```bash
   node contracts/deploySkillRatings.js
   ```

2. Set the relayer address:
   ```bash
   node contracts/setRelayer.js
   ```

## Step 2: Update Database Schema

1. Apply the new schema:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the script in `src/scripts/migrate-ratings-schema.sql`

2. Migrate existing data:
   ```bash
   node src/scripts/migrate-ratings-data.js
   ```

3. Execute the on-chain status update function:
   - In Supabase SQL Editor, run the script in `src/scripts/update-task-ratings-on-chain-function.sql`
   - Then run: `SELECT update_task_ratings_on_chain_status();`

4. Deprecate old columns:
   - Run the script in `src/scripts/deprecate-old-ratings-columns.sql`

## Step 3: Run the Relayer Service

Start the relayer to anchor ratings to the blockchain:
```bash
npm run relayer
```

The relayer can be run periodically as a cron job or continuously as a daemon.

## Files Created

### Smart Contract Files
- `contracts/Talent3XSkillRatings.sol` - New Solidity contract
- `contracts/deploySkillRatings.js` - Deployment script
- `contracts/setRelayer.js` - Script to set relayer address
- `contracts/Talent3XSkillRatings-README.md` - Deployment instructions

### Database Migration Files
- `src/scripts/migrate-ratings-schema.sql` - Creates new normalized tables
- `src/scripts/migrate-ratings-data.js` - Migrates existing data
- `src/scripts/update-task-ratings-on-chain-function.sql` - Updates on-chain status
- `src/scripts/deprecate-old-ratings-columns.sql` - Deprecates old columns

### Relayer Service
- `src/blockchain/relayer.ts` - Main relayer service
- Updated `package.json` with `relayer` script

### Frontend Component
- `src/components/tasks/onchain-indicator.tsx` - UI component for on-chain status

## Verification

After deployment, you can verify:
1. Contract is deployed on Polygon MAINNET
2. Database tables are created with proper relationships
3. Existing data is migrated correctly
4. Relayer successfully anchors ratings to the blockchain
5. UI displays on-chain status and links to PolygonScan