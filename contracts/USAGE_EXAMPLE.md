# Using the TalentRating Contract

This document explains how to use the deployed TalentRating contract to anchor talent ratings to the blockchain.

## Contract Functions

The TalentRating contract has the following functions:

1. `anchorRating(string _cid, string _taskId, string _studentDid, string _educatorDid)` - Anchors a rating to the blockchain
2. `getRating(bytes32 _ratingHash)` - Retrieves rating information by hash
3. `ratingCount()` - Returns the total number of ratings anchored
4. `ratings(bytes32)` - Public mapping to access ratings directly

## How to Use the Contract

### 1. Anchoring a Rating

To anchor a rating, call the `anchorRating` function with:

- `_cid`: The IPFS CID of the rating document
- `_taskId`: The task identifier
- `_studentDid`: The student's Decentralized Identifier (DID)
- `_educatorDid`: The educator's Decentralized Identifier (DID)

Example:
```javascript
const ratingHash = await talentRatingContract.anchorRating(
  "QmRatingCID1234567890",
  "task_001",
  "did:example:student123",
  "did:example:educator456"
);
```

This function returns a `ratingHash` which is a unique identifier for the anchored rating.

### 2. Retrieving a Rating

To retrieve a rating, call the `getRating` function with the rating hash:

```javascript
const rating = await talentRatingContract.getRating(ratingHash);
console.log("CID:", rating.cid);
console.log("Task ID:", rating.taskId);
console.log("Student DID:", rating.studentDid);
console.log("Educator DID:", rating.educatorDid);
console.log("Timestamp:", rating.timestamp);
```

### 3. Checking Total Ratings

To see how many ratings have been anchored:

```javascript
const count = await talentRatingContract.ratingCount();
console.log("Total ratings:", count.toString());
```

## Cost Efficiency

The contract is designed to be gas-efficient:

1. It uses a mapping for O(1) lookups
2. It stores only essential data on-chain
3. The ratingHash serves as both a unique identifier and efficient storage key
4. Events are emitted for off-chain indexing without additional storage costs

## Event Emission

When a rating is anchored, the contract emits a `RatingAnchored` event:

```solidity
event RatingAnchored(
    bytes32 indexed ratingHash,
    string cid,
    string taskId,
    string studentDid,
    string educatorDid,
    uint256 timestamp
);
```

This event can be used for indexing and monitoring new ratings without querying the contract storage directly.

## Security Considerations

1. Only the caller (educator) can anchor ratings
2. Ratings are immutable once anchored
3. The ratingHash ensures uniqueness and prevents duplicates
4. Timestamps are recorded automatically at the time of anchoring