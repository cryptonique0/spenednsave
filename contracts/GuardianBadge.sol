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
    // tokenId counter
    uint256 private _tokenIdCounter;

    event BadgeMinted(address indexed guardian, BadgeType badgeType, uint256 level, uint256 tokenId);

    constructor() ERC721("GuardianBadge", "GBADGE") {}

    /**
     * @dev Mint a badge to a guardian. Only owner (system) can mint.
     * @param to Guardian address
     * @param badgeType Type of badge
     * @param level Badge level (e.g., 1, 2, 3)
     */
    function mintBadge(address to, BadgeType badgeType, uint256 level) external onlyOwner {
        require(guardianBadges[to][badgeType] == 0, "Badge already minted");
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        badges[tokenId] = Badge(badgeType, level, block.timestamp);
        guardianBadges[to][badgeType] = tokenId;
        emit BadgeMinted(to, badgeType, level, tokenId);
    }

    // Soulbound: block all transfers and approvals
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override {
        require(from == address(0) || to == address(0), "Non-transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function approve(address, uint256) public pure override {
        revert("Non-transferable");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("Non-transferable");
    }

    function transferFrom(address, address, uint256) public pure override {
        revert("Non-transferable");
    }

    function safeTransferFrom(address, address, uint256) public pure override {
        revert("Non-transferable");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("Non-transferable");
    }

    // Optional: view function to get all badges for a guardian
    function getBadges(address guardian) external view returns (Badge[] memory) {
        uint256 count = 0;
        for (uint8 i = 0; i < 3; i++) {
            if (guardianBadges[guardian][BadgeType(i)] != 0) count++;
        }
        Badge[] memory result = new Badge[](count);
        uint256 idx = 0;
        for (uint8 i = 0; i < 3; i++) {
            uint256 tokenId = guardianBadges[guardian][BadgeType(i)];
            if (tokenId != 0) {
                result[idx++] = badges[tokenId];
            }
        }
        return result;
    }
}
