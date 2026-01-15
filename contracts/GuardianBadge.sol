
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GuardianBadge
 * @dev Non-transferable (soulbound) NFT for guardians, awarded based on activity.



contract GuardianBadge is ERC721Enumerable, Ownable {

    constructor() ERC721("GuardianBadge", "GBADGE") {
_tokenIdCounter = 0; 
    }
 
    // --- Emergency Contact List ---
    mapping(address => bool) public emergencyContacts;
    address[] public emergencyContactList;

    event EmergencyContactAdded(address indexed contact);
    event EmergencyContactRemoved(address indexed contact);

    /**
     * @notice Add a trusted emergency contact (owner only)
     * @param contact The address to add
     */
    function addEmergencyContact(address contact) external onlyOwner {
        require(contact != address(0), "Invalid contact");
        require(!emergencyContacts[contact], "Already added");
        emergencyContacts[contact] = true;
        emergencyContactList.push(contact);
        emit EmergencyContactAdded(contact);
    }

    /**
     * @notice Remove a trusted emergency contact (owner only)
     * @param contact The address to remove
     */
    function removeEmergencyContact(address contact) external onlyOwner {
        require(emergencyContacts[contact], "Not in list");
        emergencyContacts[contact] = false;
        // Remove from array
        for (uint256 i = 0; i < emergencyContactList.length; i++) {
            if (emergencyContactList[i] == contact) {
                emergencyContactList[i] = emergencyContactList[emergencyContactList.length - 1];
                emergencyContactList.pop();
                break;
            }
        }
        emit EmergencyContactRemoved(contact);
    }

    /**
     * @notice Get all emergency contacts
     */
    function getEmergencyContacts() external view returns (address[] memory) {
        return emergencyContactList;
    }

    // --- Soulbound: Block all transfers and approvals ---

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        require(from == address(0) || to == address(0), "Soulbound: Transfers disabled");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function approve(address to, uint256 tokenId) public override(ERC721) {
        revert("Soulbound: Approvals disabled");
    }

    function setApprovalForAll(address operator, bool approved) public override(ERC721) {
        revert("Soulbound: Approvals disabled");
    }

    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721) {
        revert("Soulbound: Transfers disabled");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public override(ERC721) {
        revert("Soulbound: Transfers disabled");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public override(ERC721) {
        revert("Soulbound: Transfers disabled");
    }
    enum BadgeType { Approvals, ResponseTime, Longevity }

    struct Badge {
        BadgeType badgeType;
        uint256 level;
        uint256 timestamp;
    }

    // tokenId => Badge
    mapping(uint256 => Badge) badges;
    // guardian => badge type => tokenId
    mapping(address => mapping(BadgeType => uint256)) guardianBadges;
    private uint256 _tokenIdCounter;

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
