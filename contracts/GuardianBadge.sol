// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GuardianBadge
 * @dev Non-transferable (soulbound) NFT for guardians, awarded based on activity.
 */
contract GuardianBadge is ERC721Enumerable, Ownable {
    enum BadgeType { Approvals, ResponseTime, Longevity }

    struct Badge {
        BadgeType badgeType;
        uint256 level;
        uint256 timestamp;
    }

    // tokenId => Badge
    mapping(uint256 => Badge) public badges;
    // guardian => badge type => tokenId
    mapping(address => mapping(BadgeType => uint256)) public guardianBadges;
    uint256 private _tokenIdCounter;

    event BadgeMinted(address indexed guardian, BadgeType badgeType, uint256 level, uint256 tokenId);

    function mintBadge(address guardian, BadgeType badgeType, uint256 level) external onlyOwner {
        require(guardian != address(0), "Invalid guardian address");
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        _safeMint(guardian, tokenId);
        badges[tokenId] = Badge({ badgeType: badgeType, level: level, timestamp: block.timestamp });
        guardianBadges[guardian][badgeType] = tokenId;
        emit BadgeMinted(guardian, badgeType, level, tokenId);
    }
}
