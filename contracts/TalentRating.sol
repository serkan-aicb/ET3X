// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TalentRating
 * @dev Smart contract for anchoring talent ratings to the blockchain
 */
contract TalentRating {
    // Structure to store rating information
    struct Rating {
        string cid;
        string taskId;
        string studentDid;
        string educatorDid;
        uint256 timestamp;
    }

    // Mapping from transaction hash to rating data
    mapping(bytes32 => Rating) public ratings;
    
    // Counter for total ratings
    uint256 public ratingCount;

    // Event emitted when a new rating is anchored
    event RatingAnchored(
        bytes32 indexed ratingHash,
        string cid,
        string taskId,
        string studentDid,
        string educatorDid,
        uint256 timestamp
    );

    /**
     * @dev Anchor a rating to the blockchain
     * @param _cid The IPFS CID of the rating
     * @param _taskId The task identifier
     * @param _studentDid The student's DID
     * @param _educatorDid The educator's DID
     * @return ratingHash The hash of the anchored rating
     */
    function anchorRating(
        string memory _cid,
        string memory _taskId,
        string memory _studentDid,
        string memory _educatorDid
    ) public returns (bytes32 ratingHash) {
        // Create a unique hash for this rating
        ratingHash = keccak256(
            abi.encodePacked(
                _cid,
                _taskId,
                _studentDid,
                _educatorDid,
                block.timestamp
            )
        );

        // Store the rating information
        ratings[ratingHash] = Rating({
            cid: _cid,
            taskId: _taskId,
            studentDid: _studentDid,
            educatorDid: _educatorDid,
            timestamp: block.timestamp
        });

        // Increment the rating counter
        ratingCount++;

        // Emit the event
        emit RatingAnchored(
            ratingHash,
            _cid,
            _taskId,
            _studentDid,
            _educatorDid,
            block.timestamp
        );
    }

    /**
     * @dev Get rating information by hash
     * @param _ratingHash The hash of the rating
     * @return cid The IPFS CID of the rating
     * @return taskId The task identifier
     * @return studentDid The student's DID
     * @return educatorDid The educator's DID
     * @return timestamp The timestamp when the rating was anchored
     */
    function getRating(bytes32 _ratingHash) public view returns (
        string memory cid,
        string memory taskId,
        string memory studentDid,
        string memory educatorDid,
        uint256 timestamp
    ) {
        Rating memory rating = ratings[_ratingHash];
        return (
            rating.cid,
            rating.taskId,
            rating.studentDid,
            rating.educatorDid,
            rating.timestamp
        );
    }
}