# Talent3X Skill Ratings Contract

This document explains how to deploy and use the `Talent3XSkillRatings` smart contract for anchoring individual skill ratings to the Polygon MAINNET.

## Contract Overview

The `Talent3XSkillRatings` contract is designed to record each skill rating as a separate on-chain transaction. It stores no data on-chain, only emitting events for each skill rating.

Key features:
- One blockchain transaction per skill rating
- No personal data stored on-chain (only hashed identifiers)
- Polygon PoS MAINNET only
- Events-only approach (no storage)

## Prerequisites

1. Ensure you have the required environment variables in your `.env` file:
   ```
   POLYGON_RPC_URL=your_polygon_mainnet_rpc_url
   RELAYER_DEPLOYER_PRIVATE_KEY=private_key_of_deployer_wallet
   ```

2. Make sure you have enough MATIC in your deployer wallet for gas fees

## Deployment

1. Run the deployment script:
   ```bash
   node contracts/deploySkillRatings.js
   ```

2. The script will:
   - Compile the contract
   - Deploy it to Polygon MAINNET
   - Save the contract address to `.env` as `T3X_SKILL_RATINGS_CONTRACT_ADDRESS`
   - Save the contract ABI to `contracts/Talent3XSkillRatings.json`

## Post-Deployment Setup

1. Set the relayer address:
   After deployment, you need to set the relayer address that will be authorized to anchor ratings:
   ```bash
   node contracts/setRelayer.js
   ```
   
   Make sure to set the `RELAYER_ADDRESS` in your `.env` file first.

## Contract Functions

### `setRelayer(address _relayer)`
- **Access**: Only owner (deployer)
- **Purpose**: Sets the authorized relayer address

### `anchorSingleSkillRating(bytes32 ratingSessionHash, bytes32 taskIdHash, bytes32 subjectIdHash, uint16 skillId, uint8 stars)`
- **Access**: Only relayer
- **Purpose**: Anchors a single skill rating to the blockchain
- **Validation**: Ensures stars are between 0-5
- **Event**: Emits `SkillRatingAnchored` event

## Events

### `SkillRatingAnchored`
Emitted when a skill rating is anchored:
```
event SkillRatingAnchored(
    bytes32 ratingSessionHash,
    bytes32 taskIdHash,
    bytes32 subjectIdHash,
    uint16 skillId,
    uint8 stars,
    uint40 timestamp
);
```

## Security Notes

1. Only the designated relayer can call `anchorSingleSkillRating`
2. Owner can change the relayer address at any time
3. Stars are validated to be between 0-5
4. No sensitive data is stored on-chain, only hashes