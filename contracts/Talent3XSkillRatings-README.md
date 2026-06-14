# Talent3X Skill Ratings Contract

This document explains how to deploy and use the `Talent3XSkillRatings` smart contract for anchoring individual skill ratings to Polygon PoS mainnet.

The previous relayer has been taken offline. Before anchoring any new ratings, create a new relayer wallet, fund it with the minimum operational MATIC required, set it on the contract with the owner wallet, and only then enable `RELAYER_ENABLED=true` in the runtime environment.

## Contract Overview

The `Talent3XSkillRatings` contract is designed to record each skill rating as a separate on-chain transaction. It stores no data on-chain, only emitting events for each skill rating.

Key features:
- One blockchain transaction per skill rating
- No personal data stored on-chain (only hashed identifiers)
- Polygon PoS MAINNET only
- Events-only approach (no storage)

## Prerequisites

1. Ensure you have the required environment variables in your local `.env` file:
   ```
   POLYGON_RPC_URL=your_polygon_mainnet_rpc_url
   RELAYER_DEPLOYER_PRIVATE_KEY=private_key_of_deployer_wallet
   RELAYER_ADDRESS=address_of_new_relayer_wallet
   ```

2. Make sure the deployer wallet has enough MATIC for contract deployment and owner transactions.
3. Make sure the relayer wallet is separate from the deployer/owner wallet.

## Deployment

1. Run the deployment script:
   ```bash
   node contracts/deploySkillRatings.js
   ```

2. The script will:
   - Compile the contract
   - Deploy it to Polygon MAINNET
   - Save the contract address to `.env` as `T3X_SKILL_RATINGS_CONTRACT_ADDRESS`
   - Save the generated deployment artifact to `contracts/Talent3XSkillRatings.json`

Generated deployment artifacts are intentionally ignored by Git. They describe a concrete deployment and should be recreated per environment.

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

### `anchorSingleSkillRating(bytes32 ratingSessionHash, bytes32 taskIdHash, bytes32 subjectIdHash, string raterDid, string ratedDid, uint16 skillId, string skillName, uint8 stars)`
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
    string raterDid,
    string ratedDid,
    uint16 skillId,
    string skillName,
    uint8 stars,
    uint40 timestamp
);
```

## Security Notes

1. Only the designated relayer can call `anchorSingleSkillRating`.
2. The owner can change the relayer address at any time.
3. Keep owner/deployer and relayer wallets separate.
4. Rotate the relayer wallet whenever a key may have been exposed.
5. Stars are validated to be between 0 and 5.
6. Do not commit private keys, RPC secrets, `.env`, or generated deployment artifacts.
