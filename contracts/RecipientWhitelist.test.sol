// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/RecipientWhitelist.sol";
import "../contracts/SpendVaultWithRecipientWhitelist.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock ERC721 for guardian tokens
contract MockGuardianToken is ERC721 {
    uint256 public tokenCounter = 0;
    
    constructor() ERC721("GuardianToken", "GUARD") {}
    
    function mint(address to) public {
        _mint(to, tokenCounter);
        tokenCounter++;
    }
    
    function burn(uint256 tokenId) public {
        _burn(tokenId);
    }
}

// Mock ERC20 token
contract MockToken is ERC20 {
    constructor() ERC20("MockToken", "MOCK") {}
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}

contract RecipientWhitelistTest is Test {
    RecipientWhitelist public whitelist;
    SpendVaultWithRecipientWhitelist public vault;
    MockGuardianToken public guardianToken;
    MockToken public token;
    
    address public owner;
    address public guardian1;
    address public guardian2;
    address public guardian3;
    address public recipient1;
    address public recipient2;
    address public recipient3;
    address public unauthorized;
    
    function setUp() public {
        // Set up accounts
        owner = address(this);
        guardian1 = address(0x1111);
        guardian2 = address(0x2222);
        guardian3 = address(0x3333);
        recipient1 = address(0xAAAA);
        recipient2 = address(0xBBBB);
        recipient3 = address(0xCCCC);
        unauthorized = address(0xDDDD);
        
        // Deploy contracts
        guardianToken = new MockGuardianToken();
        whitelist = new RecipientWhitelist();
        vault = new SpendVaultWithRecipientWhitelist(
            address(guardianToken),
            address(whitelist),
            2 // quorum of 2
        );
        
        // Deploy test token
        token = new MockToken();
        
        // Mint guardian tokens
        guardianToken.mint(guardian1);
        guardianToken.mint(guardian2);
        guardianToken.mint(guardian3);
        
        // Fund vault and recipients
        token.mint(address(vault), 1000e18);
        token.approve(address(vault), 1000e18);
    }
    
    // ============ Recipient Management Tests ============
    
    function testAddRecipient() public {
        whitelist.addRecipient(address(vault), recipient1, "Treasury", 100e18);
        
        assert(whitelist.isWhitelisted(address(vault), recipient1));
        RecipientWhitelist.WhitelistEntry memory entry = whitelist.getRecipientInfo(
            address(vault),
            recipient1
        );
        assert(entry.isWhitelisted);
        assert(keccak256(abi.encodePacked(entry.name)) == keccak256(abi.encodePacked("Treasury")));
        assert(entry.dailyLimit == 100e18);
    }
    
    function testAddMultipleRecipients() public {
        whitelist.addRecipient(address(vault), recipient1, "Treasury", 100e18);
        whitelist.addRecipient(address(vault), recipient2, "Operations", 50e18);
        whitelist.addRecipient(address(vault), recipient3, "Marketing", 25e18);
        
        uint256 count = whitelist.getWhitelistCount(address(vault));
        assert(count == 3);
        
        address[] memory recipients = whitelist.getWhitelistedRecipients(address(vault));
        assert(recipients.length == 3);
    }
    
    function testRemoveRecipient() public {
        whitelist.addRecipient(address(vault), recipient1, "Treasury", 100e18);
        assert(whitelist.isWhitelisted(address(vault), recipient1));
        
        whitelist.removeRecipient(address(vault), recipient1);
        assert(!whitelist.isWhitelisted(address(vault), recipient1));
    }
    
    function testCannotAddDuplicateRecipient() public {
        whitelist.addRecipient(address(vault), recipient1, "Treasury", 100e18);
        
        vm.expectRevert("RecipientWhitelist: Already whitelisted");
        whitelist.addRecipient(address(vault), recipient1, "Treasury", 100e18);
    }
    
    function testCannotRemoveNonexistentRecipient() public {
        vm.expectRevert("RecipientWhitelist: Not whitelisted");
        whitelist.removeRecipient(address(vault), recipient1);
    }
    
    function testUpdateRecipientLimit() public {
        whitelist.addRecipient(address(vault), recipient1, "Treasury", 100e18);
        whitelist.updateRecipientLimit(address(vault), recipient1, 200e18);
        
        RecipientWhitelist.WhitelistEntry memory entry = whitelist.getRecipientInfo(
            address(vault),
            recipient1
        );
        assert(entry.dailyLimit == 200e18);
    }
    
    // ============ Whitelist Enforcement Tests ============
    
    function testWhitelistEnforcement_UnwhitelistedRecipient() public {
        whitelist.addRecipient(address(vault), recipient1, "Treasury", 100e18);
        
        (bool allowed, string memory reason) = whitelist.checkRecipientWhitelist(
            address(vault),
            recipient2, // Not whitelisted
            address(token),
            10e18
        );
        
        assert(!allowed);
        assert(keccak256(abi.encodePacked(reason)) == keccak256(abi.encodePacked("Recipient not whitelisted")));
    }
    
    function testWhitelistEnforcement_AllowedRecipient() public {
        whitelist.addRecipient(address(vault), recipient1, "Treasury", 100e18);
        
        (bool allowed, string memory reason) = whitelist.checkRecipientWhitelist(
            address(vault),
            recipient1, // Whitelisted
            address(token),
            10e18
        );
        
        assert(allowed);
    }
    
    function testWhitelistEnforcement_UnlimitedRecipient() public {
        whitelist.addRecipient(address(vault), recipient1, "Treasury", 0); // 0 = unlimited
        
        (bool allowed, ) = whitelist.checkRecipientWhitelist(
            address(vault),
            recipient1,
            address(token),
            10000e18 // Huge amount
        );
        
        assert(allowed);
    }
    
    function testRecipientDailyLimit() public {
        whitelist.addRecipient(address(vault), recipient1, "Treasury", 100e18);
        
        // First withdrawal within limit
        (bool allowed1, ) = whitelist.checkRecipientWhitelist(
            address(vault),
            recipient1,
            address(token),
            80e18
        );
        assert(allowed1);
        
        // Record first withdrawal
        whitelist.recordWithdrawal(address(vault), recipient1, address(token), 80e18);
        
        // Second withdrawal exceeds limit
        (bool allowed2, string memory reason2) = whitelist.checkRecipientWhitelist(
            address(vault),
            recipient1,
            address(token),
            30e18 // 80 + 30 = 110 > 100
        );
        assert(!allowed2);
        assert(keccak256(abi.encodePacked(reason2)) == 
               keccak256(abi.encodePacked("Recipient daily limit exceeded")));
    }
    
    function testRecipientDailyLimit_AutoReset() public {
        whitelist.addRecipient(address(vault), recipient1, "Treasury", 100e18);
        
        // Spend 100 on day 1
        whitelist.recordWithdrawal(address(vault), recipient1, address(token), 100e18);
        
        // Check spending on day 1
        (uint256 spent1, uint256 limit1, uint256 remaining1) = whitelist.getRecipientDailySpending(
            address(vault),
            recipient1,
            address(token)
        );
        assert(spent1 == 100e18);
        assert(remaining1 == 0);
        
        // Advance time to next day
        vm.warp(block.timestamp + 1 days);
        
        // Check spending on day 2 (should be reset)
        (uint256 spent2, uint256 limit2, uint256 remaining2) = whitelist.getRecipientDailySpending(
            address(vault),
            recipient1,
            address(token)
        );
        assert(spent2 == 0);
        assert(remaining2 == 100e18);
    }
    
    // ============ Emergency Mode Tests ============
    
    function testActivateEmergencyMode() public {
        whitelist.activateEmergencyMode(address(vault));
        
        assert(whitelist.isEmergencyMode(address(vault)));
        (bool active, address activatedBy, ) = whitelist.getEmergencyModeStatus(address(vault));
        assert(active);
        assert(activatedBy == owner);
    }
    
    function testDeactivateEmergencyMode() public {
        whitelist.activateEmergencyMode(address(vault));
        assert(whitelist.isEmergencyMode(address(vault)));
        
        whitelist.deactivateEmergencyMode(address(vault));
        assert(!whitelist.isEmergencyMode(address(vault)));
    }
    
    function testEmergencyMode_BypassesWhitelist() public {
        // Recipient not whitelisted
        assert(!whitelist.isWhitelisted(address(vault), recipient1));
        
        // Activate emergency mode
        whitelist.activateEmergencyMode(address(vault));
        
        // Now check is allowed despite not being whitelisted
        (bool allowed, ) = whitelist.checkRecipientWhitelist(
            address(vault),
            recipient1,
            address(token),
            50e18
        );
        assert(allowed);
    }
    
    function testCannotActivateEmergencyModeTwice() public {
        whitelist.activateEmergencyMode(address(vault));
        
        vm.expectRevert("RecipientWhitelist: Already in emergency mode");
        whitelist.activateEmergencyMode(address(vault));
    }
    
    function testCannotDeactivateWhenNotActive() public {
        vm.expectRevert("RecipientWhitelist: Not in emergency mode");
        whitelist.deactivateEmergencyMode(address(vault));
    }
    
    // ============ Real-World Scenario Tests ============
    
    function testScenario_CorporateTreasury() public {
        // CEO account
        address ceo = recipient1;
        // CFO account
        address cfo = recipient2;
        // General operations account
        address operations = recipient3;
        
        // Add recipients with limits
        whitelist.addRecipient(address(vault), ceo, "CEO Account", 500e18); // $500k daily
        whitelist.addRecipient(address(vault), cfo, "CFO Account", 300e18); // $300k daily
        whitelist.addRecipient(address(vault), operations, "Operations", 100e18); // $100k daily
        
        // CEO withdraws $400k (within limit)
        whitelist.recordWithdrawal(address(vault), ceo, address(token), 400e18);
        (uint256 ceoSpent, , uint256 ceoRemaining) = whitelist.getRecipientDailySpending(
            address(vault),
            ceo,
            address(token)
        );
        assert(ceoSpent == 400e18);
        assert(ceoRemaining == 100e18);
        
        // CFO withdraws $300k (reaches limit)
        whitelist.recordWithdrawal(address(vault), cfo, address(token), 300e18);
        (uint256 cfoSpent, , uint256 cfoRemaining) = whitelist.getRecipientDailySpending(
            address(vault),
            cfo,
            address(token)
        );
        assert(cfoSpent == 300e18);
        assert(cfoRemaining == 0);
        
        // Operations tries to withdraw $120k (exceeds $100k limit)
        (bool allowed, ) = whitelist.checkRecipientWhitelist(
            address(vault),
            operations,
            address(token),
            120e18
        );
        assert(!allowed);
        
        // Operations can withdraw $100k (exactly at limit)
        (bool allowed2, ) = whitelist.checkRecipientWhitelist(
            address(vault),
            operations,
            address(token),
            100e18
        );
        assert(allowed2);
    }
    
    function testScenario_DAOTreasury() public {
        address multiSig = recipient1;
        address treasury = recipient2;
        address unidentified = recipient3;
        
        // Only approved treasury accounts
        whitelist.addRecipient(address(vault), multiSig, "DAO MultiSig", 0); // Unlimited
        whitelist.addRecipient(address(vault), treasury, "Treasury", 500e18);
        
        // Unidentified recipient not whitelisted
        (bool allowed, string memory reason) = whitelist.checkRecipientWhitelist(
            address(vault),
            unidentified,
            address(token),
            100e18
        );
        assert(!allowed);
        assert(keccak256(abi.encodePacked(reason)) == 
               keccak256(abi.encodePacked("Recipient not whitelisted")));
        
        // MultiSig can withdraw unlimited amounts
        (bool allowedUnlimited, ) = whitelist.checkRecipientWhitelist(
            address(vault),
            multiSig,
            address(token),
            10000e18
        );
        assert(allowedUnlimited);
    }
    
    function testScenario_Authorization() public {
        // Only owner can add recipients
        vm.prank(unauthorized);
        vm.expectRevert("Ownable: caller is not the owner");
        whitelist.addRecipient(address(vault), recipient1, "Test", 100e18);
        
        // Only owner can remove recipients
        whitelist.addRecipient(address(vault), recipient1, "Test", 100e18);
        vm.prank(unauthorized);
        vm.expectRevert("Ownable: caller is not the owner");
        whitelist.removeRecipient(address(vault), recipient1);
        
        // Only owner can activate emergency mode
        vm.prank(unauthorized);
        vm.expectRevert("Ownable: caller is not the owner");
        whitelist.activateEmergencyMode(address(vault));
    }
    
    // ============ View Functions Tests ============
    
    function testGetRecipientInfo() public {
        whitelist.addRecipient(address(vault), recipient1, "Treasury", 100e18);
        
        RecipientWhitelist.WhitelistEntry memory entry = whitelist.getRecipientInfo(
            address(vault),
            recipient1
        );
        
        assert(entry.isWhitelisted);
        assert(keccak256(abi.encodePacked(entry.name)) == keccak256(abi.encodePacked("Treasury")));
        assert(entry.dailyLimit == 100e18);
        assert(entry.addedAt > 0);
    }
    
    function testGetWhitelistedRecipients() public {
        whitelist.addRecipient(address(vault), recipient1, "R1", 100e18);
        whitelist.addRecipient(address(vault), recipient2, "R2", 100e18);
        whitelist.addRecipient(address(vault), recipient3, "R3", 100e18);
        
        address[] memory recipients = whitelist.getWhitelistedRecipients(address(vault));
        assert(recipients.length == 3);
        assert(recipients[0] == recipient1);
        assert(recipients[1] == recipient2);
        assert(recipients[2] == recipient3);
    }
}
