// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./GuardianSBT.sol";
import "./SpendVaultUpgradeable.sol";

/**
 * @title VaultFactoryUpgradeable
 * @notice Factory contract for deploying upgradable user-specific vaults and guardian tokens
 */
contract VaultFactoryUpgradeable {
    event VaultCreated(
        address indexed owner,
        address guardianToken,
        address vault,
        uint256 quorum
    );

    mapping(address => address) public userVaults;
    mapping(address => address) public userGuardianTokens;
    address[] public allVaults;

    address public immutable spendVaultImpl;

    constructor(address _spendVaultImpl) {
        spendVaultImpl = _spendVaultImpl;
    }

    function createVault(uint256 _quorum) external returns (address guardianToken, address vault) {
        require(userVaults[msg.sender] == address(0), "Vault already exists for this user");
        require(_quorum > 0, "Quorum must be greater than 0");

        GuardianSBT guardianSBT = new GuardianSBT();
        guardianToken = address(guardianSBT);
        guardianSBT.transferOwnership(msg.sender);

        // Deploy UUPS proxy for SpendVaultUpgradeable
        bytes memory data = abi.encodeWithSelector(
            SpendVaultUpgradeable.initialize.selector,
            guardianToken,
            _quorum
        );
        ERC1967Proxy proxy = new ERC1967Proxy(spendVaultImpl, data);
        vault = address(proxy);

        // Transfer ownership to the user
        SpendVaultUpgradeable(vault).transferOwnership(msg.sender);

        userVaults[msg.sender] = vault;
        userGuardianTokens[msg.sender] = guardianToken;
        allVaults.push(vault);

        emit VaultCreated(msg.sender, guardianToken, vault, _quorum);
    }

    // ...getters as in original VaultFactory...
}
