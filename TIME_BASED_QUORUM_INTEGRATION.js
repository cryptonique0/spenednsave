/**
 * Time-Based Quorum Vault Integration Functions
 * Production-ready JavaScript utilities for managing quorum rules
 * 
 * Usage:
 * const quorumManager = new TimeBasedQuorumManager(vaultAddress, signerOrProvider);
 * await quorumManager.configureConservativeRules();
 * const [quorum, sensitive] = await quorumManager.calculateWithdrawalQuorum(token, amount, recipient);
 */

const ethers = require('ethers');

class TimeBasedQuorumManager {
  constructor(vaultAddress, signerOrProvider) {
    this.vaultAddress = vaultAddress;
    this.provider = signerOrProvider;
    
    // ABI for TimeBasedQuorumVault
    this.abi = [
      'function createQuorumTier(uint256 minAmount, uint256 maxAmount, uint256 requiredSignatures, bool isSensitiveAction)',
      'function updateQuorumTier(uint256 tierId, uint256 requiredSignatures, bool isActive)',
      'function createTimeWindow(uint256 startHour, uint256 endHour, uint256 requiredSignatures, string reason)',
      'function updateTimeWindow(uint256 windowId, bool isActive)',
      'function approveRecipient(address recipient)',
      'function revokeRecipient(address recipient)',
      'function setLargeWithdrawalThreshold(uint256 newThreshold)',
      'function setEmergencyThreshold(uint256 newThreshold)',
      'function setDefaultQuorum(uint256 _newQuorum)',
      'function updateGuardianToken(address _newAddress)',
      'function calculateRequiredQuorum(address token, uint256 amount, address recipient) returns (uint256, bool)',
      'function getQuorumTiers() returns (tuple(uint256 minAmount, uint256 maxAmount, uint256 requiredSignatures, bool isActive, bool isSensitiveAction)[])',
      'function getTimeWindows() returns (tuple(uint256 startHour, uint256 endHour, uint256 requiredSignatures, bool isActive, string reason)[])',
      'function getETHBalance() returns (uint256)',
      'function getTokenBalance(address token) returns (uint256)',
      'function withdraw(address token, uint256 amount, address recipient, string reason, bytes[] signatures)',
      'function deposit(address token, uint256 amount)',
      'function getWithdrawalHistoryLength() returns (uint256)',
      'function getWithdrawalRecord(uint256 index) returns (tuple(address token, uint256 amount, address recipient, uint256 timestamp, uint256 requiredQuorum, uint256 actualSignatures, string reason))',
      'function getRecentWithdrawals(uint256 count) returns (tuple(address token, uint256 amount, address recipient, uint256 timestamp, uint256 requiredQuorum, uint256 actualSignatures, string reason)[])',
    ];

    this.contract = new ethers.Contract(vaultAddress, this.abi, signerOrProvider);
  }

  /**
   * Configure conservative (high security) quorum rules
   * Multiple signatures required for all amounts
   */
  async configureConservativeRules() {
    console.log('⚙️ Configuring conservative quorum rules...');

    // Clear defaults - update them to be more strict
    await this.contract.setDefaultQuorum(2);

    // Strict tiers
    await this.contract.createQuorumTier(
      0,           // minAmount
      20n * 10n**18n,  // maxAmount: 20 tokens
      2,           // requiredSignatures
      false        // not sensitive
    );

    await this.contract.createQuorumTier(
      20n * 10n**18n,  // minAmount
      100n * 10n**18n, // maxAmount
      3,           // requiredSignatures
      true         // sensitive
    );

    await this.contract.createQuorumTier(
      100n * 10n**18n, // minAmount
      0,           // maxAmount (unlimited)
      5,           // requiredSignatures (all)
      true         // sensitive
    );

    // Strict time windows
    await this.contract.createTimeWindow(
      9,   // startHour: 9am
      17,  // endHour: 5pm
      2,   // additionalSignatures
      'Business hours - high activity'
    );

    await this.contract.createTimeWindow(
      22,  // startHour: 10pm
      6,   // endHour: 6am (wraps to next day)
      3,   // additionalSignatures
      'Overnight - critical hours'
    );

    // Low sensitivity thresholds
    await this.contract.setLargeWithdrawalThreshold(30n * 10n**18n);
    await this.contract.setEmergencyThreshold(100n * 10n**18n);

    console.log('✅ Conservative rules configured');
  }

  /**
   * Configure moderate (balanced) quorum rules
   * Default tiers with selective time windows
   */
  async configureModerateRules() {
    console.log('⚙️ Configuring moderate quorum rules...');

    // Default quorum
    await this.contract.setDefaultQuorum(2);

    // Moderate time windows
    await this.contract.createTimeWindow(
      9,   // Business hours
      17,
      1,   // +1 during day
      'Business hours'
    );

    await this.contract.createTimeWindow(
      22,  // Overnight
      6,
      2,   // +2 at night
      'Overnight hours'
    );

    // Standard thresholds
    await this.contract.setLargeWithdrawalThreshold(100n * 10n**18n);
    await this.contract.setEmergencyThreshold(500n * 10n**18n);

    console.log('✅ Moderate rules configured');
  }

  /**
   * Configure permissive (fast) quorum rules
   * Quick approvals for normal operations
   */
  async configurePermissiveRules() {
    console.log('⚙️ Configuring permissive quorum rules...');

    // Lower default
    await this.contract.setDefaultQuorum(1);

    // Fast tiers
    await this.contract.createQuorumTier(
      0,
      100n * 10n**18n,
      1,   // Single sig
      false
    );

    await this.contract.createQuorumTier(
      100n * 10n**18n,
      500n * 10n**18n,
      2,
      false
    );

    // No mandatory time windows (or create optional ones)

    // High thresholds (few things are "large")
    await this.contract.setLargeWithdrawalThreshold(500n * 10n**18n);
    await this.contract.setEmergencyThreshold(2000n * 10n**18n);

    console.log('✅ Permissive rules configured');
  }

  /**
   * Add a batch of approved recipients
   * @param {Array<{address: string, name: string}>} recipients
   */
  async addApprovedRecipients(recipients) {
    console.log(`📍 Adding ${recipients.length} approved recipients...`);

    for (const recipient of recipients) {
      try {
        await this.contract.approveRecipient(recipient.address);
        console.log(`  ✅ ${recipient.name}: ${recipient.address}`);
      } catch (error) {
        console.error(`  ❌ Failed to approve ${recipient.name}: ${error.message}`);
      }
    }

    console.log(`✅ Added approved recipients`);
  }

  /**
   * Remove a batch of approved recipients
   * @param {Array<string>} addresses
   */
  async removeApprovedRecipients(addresses) {
    console.log(`🗑️ Removing ${addresses.length} approved recipients...`);

    for (const address of addresses) {
      try {
        await this.contract.revokeRecipient(address);
        console.log(`  ✅ Revoked: ${address}`);
      } catch (error) {
        console.error(`  ❌ Failed to revoke ${address}: ${error.message}`);
      }
    }

    console.log(`✅ Removed approved recipients`);
  }

  /**
   * Calculate required quorum for a withdrawal
   * @param {string} token Token address (0x0 for ETH)
   * @param {BigNumber} amount Withdrawal amount
   * @param {string} recipient Recipient address
   * @returns {Object} {requiredQuorum, isSensitive}
   */
  async calculateWithdrawalQuorum(token, amount, recipient) {
    try {
      const [requiredQuorum, isSensitive] = await this.contract.calculateRequiredQuorum(
        token,
        amount,
        recipient
      );

      return {
        requiredQuorum: requiredQuorum.toNumber(),
        isSensitive,
        isLarge: isSensitive,
        explanation: this._explainQuorum(requiredQuorum, isSensitive)
      };
    } catch (error) {
      console.error('Error calculating quorum:', error.message);
      throw error;
    }
  }

  /**
   * Get all current quorum tiers
   * @returns {Array} Array of tier objects
   */
  async getQuorumTiers() {
    try {
      const tiers = await this.contract.getQuorumTiers();
      
      return tiers.map((tier, index) => ({
        id: index,
        minAmount: ethers.formatEther(tier.minAmount),
        maxAmount: tier.maxAmount.toString() === '0' ? 'Unlimited' : ethers.formatEther(tier.maxAmount),
        requiredSignatures: tier.requiredSignatures.toNumber(),
        isActive: tier.isActive,
        isSensitiveAction: tier.isSensitiveAction
      }));
    } catch (error) {
      console.error('Error fetching tiers:', error.message);
      throw error;
    }
  }

  /**
   * Get all current time windows
   * @returns {Array} Array of window objects
   */
  async getTimeWindows() {
    try {
      const windows = await this.contract.getTimeWindows();
      
      return windows.map((window, index) => ({
        id: index,
        startHour: window.startHour.toNumber(),
        endHour: window.endHour.toNumber(),
        requiredSignatures: window.requiredSignatures.toNumber(),
        isActive: window.isActive,
        reason: window.reason,
        description: this._describeTimeWindow(window.startHour.toNumber(), window.endHour.toNumber())
      }));
    } catch (error) {
      console.error('Error fetching time windows:', error.message);
      throw error;
    }
  }

  /**
   * Create a custom quorum tier
   * @param {BigNumber} minAmount Minimum amount for this tier
   * @param {BigNumber} maxAmount Maximum amount (0 for unlimited)
   * @param {number} requiredSignatures Number of signatures required
   * @param {boolean} isSensitiveAction Whether to mark as sensitive
   */
  async createQuorumTier(minAmount, maxAmount, requiredSignatures, isSensitiveAction) {
    console.log(`📊 Creating quorum tier...`);
    console.log(`  Min: ${ethers.formatEther(minAmount)}`);
    console.log(`  Max: ${maxAmount.toString() === '0' ? 'Unlimited' : ethers.formatEther(maxAmount)}`);
    console.log(`  Signatures: ${requiredSignatures}`);

    try {
      const tx = await this.contract.createQuorumTier(
        minAmount,
        maxAmount,
        requiredSignatures,
        isSensitiveAction
      );
      
      const receipt = await tx.wait();
      console.log(`✅ Tier created (tx: ${receipt.transactionHash})`);
      return receipt;
    } catch (error) {
      console.error('Error creating tier:', error.message);
      throw error;
    }
  }

  /**
   * Create a time window with increased quorum
   * @param {number} startHour Start hour (0-23 UTC)
   * @param {number} endHour End hour (0-23 UTC)
   * @param {number} additionalSignatures Additional signatures required
   * @param {string} reason Description of window
   */
  async createTimeWindow(startHour, endHour, additionalSignatures, reason) {
    console.log(`⏰ Creating time window...`);
    console.log(`  Time: ${startHour}:00 - ${endHour}:00 UTC`);
    console.log(`  Additional Signatures: +${additionalSignatures}`);
    console.log(`  Reason: ${reason}`);

    try {
      const tx = await this.contract.createTimeWindow(
        startHour,
        endHour,
        additionalSignatures,
        reason
      );
      
      const receipt = await tx.wait();
      console.log(`✅ Time window created (tx: ${receipt.transactionHash})`);
      return receipt;
    } catch (error) {
      console.error('Error creating time window:', error.message);
      throw error;
    }
  }

  /**
   * Update threshold for large withdrawals
   * @param {BigNumber} newThreshold New threshold amount
   */
  async setLargeWithdrawalThreshold(newThreshold) {
    console.log(`📈 Setting large withdrawal threshold to ${ethers.formatEther(newThreshold)}`);

    try {
      const tx = await this.contract.setLargeWithdrawalThreshold(newThreshold);
      const receipt = await tx.wait();
      console.log(`✅ Threshold updated`);
      return receipt;
    } catch (error) {
      console.error('Error setting threshold:', error.message);
      throw error;
    }
  }

  /**
   * Update threshold for emergency amounts
   * @param {BigNumber} newThreshold New threshold amount
   */
  async setEmergencyThreshold(newThreshold) {
    console.log(`🚨 Setting emergency threshold to ${ethers.formatEther(newThreshold)}`);

    try {
      const tx = await this.contract.setEmergencyThreshold(newThreshold);
      const receipt = await tx.wait();
      console.log(`✅ Emergency threshold updated`);
      return receipt;
    } catch (error) {
      console.error('Error setting emergency threshold:', error.message);
      throw error;
    }
  }

  /**
   * Get vault balances
   * @returns {Object} {eth: BigNumber, tokens: Object}
   */
  async getVaultBalances() {
    try {
      const ethBalance = await this.contract.getETHBalance();

      return {
        eth: ethers.formatEther(ethBalance),
        formattedEth: `${ethers.formatEther(ethBalance)} ETH`
      };
    } catch (error) {
      console.error('Error fetching balances:', error.message);
      throw error;
    }
  }

  /**
   * Get token balance for vault
   * @param {string} tokenAddress Token contract address
   * @returns {BigNumber} Token balance
   */
  async getTokenBalance(tokenAddress) {
    try {
      const balance = await this.contract.getTokenBalance(tokenAddress);
      return balance;
    } catch (error) {
      console.error('Error fetching token balance:', error.message);
      throw error;
    }
  }

  /**
   * Get withdrawal history length
   * @returns {number} Number of withdrawals
   */
  async getWithdrawalCount() {
    try {
      const count = await this.contract.getWithdrawalHistoryLength();
      return count.toNumber();
    } catch (error) {
      console.error('Error fetching withdrawal count:', error.message);
      throw error;
    }
  }

  /**
   * Get recent withdrawals
   * @param {number} count Number of recent withdrawals to fetch
   * @returns {Array} Array of withdrawal records
   */
  async getRecentWithdrawals(count = 10) {
    try {
      const withdrawals = await this.contract.getRecentWithdrawals(count);

      return withdrawals.map(w => ({
        token: w.token,
        amount: ethers.formatEther(w.amount),
        recipient: w.recipient,
        timestamp: new Date(w.timestamp.toNumber() * 1000),
        requiredQuorum: w.requiredQuorum.toNumber(),
        actualSignatures: w.actualSignatures.toNumber(),
        reason: w.reason
      }));
    } catch (error) {
      console.error('Error fetching withdrawals:', error.message);
      throw error;
    }
  }

  /**
   * Get a specific withdrawal record
   * @param {number} index Index of withdrawal
   * @returns {Object} Withdrawal record
   */
  async getWithdrawalRecord(index) {
    try {
      const record = await this.contract.getWithdrawalRecord(index);

      return {
        token: record.token,
        amount: ethers.formatEther(record.amount),
        recipient: record.recipient,
        timestamp: new Date(record.timestamp.toNumber() * 1000),
        requiredQuorum: record.requiredQuorum.toNumber(),
        actualSignatures: record.actualSignatures.toNumber(),
        reason: record.reason
      };
    } catch (error) {
      console.error('Error fetching withdrawal record:', error.message);
      throw error;
    }
  }

  /**
   * Generate a comprehensive report of current configuration
   * @returns {Object} Configuration report
   */
  async generateConfigReport() {
    console.log('📊 Generating configuration report...\n');

    try {
      const tiers = await this.getQuorumTiers();
      const windows = await this.getTimeWindows();
      const balances = await this.getVaultBalances();
      const withdrawalCount = await this.getWithdrawalCount();

      const report = {
        timestamp: new Date().toISOString(),
        vaultAddress: this.vaultAddress,
        balances,
        withdrawalCount,
        quorumTiers: tiers,
        timeWindows: windows,
        summary: {
          totalTiers: tiers.length,
          activeTiers: tiers.filter(t => t.isActive).length,
          totalTimeWindows: windows.length,
          activeTimeWindows: windows.filter(w => w.isActive).length
        }
      };

      console.log('Vault Address:', report.vaultAddress);
      console.log('ETH Balance:', report.balances.formattedEth);
      console.log('Total Withdrawals:', report.withdrawalCount);
      console.log('\nQuorum Tiers:');
      tiers.forEach(tier => {
        console.log(`  [${tier.id}] ${tier.minAmount} - ${tier.maxAmount} tokens: ${tier.requiredSignatures} sig${tier.requiredSignatures > 1 ? 's' : ''} (${tier.isActive ? 'Active' : 'Inactive'})`);
      });
      console.log('\nTime Windows:');
      windows.forEach(window => {
        console.log(`  [${window.id}] ${window.startHour}:00-${window.endHour}:00 UTC: +${window.requiredSignatures} sig${window.requiredSignatures > 1 ? 's' : ''} (${window.isActive ? 'Active' : 'Inactive'}) - ${window.reason}`);
      });

      return report;
    } catch (error) {
      console.error('Error generating report:', error.message);
      throw error;
    }
  }

  /**
   * Analyze a specific withdrawal scenario
   * @param {string} token Token address
   * @param {BigNumber} amount Withdrawal amount
   * @param {string} recipient Recipient address
   * @param {string} recipientName Human-readable name
   * @returns {Object} Analysis results
   */
  async analyzeWithdrawalScenario(token, amount, recipient, recipientName = null) {
    console.log(`\n🔍 Analyzing withdrawal scenario...`);
    console.log(`  Recipient: ${recipientName || recipient}`);
    console.log(`  Amount: ${ethers.formatEther(amount)}`);

    try {
      const quorumData = await this.calculateWithdrawalQuorum(token, amount, recipient);

      const analysis = {
        token,
        amount: ethers.formatEther(amount),
        recipient: recipientName || recipient,
        requiredQuorum: quorumData.requiredQuorum,
        isSensitiveAction: quorumData.isSensitive,
        explanation: quorumData.explanation
      };

      console.log(`\n  Required Signatures: ${analysis.requiredQuorum}`);
      console.log(`  Is Sensitive: ${analysis.isSensitiveAction ? 'Yes ⚠️' : 'No ✅'}`);
      console.log(`\n  ${analysis.explanation}`);

      return analysis;
    } catch (error) {
      console.error('Error analyzing scenario:', error.message);
      throw error;
    }
  }

  /**
   * Internal helper - Explain quorum calculation
   */
  _explainQuorum(requiredQuorum, isSensitive) {
    if (isSensitive) {
      return `High-risk withdrawal: escalated to ${requiredQuorum} signatures due to action sensitivity`;
    } else {
      return `Standard withdrawal: ${requiredQuorum} signature${requiredQuorum > 1 ? 's' : ''} required`;
    }
  }

  /**
   * Internal helper - Describe time window
   */
  _describeTimeWindow(startHour, endHour) {
    if (startHour < endHour) {
      return `${startHour}:00-${endHour}:00 UTC`;
    } else {
      return `${startHour}:00-23:59 UTC and 00:00-${endHour}:00 UTC (wraps to next day)`;
    }
  }
}

// ============ Usage Examples ============

/**
 * Example 1: Setup Conservative Corporate Rules
 */
async function exampleConservativeSetup() {
  const vaultAddress = '0x...';
  const signer = ethers.Wallet.fromMnemonic(process.env.MNEMONIC);
  
  const manager = new TimeBasedQuorumManager(vaultAddress, signer);

  // Configure conservative rules
  await manager.configureConservativeRules();

  // Add approved recipients
  await manager.addApprovedRecipients([
    { address: '0xCEO...', name: 'CEO Account' },
    { address: '0xCFO...', name: 'CFO Account' },
    { address: '0xBankMain...', name: 'Main Bank Account' }
  ]);

  // Generate and display report
  const report = await manager.generateConfigReport();
}

/**
 * Example 2: Analyze Withdrawal Before Execution
 */
async function exampleAnalyzeWithdrawal() {
  const manager = new TimeBasedQuorumManager(vaultAddress, provider);

  // Check what's needed for this withdrawal
  const analysis = await manager.analyzeWithdrawalScenario(
    ethers.constants.AddressZero,  // ETH
    ethers.parseEther('250'),      // 250 ETH
    '0xUnknownRecipient...',
    'Unknown Recipient'
  );

  // Result: May require 5 signatures due to sensitivity (new recipient, large amount, etc)
}

/**
 * Example 3: Create Custom Configuration
 */
async function exampleCustomConfiguration() {
  const manager = new TimeBasedQuorumManager(vaultAddress, signer);

  // Create custom tiers for your use case
  await manager.createQuorumTier(
    0,
    ethers.parseEther('10'),  // 0-10 tokens
    1,                         // 1 signature
    false
  );

  await manager.createQuorumTier(
    ethers.parseEther('10'),
    ethers.parseEther('50'),   // 10-50 tokens
    2,                         // 2 signatures
    false
  );

  // Create time windows
  await manager.createTimeWindow(9, 17, 1, 'Business hours');
  await manager.createTimeWindow(22, 6, 2, 'Overnight hours');

  // View configuration
  const report = await manager.generateConfigReport();
  console.log(JSON.stringify(report, null, 2));
}

/**
 * Example 4: Monitor Withdrawals
 */
async function exampleMonitorWithdrawals() {
  const manager = new TimeBasedQuorumManager(vaultAddress, provider);

  // Get last 5 withdrawals
  const recent = await manager.getRecentWithdrawals(5);
  
  recent.forEach(w => {
    console.log(`
    Withdrawal: ${w.amount} tokens
    To: ${w.recipient}
    Time: ${w.timestamp.toLocaleString()}
    Quorum: ${w.requiredQuorum} signatures (${w.actualSignatures} received)
    Reason: ${w.reason}
    `);
  });
}

module.exports = TimeBasedQuorumManager;
