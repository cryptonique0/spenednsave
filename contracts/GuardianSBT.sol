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

    // Guardian address => vault addresses
    mapping(address => address[]) private guardianVaults;
    // Vault address => guardian addresses
    mapping(address => address[]) private vaultGuardians;

    event GuardianAdded(address indexed guardian, uint256 tokenId, address indexed vault);
    event GuardianRemoved(address indexed guardian, uint256 tokenId, address indexed vault);

    constructor() ERC721("SpendGuard Guardian", "GUARDIAN") Ownable(msg.sender) {}

    /**
     * @notice Mint a new Guardian SBT to a friend's address
     * @param to Address of the new guardian
     */
    /**
     * @notice Mint a new Guardian SBT to a friend's address for a specific vault
     * @param to Address of the new guardian
     * @param vault Address of the associated SpendVault
     */
    function mint(address to, address vault) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(vault != address(0), "Vault address required");
        // Allow multiple vaults per guardian
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        guardianVaults[to].push(vault);
        vaultGuardians[vault].push(to);
        emit GuardianAdded(to, tokenId, vault);
    }

    /**
     * @notice Burn a Guardian SBT to remove a guardian
     * @param tokenId ID of the token to burn
     */
    function burn(uint256 tokenId, address vault) external onlyOwner {
        address guardian = ownerOf(tokenId);
        _burn(tokenId);
        // Remove vault association for guardian
        address[] storage vaults = guardianVaults[guardian];
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i] == vault) {
                vaults[i] = vaults[vaults.length - 1];
                vaults.pop();
                break;
            }
        }
        // Remove guardian from vaultGuardians
        address[] storage guardians = vaultGuardians[vault];
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardians[i] == guardian) {
                guardians[i] = guardians[guardians.length - 1];
                guardians.pop();
                break;
            }
        }
        emit GuardianRemoved(guardian, tokenId, vault);
    }
    /**
     * @notice Get all vaults where an address is an active guardian
     * @param guardian Guardian address
     * @return vaults Array of vault addresses
     */
    function getVaultsForGuardian(address guardian) external view returns (address[] memory vaults) {
        return guardianVaults[guardian];
    }

    /**
     * @notice Get all guardians for a vault
     * @param vault Vault address
     * @return guardians Array of guardian addresses
     */
    function getGuardiansForVault(address vault) external view returns (address[] memory guardians) {
        return vaultGuardians[vault];
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
