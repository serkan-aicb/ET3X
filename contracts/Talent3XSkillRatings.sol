// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Talent3XSkillRatings
 * @dev Smart contract for anchoring individual skill ratings to the Polygon MAINNET
 * Each skill rating generates a separate on-chain transaction with only events (no storage)
 */
contract Talent3XSkillRatings {
    address public owner;
    address public relayer;

    // Event emitted when a skill rating is anchored to the blockchain
    event SkillRatingAnchored(
        bytes32 ratingSessionHash,
        bytes32 taskIdHash,
        bytes32 subjectIdHash,
        uint16 skillId,
        uint8 stars,
        uint40 timestamp
    );

    // Modifier to restrict access to the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // Modifier to restrict access to the relayer
    modifier onlyRelayer() {
        require(msg.sender == relayer, "Only relayer can call this function");
        _;
    }

    /**
     * @dev Constructor sets the owner to the deployer
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Set the relayer address (only callable by owner)
     * @param _relayer The address of the relayer
     */
    function setRelayer(address _relayer) external onlyOwner {
        relayer = _relayer;
    }

    /**
     * @dev Anchor a single skill rating to the blockchain (only callable by relayer)
     * @param ratingSessionHash Hash of the rating session
     * @param taskIdHash Hash of the task ID
     * @param subjectIdHash Hash of the subject ID (rated user)
     * @param skillId ID of the skill being rated
     * @param stars Rating stars (0-5)
     */
    function anchorSingleSkillRating(
        bytes32 ratingSessionHash,
        bytes32 taskIdHash,
        bytes32 subjectIdHash,
        uint16 skillId,
        uint8 stars
    ) external onlyRelayer {
        // Validate stars are in range 0-5
        require(stars <= 5, "Stars must be between 0 and 5");

        // Emit the event with current timestamp
        emit SkillRatingAnchored(
            ratingSessionHash,
            taskIdHash,
            subjectIdHash,
            skillId,
            stars,
            uint40(block.timestamp)
        );
    }
}