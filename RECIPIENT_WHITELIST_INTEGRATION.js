/**
 * RECIPIENT_WHITELIST_INTEGRATION.js
 * Production-ready JavaScript functions for Recipient Whitelist integration
 * 
 * This file provides 12 production-ready functions for managing recipient whitelists
 * in your SpendGuard vault applications.
 */

// ============ 1. CONFIGURATION HELPERS ============

/**
 * Configure multiple recipients at once
 * @param {Contract} whitelistContract - RecipientWhitelist contract instance
 * @param {string} vaultAddress - Vault address
 * @param {Array} recipientConfigs - Array of {address, name, dailyLimit}
 * @returns {Promise<Array>} Array of transaction hashes
 * 
 * @example
 * await configureRecipients(whitelist, vault, [
 *   { address: '0xCEO...', name: 'CEO Account', dailyLimit: ethers.parseEther('500') },
 *   { address: '0xCFO...', name: 'CFO Account', dailyLimit: ethers.parseEther('300') }
 * ]);
 */
async function configureRecipients(whitelistContract, vaultAddress, recipientConfigs) {
  const txHashes = [];
  
  for (const config of recipientConfigs) {
    try {
      console.log(`Adding recipient: ${config.name} (${config.address})`);
      const tx = await whitelistContract.addRecipient(
        vaultAddress,
        config.address,
        config.name,
        config.dailyLimit
      );
      await tx.wait();
      txHashes.push(tx.hash);
      console.log(`✓ Added ${config.name}`);
    } catch (error) {
      console.error(`✗ Failed to add ${config.name}:`, error.message);
      throw error;
    }
  }
  
  return txHashes;
}

/**
 * Bulk update recipient limits
 * @param {Contract} whitelistContract - RecipientWhitelist contract instance
 * @param {string} vaultAddress - Vault address
 * @param {Array} limitUpdates - Array of {address, newLimit}
 * @returns {Promise<Array>} Array of transaction hashes
 * 
 * @example
 * await updateRecipientLimits(whitelist, vault, [
 *   { address: '0xCEO...', newLimit: ethers.parseEther('750') },
 *   { address: '0xCFO...', newLimit: ethers.parseEther('400') }
 * ]);
 */
async function updateRecipientLimits(whitelistContract, vaultAddress, limitUpdates) {
  const txHashes = [];
  
  for (const update of limitUpdates) {
    try {
      console.log(`Updating limit for ${update.address}`);
      const tx = await whitelistContract.updateRecipientLimit(
        vaultAddress,
        update.address,
        update.newLimit
      );
      await tx.wait();
      txHashes.push(tx.hash);
      console.log(`✓ Updated limit for ${update.address}`);
    } catch (error) {
      console.error(`✗ Failed to update ${update.address}:`, error.message);
      throw error;
    }
  }
  
  return txHashes;
}

// ============ 2. WHITELIST CHECKING ============

/**
 * Check if withdrawal to recipient is allowed
 * @param {Contract} whitelistContract - RecipientWhitelist contract instance
 * @param {string} vaultAddress - Vault address
 * @param {string} recipientAddress - Recipient address to check
 * @param {string} tokenAddress - Token being withdrawn
 * @param {BigNumber} amount - Amount to withdraw
 * @returns {Promise<Object>} {allowed: bool, reason: string}
 * 
 * @example
 * const {allowed, reason} = await checkRecipientAllowed(
 *   whitelist, vault, recipient, token, ethers.parseEther('100')
 * );
 * if (!allowed) console.error(reason);
 */
async function checkRecipientAllowed(
  whitelistContract,
  vaultAddress,
  recipientAddress,
  tokenAddress,
  amount
) {
  try {
    const [allowed, reason] = await whitelistContract.checkRecipientWhitelist(
      vaultAddress,
      recipientAddress,
      tokenAddress,
      amount
    );
    
    return {
      allowed,
      reason: reason || 'Approved'
    };
  } catch (error) {
    console.error('Error checking recipient:', error.message);
    return {
      allowed: false,
      reason: error.message
    };
  }
}

/**
 * Get recipient whitelistatus
 * @param {Contract} whitelistContract - RecipientWhitelist contract instance
 * @param {string} vaultAddress - Vault address
 * @param {string} recipientAddress - Recipient address
 * @returns {Promise<Object>} {isWhitelisted, name, dailyLimit, addedAt}
 * 
 * @example
 * const status = await getRecipientStatus(whitelist, vault, recipient);
 * console.log(`${status.name}: ${status.isWhitelisted ? 'Approved' : 'Denied'}`);
 */
async function getRecipientStatus(whitelistContract, vaultAddress, recipientAddress) {
  try {
    const entry = await whitelistContract.getRecipientInfo(vaultAddress, recipientAddress);
    const isWhitelisted = await whitelistContract.isWhitelisted(vaultAddress, recipientAddress);
    
    return {
      address: recipientAddress,
      isWhitelisted,
      name: entry.name,
      dailyLimit: entry.dailyLimit.toString(),
      addedAt: new Date(entry.addedAt.toNumber() * 1000)
    };
  } catch (error) {
    console.error('Error getting recipient status:', error.message);
    throw error;
  }
}

// ============ 3. SPENDING QUERIES ============

/**
 * Get recipient's current daily spending
 * @param {Contract} whitelistContract - RecipientWhitelist contract instance
 * @param {string} vaultAddress - Vault address
 * @param {string} recipientAddress - Recipient address
 * @param {string} tokenAddress - Token address
 * @returns {Promise<Object>} {dailySpent, dailyLimit, dailyRemaining, percentUsed}
 * 
 * @example
 * const spending = await getRecipientDailySpending(
 *   whitelist, vault, recipient, token
 * );
 * console.log(`Used ${spending.percentUsed}% of daily limit`);
 */
async function getRecipientDailySpending(
  whitelistContract,
  vaultAddress,
  recipientAddress,
  tokenAddress
) {
  try {
    const [dailySpent, dailyLimit, dailyRemaining] = 
      await whitelistContract.getRecipientDailySpending(
        vaultAddress,
        recipientAddress,
        tokenAddress
      );
    
    const percentUsed = dailyLimit === 0n ? 0 : 
      (Number(dailySpent) / Number(dailyLimit) * 100).toFixed(2);
    
    return {
      dailySpent: dailySpent.toString(),
      dailyLimit: dailyLimit.toString(),
      dailyRemaining: dailyRemaining.toString(),
      percentUsed: parseFloat(percentUsed),
      isUnlimited: dailyLimit === 0n
    };
  } catch (error) {
    console.error('Error getting daily spending:', error.message);
    throw error;
  }
}

/**
 * Get all whitelisted recipients for a vault
 * @param {Contract} whitelistContract - RecipientWhitelist contract instance
 * @param {string} vaultAddress - Vault address
 * @returns {Promise<Array>} Array of recipient objects with status and limits
 * 
 * @example
 * const recipients = await getAllWhitelistedRecipients(whitelist, vault);
 * recipients.forEach(r => console.log(`${r.name}: ${r.dailyLimit}`));
 */
async function getAllWhitelistedRecipients(whitelistContract, vaultAddress) {
  try {
    const recipientAddresses = await whitelistContract.getWhitelistedRecipients(vaultAddress);
    const count = await whitelistContract.getWhitelistCount(vaultAddress);
    
    console.log(`Found ${count} whitelisted recipients`);
    
    const recipients = [];
    for (const address of recipientAddresses) {
      const entry = await whitelistContract.getRecipientInfo(vaultAddress, address);
      if (entry.isWhitelisted) {
        recipients.push({
          address,
          name: entry.name,
          dailyLimit: entry.dailyLimit.toString(),
          addedAt: new Date(entry.addedAt.toNumber() * 1000),
          dailyLimitFormatted: ethers.formatEther(entry.dailyLimit) + ' units'
        });
      }
    }
    
    return recipients;
  } catch (error) {
    console.error('Error getting whitelisted recipients:', error.message);
    throw error;
  }
}

// ============ 4. WITHDRAWAL EXECUTION ============

/**
 * Execute withdrawal with recipient whitelist check
 * Performs all validation before executing withdrawal
 * 
 * @param {Contract} vaultContract - SpendVaultWithRecipientWhitelist instance
 * @param {Contract} whitelistContract - RecipientWhitelist instance
 * @param {Object} withdrawalParams - {token, amount, recipient, reason}
 * @param {Array<string>} guardianSignatures - Signed withdrawal hashes
 * @returns {Promise<Object>} {success, hash, recipient, amount}
 * 
 * @example
 * const result = await executeWithdrawalWithRecipientCheck(
 *   vault, whitelist,
 *   {
 *     token: tokenAddress,
 *     amount: ethers.parseEther('100'),
 *     recipient: '0xRecipient...',
 *     reason: 'Quarterly dividend'
 *   },
 *   [signature1, signature2]
 * );
 */
async function executeWithdrawalWithRecipientCheck(
  vaultContract,
  whitelistContract,
  withdrawalParams,
  guardianSignatures
) {
  const { token, amount, recipient, reason } = withdrawalParams;
  
  try {
    // Step 1: Check recipient whitelist
    console.log(`Checking recipient ${recipient}...`);
    const { allowed, reason: rejectionReason } = await checkRecipientAllowed(
      whitelistContract,
      vaultContract.address,
      recipient,
      token,
      amount
    );
    
    if (!allowed) {
      return {
        success: false,
        error: rejectionReason,
        recipient,
        amount: amount.toString()
      };
    }
    console.log(`✓ Recipient approved`);
    
    // Step 2: Check spending limits
    console.log(`Checking daily spending limits...`);
    const spending = await getRecipientDailySpending(
      whitelistContract,
      vaultContract.address,
      recipient,
      token
    );
    
    console.log(`✓ Daily spending: ${spending.percentUsed}% of limit`);
    
    // Step 3: Execute withdrawal
    console.log(`Executing withdrawal of ${ethers.formatEther(amount)} to ${recipient}...`);
    const tx = await vaultContract.withdrawWithRecipientCheck(
      token,
      amount,
      recipient,
      reason,
      guardianSignatures
    );
    
    const receipt = await tx.wait();
    
    console.log(`✓ Withdrawal executed: ${tx.hash}`);
    
    return {
      success: true,
      hash: tx.hash,
      recipient,
      amount: amount.toString(),
      reason,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error(`✗ Withdrawal failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      recipient,
      amount: amount.toString()
    };
  }
}

// ============ 5. RECIPIENT MANAGEMENT ============

/**
 * Add a new recipient
 * @param {Contract} whitelistContract - RecipientWhitelist contract instance
 * @param {string} vaultAddress - Vault address
 * @param {string} recipientAddress - Address to whitelist
 * @param {string} name - Recipient name/description
 * @param {BigNumber} dailyLimit - Daily withdrawal limit (0 = unlimited)
 * @returns {Promise<Object>} {success, hash, recipient}
 * 
 * @example
 * await addRecipient(
 *   whitelist, vault,
 *   '0xRecipient...',
 *   'Operations Account',
 *   ethers.parseEther('100')
 * );
 */
async function addRecipient(
  whitelistContract,
  vaultAddress,
  recipientAddress,
  name,
  dailyLimit
) {
  try {
    console.log(`Adding recipient: ${name} (${recipientAddress})`);
    const tx = await whitelistContract.addRecipient(
      vaultAddress,
      recipientAddress,
      name,
      dailyLimit
    );
    await tx.wait();
    
    console.log(`✓ Added ${name}`);
    return {
      success: true,
      hash: tx.hash,
      recipient: recipientAddress,
      name
    };
  } catch (error) {
    console.error(`✗ Failed to add ${name}:`, error.message);
    return {
      success: false,
      error: error.message,
      recipient: recipientAddress
    };
  }
}

/**
 * Remove a recipient from whitelist
 * @param {Contract} whitelistContract - RecipientWhitelist contract instance
 * @param {string} vaultAddress - Vault address
 * @param {string} recipientAddress - Address to remove
 * @returns {Promise<Object>} {success, hash}
 * 
 * @example
 * await removeRecipient(whitelist, vault, '0xRecipient...');
 */
async function removeRecipient(whitelistContract, vaultAddress, recipientAddress) {
  try {
    console.log(`Removing recipient ${recipientAddress}...`);
    const tx = await whitelistContract.removeRecipient(vaultAddress, recipientAddress);
    await tx.wait();
    
    console.log(`✓ Removed ${recipientAddress}`);
    return {
      success: true,
      hash: tx.hash
    };
  } catch (error) {
    console.error(`✗ Failed to remove recipient:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============ 6. EMERGENCY MODE ============

/**
 * Activate emergency mode (bypasses whitelist)
 * @param {Contract} whitelistContract - RecipientWhitelist contract instance
 * @param {string} vaultAddress - Vault address
 * @returns {Promise<Object>} {success, hash, activated}
 * 
 * @example
 * await activateEmergencyMode(whitelist, vault);
 * // Now any address can receive funds
 */
async function activateEmergencyMode(whitelistContract, vaultAddress) {
  try {
    console.log(`Activating emergency mode for ${vaultAddress}...`);
    const tx = await whitelistContract.activateEmergencyMode(vaultAddress);
    await tx.wait();
    
    console.log(`✓ Emergency mode activated`);
    return {
      success: true,
      hash: tx.hash,
      activated: true
    };
  } catch (error) {
    console.error(`✗ Failed to activate emergency mode:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Deactivate emergency mode (re-enable whitelist)
 * @param {Contract} whitelistContract - RecipientWhitelist contract instance
 * @param {string} vaultAddress - Vault address
 * @returns {Promise<Object>} {success, hash}
 * 
 * @example
 * await deactivateEmergencyMode(whitelist, vault);
 * // Whitelist enforcement re-enabled
 */
async function deactivateEmergencyMode(whitelistContract, vaultAddress) {
  try {
    console.log(`Deactivating emergency mode for ${vaultAddress}...`);
    const tx = await whitelistContract.deactivateEmergencyMode(vaultAddress);
    await tx.wait();
    
    console.log(`✓ Emergency mode deactivated`);
    return {
      success: true,
      hash: tx.hash,
      activated: false
    };
  } catch (error) {
    console.error(`✗ Failed to deactivate emergency mode:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get emergency mode status
 * @param {Contract} whitelistContract - RecipientWhitelist contract instance
 * @param {string} vaultAddress - Vault address
 * @returns {Promise<Object>} {active, activatedBy, activatedAt}
 * 
 * @example
 * const status = await getEmergencyModeStatus(whitelist, vault);
 * if (status.active) console.warn('Emergency mode is ACTIVE');
 */
async function getEmergencyModeStatus(whitelistContract, vaultAddress) {
  try {
    const [active, activatedBy, activatedAt] = 
      await whitelistContract.getEmergencyModeStatus(vaultAddress);
    
    return {
      active,
      activatedBy,
      activatedAt: new Date(activatedAt.toNumber() * 1000),
      description: active ? 'EMERGENCY MODE ACTIVE' : 'Normal mode'
    };
  } catch (error) {
    console.error('Error getting emergency mode status:', error.message);
    throw error;
  }
}

// ============ 7. MONITORING & REPORTING ============

/**
 * Generate recipient whitelist report
 * @param {Contract} whitelistContract - RecipientWhitelist contract instance
 * @param {string} vaultAddress - Vault address
 * @param {string} tokenAddress - Token address for spending query
 * @returns {Promise<string>} Formatted report
 * 
 * @example
 * const report = await generateWhitelistReport(whitelist, vault, token);
 * console.log(report);
 */
async function generateWhitelistReport(whitelistContract, vaultAddress, tokenAddress) {
  try {
    const recipients = await getAllWhitelistedRecipients(whitelistContract, vaultAddress);
    const emergencyStatus = await getEmergencyModeStatus(whitelistContract, vaultAddress);
    
    let report = '\n═══════════════════════════════════════\n';
    report += '    RECIPIENT WHITELIST REPORT\n';
    report += '═══════════════════════════════════════\n\n';
    
    report += `Emergency Mode: ${emergencyStatus.active ? '🔴 ACTIVE' : '🟢 Inactive'}\n`;
    if (emergencyStatus.active) {
      report += `  Activated: ${emergencyStatus.activatedAt}\n`;
    }
    report += `\nTotal Recipients: ${recipients.length}\n\n`;
    
    report += '┌─────────────────────────────────────┐\n';
    report += '│ WHITELISTED RECIPIENTS              │\n';
    report += '├─────────────────────────────────────┤\n';
    
    for (const recipient of recipients) {
      const spending = await getRecipientDailySpending(
        whitelistContract,
        vaultAddress,
        recipient.address,
        tokenAddress
      );
      
      report += `\n${recipient.name}\n`;
      report += `  Address: ${recipient.address}\n`;
      report += `  Daily Limit: ${recipient.dailyLimitFormatted}\n`;
      report += `  Today's Usage: ${spending.percentUsed}%\n`;
      report += `  Remaining: ${ethers.formatEther(spending.dailyRemaining)} units\n`;
    }
    
    report += '\n└─────────────────────────────────────┘\n';
    report += '═══════════════════════════════════════\n\n';
    
    return report;
  } catch (error) {
    console.error('Error generating report:', error.message);
    throw error;
  }
}

/**
 * Setup event listeners for whitelist changes
 * @param {Contract} whitelistContract - RecipientWhitelist contract instance
 * @param {Function} onRecipientAdded - Callback for RecipientAdded event
 * @param {Function} onRecipientRemoved - Callback for RecipientRemoved event
 * @param {Function} onEmergencyMode - Callback for emergency mode events
 * 
 * @example
 * setupWhitelistEventListeners(
 *   whitelist,
 *   (vault, recipient, name) => console.log(`Added: ${name}`),
 *   (vault, recipient) => console.log(`Removed: ${recipient}`),
 *   (vault, active) => console.log(`Emergency: ${active}`)
 * );
 */
function setupWhitelistEventListeners(
  whitelistContract,
  onRecipientAdded,
  onRecipientRemoved,
  onEmergencyMode
) {
  // Listen for RecipientAdded
  whitelistContract.on('RecipientAdded', (vault, recipient, name, dailyLimit) => {
    console.log(`[WHITELIST] Recipient added: ${name}`);
    if (onRecipientAdded) onRecipientAdded(vault, recipient, name, dailyLimit);
  });
  
  // Listen for RecipientRemoved
  whitelistContract.on('RecipientRemoved', (vault, recipient) => {
    console.log(`[WHITELIST] Recipient removed: ${recipient}`);
    if (onRecipientRemoved) onRecipientRemoved(vault, recipient);
  });
  
  // Listen for EmergencyModeActivated
  whitelistContract.on('EmergencyModeActivated', (vault, activatedBy) => {
    console.warn(`[ALERT] Emergency mode ACTIVATED by ${activatedBy}`);
    if (onEmergencyMode) onEmergencyMode(vault, true, activatedBy);
  });
  
  // Listen for EmergencyModeDeactivated
  whitelistContract.on('EmergencyModeDeactivated', (vault, deactivatedBy) => {
    console.log(`[WHITELIST] Emergency mode deactivated by ${deactivatedBy}`);
    if (onEmergencyMode) onEmergencyMode(vault, false, deactivatedBy);
  });
}

// ============ EXPORTS ============

module.exports = {
  // Configuration
  configureRecipients,
  updateRecipientLimits,
  
  // Checking
  checkRecipientAllowed,
  getRecipientStatus,
  
  // Spending
  getRecipientDailySpending,
  getAllWhitelistedRecipients,
  
  // Execution
  executeWithdrawalWithRecipientCheck,
  
  // Management
  addRecipient,
  removeRecipient,
  
  // Emergency
  activateEmergencyMode,
  deactivateEmergencyMode,
  getEmergencyModeStatus,
  
  // Monitoring
  generateWhitelistReport,
  setupWhitelistEventListeners
};

// ============ USAGE EXAMPLE ============

/*
const { ethers } = require('ethers');
const whitelistFuncs = require('./RECIPIENT_WHITELIST_INTEGRATION.js');

// Setup
const whitelistAddress = '0x...';
const vaultAddress = '0x...';
const provider = new ethers.JsonRpcProvider('...');
const signer = new ethers.Wallet('...', provider);

const whitelistABI = [...]; // Load ABI
const whitelistContract = new ethers.Contract(whitelistAddress, whitelistABI, signer);

// Add recipients
await whitelistFuncs.configureRecipients(
  whitelistContract,
  vaultAddress,
  [
    { address: '0xCEO...', name: 'CEO', dailyLimit: ethers.parseEther('500') },
    { address: '0xOps...', name: 'Operations', dailyLimit: ethers.parseEther('100') }
  ]
);

// Check withdrawal allowed
const result = await whitelistFuncs.checkRecipientAllowed(
  whitelistContract,
  vaultAddress,
  '0xCEO...',
  tokenAddress,
  ethers.parseEther('100')
);

// Get report
const report = await whitelistFuncs.generateWhitelistReport(
  whitelistContract,
  vaultAddress,
  tokenAddress
);
console.log(report);
*/
