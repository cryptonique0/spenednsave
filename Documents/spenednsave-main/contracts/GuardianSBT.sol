// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GuardianSBT
 * @notice Soulbound Token (SBT) for SpendGuard Guardians
 * @dev Non-transferable ERC721 tokens that represent guardian status
 */
contract GuardianSBT is ERC721, Ownable {
    uint256 private _nextTokenId;

    event GuardianAdded(address indexed guardian, uint256 tokenId);
    event GuardianRemoved(address indexed guardian, uint256 tokenId);

    constructor() ERC721("SpendGuard Guardian", "GUARDIAN") Ownable(msg.sender) {}

    /**
     * @notice Mint a new Guardian SBT to a friend's address
     * @param to Address of the new guardian
     */
    function mint(address to) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(balanceOf(to) == 0, "Address already has a guardian token");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        
        emit GuardianAdded(to, tokenId);
    }

    /**
     * @notice Burn a Guardian SBT to remove a guardian
     * @param tokenId ID of the token to burn
     */
    function burn(uint256 tokenId) external onlyOwner {
        address guardian = ownerOf(tokenId);
        _burn(tokenId);
        
        emit GuardianRemoved(guardian, tokenId);
    }

    /**
     * @notice Override _update to enforce soulbound property
     * @dev Prevents transfers except for minting and burning
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        // Revert on any other transfer attempt
        if (from != address(0) && to != address(0)) {
            revert("GuardianSBT: token is soulbound and cannot be transferred");
        }
        
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Check if an address is a guardian
     * @param account Address to check
     * @return bool True if the address holds a guardian token
     */
    function isGuardian(address account) external view returns (bool) {
        return balanceOf(account) > 0;
    }
}
