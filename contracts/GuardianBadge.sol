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
}
