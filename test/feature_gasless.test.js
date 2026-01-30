const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CompliancePlugin & SpendVaultWithCompliance", function () {
  let CompliancePlugin, SpendVaultWithCompliance;
  let compliance, vault, owner, other;

  beforeEach(async function () {
    [owner, other] = await ethers.getSigners();
    CompliancePlugin = await ethers.getContractFactory("CompliancePlugin");
    compliance = await CompliancePlugin.deploy();
    await compliance.deployed();

    SpendVaultWithCompliance = await ethers.getContractFactory("SpendVaultWithCompliance");
    vault = await SpendVaultWithCompliance.deploy(compliance.address);
    await vault.deployed();
  });

  it("should allow admin to set compliance status", async function () {
    await compliance.setComplianceStatus(owner.address, true);
    expect(await compliance.checkCompliance(owner.address)).to.equal(true);
    await compliance.setComplianceStatus(owner.address, false);
    expect(await compliance.checkCompliance(owner.address)).to.equal(false);
  });

  it("should allow compliant owner to withdraw", async function () {
    await compliance.setComplianceStatus(owner.address, true);
    // Deposit ETH
    await owner.sendTransaction({ to: vault.address, value: ethers.utils.parseEther("1.0") });
    const before = await ethers.provider.getBalance(owner.address);
    // Withdraw
    await expect(vault.withdraw(owner.address, ethers.utils.parseEther("0.5")))
      .to.emit(vault, ""); // No event, just check no revert
    const after = await ethers.provider.getBalance(owner.address);
    expect(after).to.be.gt(before);
  });

  it("should block non-compliant owner from withdrawing", async function () {
    await compliance.setComplianceStatus(owner.address, false);
    await owner.sendTransaction({ to: vault.address, value: ethers.utils.parseEther("1.0") });
    await expect(vault.withdraw(owner.address, ethers.utils.parseEther("0.5")))
      .to.be.revertedWith("Not KYC/AML compliant");
  });
});
