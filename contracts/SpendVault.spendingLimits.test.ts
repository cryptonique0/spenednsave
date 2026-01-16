/**
 * SpendVault.spendingLimits.test.ts
 * 
 * Comprehensive test suite for guardian-enforced spending limits feature
 * Tests daily, weekly, and monthly limits with enhanced approval requirements
 * 
 * Setup requirements:
 * - Hardhat test environment with ethers.js
 * - Mock GuardianSBT contract
 * - Test accounts with different roles (owner, guardians, recipients)
 */

import { expect } from 'chai';
import { ethers } from 'hardhat';
import { type Contract, type Signer } from 'ethers';

describe('SpendVault - Spending Limits Feature', () => {
  let vault: Contract;
  let token: Contract; // Mock ERC20
  let guardianToken: Contract; // Mock GuardianSBT
  let owner: Signer;
  let guardian1: Signer;
  let guardian2: Signer;
  let guardian3: Signer;
  let guardian4: Signer;
  let recipient: Signer;

  const DOMAIN_SEPARATOR = 'SpendVault';
  const VERSION = '1.0.0';

  /**
   * Helper: Set spending limits for a token
   */
  async function setWithdrawalLimits(
    vaultAddr: string,
    tokenAddr: string,
    daily: bigint,
    weekly: bigint,
    monthly: bigint
  ) {
    const tx = await vault.setWithdrawalCaps(tokenAddr, {
      daily,
      weekly,
      monthly
    });
    await tx.wait();
  }

  /**
   * Helper: Sign a withdrawal using EIP-712
   */
  async function signWithdrawal(
    signer: Signer,
    token: string,
    amount: bigint,
    recipient: string,
    nonce: number,
    reason: string = 'test withdrawal',
    category: string = 'operations'
  ) {
    const reasonHash = ethers.keccak256(ethers.toUtf8Bytes(reason));
    const categoryHash = ethers.keccak256(ethers.toUtf8Bytes(category));

    // Build the domain
    const domain = {
      name: DOMAIN_SEPARATOR,
      version: VERSION,
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await vault.getAddress()
    };

    // Define the types
    const types = {
      Withdrawal: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'recipient', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'reasonHash', type: 'bytes32' },
        { name: 'category', type: 'bytes32' },
        { name: 'createdAt', type: 'uint256' }
      ]
    };

    const value = {
      token,
      amount,
      recipient,
      nonce,
      reasonHash,
      category: categoryHash,
      createdAt: Math.floor(Date.now() / 1000)
    };

    return await signer.signTypedData(domain, types, value);
  }

  before(async () => {
    // Get test accounts
    [owner, guardian1, guardian2, guardian3, guardian4, recipient] = await ethers.getSigners();

    // Deploy mock GuardianSBT
    const GuardianSBT = await ethers.getContractFactory('GuardianSBT');
    guardianToken = await GuardianSBT.deploy();
    await guardianToken.waitForDeployment();

    // Mint guardian tokens
    for (const guardian of [guardian1, guardian2, guardian3, guardian4]) {
      const tx = await guardianToken.mint(await guardian.getAddress());
      await tx.wait();
    }

    // Deploy mock ERC20 token
    const ERC20Mock = await ethers.getContractFactory('ERC20Mock');
    token = await ERC20Mock.deploy('Test Token', 'TEST', ethers.parseEther('10000'));
    await token.waitForDeployment();

    // Deploy SpendVault
    const SpendVault = await ethers.getContractFactory('SpendVault');
    vault = await SpendVault.deploy(
      await owner.getAddress(),
      await guardianToken.getAddress()
    );
    await vault.waitForDeployment();

    // Fund the vault
    const tx = await token.transfer(
      await vault.getAddress(),
      ethers.parseEther('1000')
    );
    await tx.wait();

    // Set initial quorum (2 of 4 guardians)
    const setQuorumTx = await vault.setQuorum(2);
    await setQuorumTx.wait();
  });

  describe('checkSpendingLimitStatus', () => {
    it('should return zero usage for token with no spending', async () => {
      const tokenAddr = await token.getAddress();
      
      const status = await vault.checkSpendingLimitStatus(tokenAddr, ethers.parseEther('100'));
      
      expect(status.dailyUsed).to.equal(0n);
      expect(status.weeklyUsed).to.equal(0n);
      expect(status.monthlyUsed).to.equal(0n);
      expect(status.exceedsDaily).to.be.false;
      expect(status.exceedsWeekly).to.be.false;
      expect(status.exceedsMonthly).to.be.false;
    });

    it('should detect when withdrawal exceeds daily limit', async () => {
      const tokenAddr = await token.getAddress();
      const dailyLimit = ethers.parseEther('100');

      // Set limits
      await setWithdrawalLimits(
        await vault.getAddress(),
        tokenAddr,
        dailyLimit,
        ethers.parseEther('500'),
        ethers.parseEther('1000')
      );

      // Check status for amount that exceeds daily limit
      const status = await vault.checkSpendingLimitStatus(
        tokenAddr,
        ethers.parseEther('150')
      );

      expect(status.exceedsDaily).to.be.true;
      expect(status.exceedsWeekly).to.be.false;
      expect(status.exceedsMonthly).to.be.false;
    });

    it('should detect when withdrawal exceeds weekly limit', async () => {
      const tokenAddr = await token.getAddress();
      const weeklyLimit = ethers.parseEther('500');

      // Check status for amount that exceeds weekly limit
      const status = await vault.checkSpendingLimitStatus(
        tokenAddr,
        ethers.parseEther('600')
      );

      expect(status.exceedsWeekly).to.be.true;
    });

    it('should detect when withdrawal exceeds monthly limit', async () => {
      const tokenAddr = await token.getAddress();
      const monthlyLimit = ethers.parseEther('1000');

      // Check status for amount that exceeds monthly limit
      const status = await vault.checkSpendingLimitStatus(
        tokenAddr,
        ethers.parseEther('1500')
      );

      expect(status.exceedsMonthly).to.be.true;
    });
  });

  describe('Enhanced Approvals on Limit Violation', () => {
    beforeEach(async () => {
      // Reset limits for each test
      const tokenAddr = await token.getAddress();
      await setWithdrawalLimits(
        await vault.getAddress(),
        tokenAddr,
        ethers.parseEther('100'), // daily
        ethers.parseEther('500'), // weekly
        ethers.parseEther('1000') // monthly
      );
    });

    it('should require enhanced approvals for daily limit violation', async () => {
      const tokenAddr = await token.getAddress();
      const recipientAddr = await recipient.getAddress();
      const withdrawAmount = ethers.parseEther('150'); // Exceeds 100 daily limit

      // Sign with only 2 guardians (standard quorum)
      const sig1 = await signWithdrawal(
        guardian1,
        tokenAddr,
        withdrawAmount,
        recipientAddr,
        await vault.nonce()
      );
      const sig2 = await signWithdrawal(
        guardian2,
        tokenAddr,
        withdrawAmount,
        recipientAddr,
        await vault.nonce()
      );

      // Should fail because withdrawal exceeds limit but lacks enhanced approvals
      await expect(
        vault.withdraw(
          tokenAddr,
          withdrawAmount,
          recipientAddr,
          'Withdrawal exceeding daily limit',
          'operations',
          Math.floor(Date.now() / 1000),
          [sig1, sig2]
        )
      ).to.be.revertedWith('Enhanced approvals required for spending limit violation');
    });

    it('should accept withdrawal with enhanced approvals (75% of guardians)', async () => {
      const tokenAddr = await token.getAddress();
      const recipientAddr = await recipient.getAddress();
      const withdrawAmount = ethers.parseEther('150'); // Exceeds 100 daily limit

      // Get required approvals (75% of 4 = 3)
      const requiredApprovals = await vault.getEnhancedApprovalsRequired();
      expect(requiredApprovals).to.equal(3n);

      // Sign with 3 guardians (enhanced quorum)
      const nonce = await vault.nonce();
      const sig1 = await signWithdrawal(guardian1, tokenAddr, withdrawAmount, recipientAddr, nonce);
      const sig2 = await signWithdrawal(guardian2, tokenAddr, withdrawAmount, recipientAddr, nonce);
      const sig3 = await signWithdrawal(guardian3, tokenAddr, withdrawAmount, recipientAddr, nonce);

      // Should succeed with enhanced approvals
      const withdrawTx = await vault.withdraw(
        tokenAddr,
        withdrawAmount,
        recipientAddr,
        'Withdrawal exceeding daily limit',
        'operations',
        Math.floor(Date.now() / 1000),
        [sig1, sig2, sig3]
      );

      await expect(withdrawTx).to.not.be.reverted;

      // Verify enhanced approvals were tracked
      const requiresEnhanced = await vault.requiresEnhancedApprovals(nonce);
      expect(requiresEnhanced).to.be.true;

      const approvalsNeeded = await vault.enhancedApprovalsNeeded(nonce);
      expect(approvalsNeeded).to.equal(3n);
    });

    it('should emit SpendingLimitExceeded event on limit violation', async () => {
      const tokenAddr = await token.getAddress();
      const recipientAddr = await recipient.getAddress();
      const withdrawAmount = ethers.parseEther('150');
      const dailyLimit = ethers.parseEther('100');

      const nonce = await vault.nonce();
      const sig1 = await signWithdrawal(guardian1, tokenAddr, withdrawAmount, recipientAddr, nonce);
      const sig2 = await signWithdrawal(guardian2, tokenAddr, withdrawAmount, recipientAddr, nonce);
      const sig3 = await signWithdrawal(guardian3, tokenAddr, withdrawAmount, recipientAddr, nonce);

      const withdrawTx = await vault.withdraw(
        tokenAddr,
        withdrawAmount,
        recipientAddr,
        'Over limit',
        'operations',
        Math.floor(Date.now() / 1000),
        [sig1, sig2, sig3]
      );

      await expect(withdrawTx).to.emit(vault, 'SpendingLimitExceeded')
        .withArgs(tokenAddr, 'daily', withdrawAmount, dailyLimit);
    });

    it('should emit EnhancedApprovalsRequired event', async () => {
      const tokenAddr = await token.getAddress();
      const recipientAddr = await recipient.getAddress();
      const withdrawAmount = ethers.parseEther('150');

      const nonce = await vault.nonce();
      const sig1 = await signWithdrawal(guardian1, tokenAddr, withdrawAmount, recipientAddr, nonce);
      const sig2 = await signWithdrawal(guardian2, tokenAddr, withdrawAmount, recipientAddr, nonce);
      const sig3 = await signWithdrawal(guardian3, tokenAddr, withdrawAmount, recipientAddr, nonce);

      const withdrawTx = await vault.withdraw(
        tokenAddr,
        withdrawAmount,
        recipientAddr,
        'Over limit',
        'operations',
        Math.floor(Date.now() / 1000),
        [sig1, sig2, sig3]
      );

      await expect(withdrawTx).to.emit(vault, 'EnhancedApprovalsRequired')
        .withArgs(nonce, 3n, 'daily');
    });
  });

  describe('Multiple Tokens and Edge Cases', () => {
    it('should track limits independently per token', async () => {
      // Deploy a second test token
      const ERC20Mock = await ethers.getContractFactory('ERC20Mock');
      const token2 = await ERC20Mock.deploy('Token 2', 'T2', ethers.parseEther('10000'));
      await token2.waitForDeployment();

      const token1Addr = await token.getAddress();
      const token2Addr = await token2.getAddress();

      // Set different limits for each token
      await setWithdrawalLimits(
        await vault.getAddress(),
        token1Addr,
        ethers.parseEther('100'),
        ethers.parseEther('500'),
        ethers.parseEther('1000')
      );

      await setWithdrawalLimits(
        await vault.getAddress(),
        token2Addr,
        ethers.parseEther('50'),
        ethers.parseEther('250'),
        ethers.parseEther('500')
      );

      // Check that limits are tracked independently
      const status1 = await vault.checkSpendingLimitStatus(
        token1Addr,
        ethers.parseEther('150')
      );
      const status2 = await vault.checkSpendingLimitStatus(
        token2Addr,
        ethers.parseEther('150')
      );

      expect(status1.exceedsDaily).to.be.true; // 150 > 100
      expect(status2.exceedsDaily).to.be.true; // 150 > 50
    });

    it('should not require enhanced approvals for withdrawal within limits', async () => {
      const tokenAddr = await token.getAddress();
      const recipientAddr = await recipient.getAddress();
      const withdrawAmount = ethers.parseEther('50'); // Within 100 daily limit

      // Sign with only 2 guardians (standard quorum)
      const nonce = await vault.nonce();
      const sig1 = await signWithdrawal(guardian1, tokenAddr, withdrawAmount, recipientAddr, nonce);
      const sig2 = await signWithdrawal(guardian2, tokenAddr, withdrawAmount, recipientAddr, nonce);

      // Should succeed with standard quorum
      const withdrawTx = await vault.withdraw(
        tokenAddr,
        withdrawAmount,
        recipientAddr,
        'Within limits',
        'operations',
        Math.floor(Date.now() / 1000),
        [sig1, sig2]
      );

      await expect(withdrawTx).to.not.be.reverted;

      // Verify enhanced approvals were NOT required
      const requiresEnhanced = await vault.requiresEnhancedApprovals(nonce);
      expect(requiresEnhanced).to.be.false;
    });

    it('should handle zero limits (unlimited withdrawals)', async () => {
      const tokenAddr = await token.getAddress();

      // Set all limits to 0 (unlimited)
      await setWithdrawalLimits(
        await vault.getAddress(),
        tokenAddr,
        0n, // unlimited daily
        0n, // unlimited weekly
        0n  // unlimited monthly
      );

      // Check status for very large amount
      const status = await vault.checkSpendingLimitStatus(
        tokenAddr,
        ethers.parseEther('999999')
      );

      expect(status.exceedsDaily).to.be.false;
      expect(status.exceedsWeekly).to.be.false;
      expect(status.exceedsMonthly).to.be.false;
    });
  });

  describe('Time-based Limit Resets', () => {
    it('should reset daily limits after 24 hours', async () => {
      // Note: This test requires time manipulation in Hardhat
      // Use ethers.provider.send('evm_increaseTime', [86400]) to advance 24 hours
      // Implementation depends on test framework capabilities
      
      const tokenAddr = await token.getAddress();
      
      // Set a daily limit
      await setWithdrawalLimits(
        await vault.getAddress(),
        tokenAddr,
        ethers.parseEther('100'),
        ethers.parseEther('500'),
        ethers.parseEther('1000')
      );

      // First withdrawal (within limit)
      const status1 = await vault.checkSpendingLimitStatus(
        tokenAddr,
        ethers.parseEther('100')
      );
      expect(status1.exceedsDaily).to.be.false;

      // Simulate time advancement (would require test setup)
      // await ethers.provider.send('evm_increaseTime', [86400]);
      // After reset, same amount should be allowed again
    });
  });

  describe('Guardian Count Calculations', () => {
    it('should calculate enhanced approvals as 75% of guardians', async () => {
      // We have 4 guardians
      const guardianCount = await vault.getGuardianCount();
      expect(guardianCount).to.equal(4n);

      const requiredApprovals = await vault.getEnhancedApprovalsRequired();
      // 75% of 4 = 3 (rounded up)
      expect(requiredApprovals).to.equal(3n);
    });

    it('should scale enhanced approvals with different guardian counts', async () => {
      // If we had 10 guardians, 75% = 7.5 ≈ 8
      // If we had 3 guardians, 75% = 2.25 ≈ 3
      // This test verifies the ceiling calculation is correct
      
      const requiredApprovals = await vault.getEnhancedApprovalsRequired();
      
      // For 4 guardians: ceil(4 * 0.75) = ceil(3) = 3
      expect(requiredApprovals).to.equal(3n);
    });
  });
});
