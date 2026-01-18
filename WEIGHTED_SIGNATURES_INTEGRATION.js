// Weighted Signatures Integration Examples
// Frontend/Backend implementation patterns

// ============ 1. SETUP: Assign Guardian Weights ============

async function setupWeightedGuardians(
  weightsContract,
  vaultAddress,
  guardianSetup
) {
  /**
   * guardianSetup: [
   *   { address: "0x...", weight: 5, role: "CEO" },
   *   { address: "0x...", weight: 3, role: "CFO" },
   *   { address: "0x...", weight: 2, role: "Treasurer" }
   * ]
   */
  
  let totalWeight = 0;
  
  for (const guardian of guardianSetup) {
    await weightsContract.setGuardianWeight(
      vaultAddress,
      guardian.address,
      guardian.weight
    );
    totalWeight += guardian.weight;
    console.log(`Assigned ${guardian.role}: ${guardian.weight}`);
  }
  
  return totalWeight;
}

// Usage
const guardians = [
  { address: "0xCEO...", weight: 5, role: "CEO" },
  { address: "0xCFO...", weight: 3, role: "CFO" },
  { address: "0xTreasurer...", weight: 2, role: "Treasurer" }
];

const totalWeight = await setupWeightedGuardians(
  weightsContract,
  vaultAddress,
  guardians
);
console.log("Total Weight:", totalWeight); // 10

// ============ 2. CONFIGURE: Set Quorum Threshold ============

async function configureWeightedQuorum(
  weightsContract,
  vaultAddress,
  quorumPercentage = 50
) {
  // Get voting stats first
  const stats = await weightsContract.getVotingStats(vaultAddress);
  const totalWeight = stats.totalWeight;
  
  // Calculate threshold (e.g., 50% requires > 50%)
  const threshold = Math.ceil((totalWeight * quorumPercentage) / 100) + 1;
  
  // Set quorum
  await weightsContract.setWeightedQuorum(vaultAddress, threshold);
  
  console.log(`Total Weight: ${totalWeight}`);
  console.log(`Quorum Threshold: ${threshold}`);
  console.log(`Required: ${(threshold / totalWeight * 100).toFixed(1)}%`);
  
  return threshold;
}

// Usage
const threshold = await configureWeightedQuorum(
  weightsContract,
  vaultAddress,
  50  // 50% majority
);

// ============ 3. ENABLE: Activate Weighted Voting ============

async function enableWeightedVoting(weightsContract, vaultContract, vaultAddress) {
  // Step 1: Enable in GuardianWeights
  try {
    await weightsContract.enableWeightedVoting(vaultAddress);
    console.log("✅ Enabled weighted voting in GuardianWeights");
  } catch (error) {
    console.error("❌ Failed to enable:", error.message);
    return false;
  }
  
  // Step 2: Enable in Vault
  try {
    await vaultContract.setWeightedVoting(true);
    console.log("✅ Enabled weighted voting in Vault");
  } catch (error) {
    console.error("❌ Failed in vault:", error.message);
    return false;
  }
  
  return true;
}

// ============ 4. QUERY: Get Weighted Guardian Info ============

async function getWeightedGuardianInfo(weightsContract, vaultAddress) {
  const [guardians, weights] = await weightsContract.getWeightDistribution(vaultAddress);
  const stats = await weightsContract.getVotingStats(vaultAddress);
  
  const info = {
    stats: {
      totalWeight: stats.totalWeight.toString(),
      quorumThreshold: stats.quorumThreshold.toString(),
      guardianCount: stats.guardianCount.toString(),
      isEnabled: stats.isEnabled
    },
    guardians: []
  };
  
  for (let i = 0; i < guardians.length; i++) {
    const weight = weights[i];
    const percentage = (weight * 100) / stats.totalWeight;
    const canPass = await weightsContract.canGuardianPassAlone(
      vaultAddress,
      guardians[i]
    );
    
    info.guardians.push({
      address: guardians[i],
      weight: weight.toString(),
      percentage: percentage.toFixed(2) + "%",
      canPassAlone: canPass
    });
  }
  
  return info;
}

// Usage
const info = await getWeightedGuardianInfo(weightsContract, vaultAddress);
console.log(JSON.stringify(info, null, 2));

// ============ 5. COLLECT: Get Eligible Signers ============

async function getEligibleSigners(
  weightsContract,
  vaultAddress,
  withdrawalAmount,
  sortByWeight = true
) {
  const [guardians, weights] = await weightsContract.getWeightDistribution(vaultAddress);
  const stats = await weightsContract.getVotingStats(vaultAddress);
  
  // Map guardians with their weights
  let candidates = guardians.map((addr, i) => ({
    address: addr,
    weight: weights[i].toNumber()
  }));
  
  // Sort by weight if requested
  if (sortByWeight) {
    candidates.sort((a, b) => b.weight - a.weight);
  }
  
  // Calculate minimum signers needed
  let accumulated = 0;
  let minRequired = [];
  
  for (const candidate of candidates) {
    minRequired.push(candidate);
    accumulated += candidate.weight;
    if (accumulated >= stats.quorumThreshold) {
      break;
    }
  }
  
  return {
    allCandidates: candidates,
    minimumRequired: minRequired,
    requiredWeight: stats.quorumThreshold.toNumber(),
    minimumWeight: accumulated
  };
}

// Usage
const signers = await getEligibleSigners(
  weightsContract,
  vaultAddress,
  withdrawalAmount
);

console.log("Eligible Signers:");
signers.allCandidates.forEach(s => {
  console.log(`  ${s.address}: ${s.weight} weight`);
});

console.log("\nMinimum Required:");
signers.minimumRequired.forEach(s => {
  console.log(`  ${s.address}: ${s.weight} weight`);
});
console.log(`Total: ${signers.minimumWeight}/${signers.requiredWeight}`);

// ============ 6. EXECUTE: Weighted Withdrawal ============

async function executeWeightedWithdrawal(
  vaultContract,
  withdrawalParams,
  selectedSignerAddresses,
  isEmergency = false
) {
  const {
    token,
    amount,
    recipient,
    reason
  } = withdrawalParams;
  
  // Build EIP-712 signature data
  const domain = {
    name: "SpendGuard",
    version: "1",
    chainId: (await ethers.provider.getNetwork()).chainId,
    verifyingContract: vaultContract.address
  };
  
  const types = {
    Withdrawal: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "reason", type: "bytes32" },
      { name: "category", type: "bytes32" },
      { name: "createdAt", type: "uint256" }
    ]
  };
  
  const nonce = await vaultContract.nonce();
  const value = {
    token,
    amount,
    recipient,
    nonce: nonce.toString(),
    reason: ethers.id(reason),
    category: ethers.id(isEmergency ? "emergency" : "regular"),
    createdAt: Math.floor(Date.now() / 1000)
  };
  
  // Get signers and collect signatures
  const signer = await ethers.getSigner();
  const signatures = [];
  
  for (const signerAddr of selectedSignerAddresses) {
    const signerSigner = await ethers.getSigner(signerAddr);
    const sig = await signerSigner.signTypedData(domain, types, value);
    signatures.push(sig);
  }
  
  // Execute withdrawal
  const tx = await vaultContract.withdrawWithWeights(
    token,
    amount,
    recipient,
    reason,
    isEmergency,
    signatures
  );
  
  return tx.wait();
}

// Usage
const result = await executeWeightedWithdrawal(
  vaultContract,
  {
    token: "0x...",
    amount: ethers.parseEther("10"),
    recipient: "0x...",
    reason: "Q1 Operational Expenses"
  },
  ["0xCEO...", "0xCFO..."], // Selected signers
  false
);

console.log("Withdrawal executed:", result.transactionHash);

// ============ 7. MONITOR: Track Weight Changes ============

async function setupWeightEventListeners(weightsContract, vaultAddress) {
  const filter = weightsContract.filters;
  
  // Weight assignments
  weightsContract.on(
    filter.WeightAssigned(vaultAddress),
    (vault, guardian, weight, totalWeight) => {
      console.log(
        `✅ Weight assigned: ${guardian} = ${weight} ` +
        `(total: ${totalWeight})`
      );
    }
  );
  
  // Weight removals
  weightsContract.on(
    filter.WeightRemoved(vaultAddress),
    (vault, guardian, prevWeight) => {
      console.log(`❌ Weight removed: ${guardian} (was ${prevWeight})`);
    }
  );
  
  // Quorum changes
  weightsContract.on(
    filter.QuorumThresholdSet(vaultAddress),
    (vault, threshold, enabled) => {
      console.log(`📊 Quorum set to ${threshold} (enabled: ${enabled})`);
    }
  );
  
  // Voting mode toggles
  weightsContract.on(
    filter.WeightedVotingEnabled(vaultAddress),
    (vault) => {
      console.log("🎯 Weighted voting ENABLED");
    }
  );
  
  weightsContract.on(
    filter.WeightedVotingDisabled(vaultAddress),
    (vault) => {
      console.log("⚖️ Switched to traditional voting");
    }
  );
}

// ============ 8. MONITOR: Track Withdrawals ============

async function setupWithdrawalEventListeners(vaultContract) {
  // Signature collection
  vaultContract.on(
    "WeightedSignatureCollected",
    (guardian, weight, totalSoFar, nonce) => {
      console.log(
        `📝 Signature #${nonce.toString()}: ` +
        `${guardian} (+${weight.toString()}) = ${totalSoFar.toString()} total`
      );
    }
  );
  
  // Quorum met
  vaultContract.on(
    "WeightedQuorumMet",
    (nonce, totalWeight, requiredWeight) => {
      console.log(
        `✅ Quorum met for withdrawal #${nonce.toString()}: ` +
        `${totalWeight.toString()}/${requiredWeight.toString()}`
      );
    }
  );
  
  // Withdrawal executed
  vaultContract.on(
    "Withdrawal",
    (token, amount, recipient, reason, sigWeight, reqWeight) => {
      console.log(
        `💰 Withdrawal: ${ethers.formatEther(amount)} tokens ` +
        `(weight: ${sigWeight.toString()}/${reqWeight.toString()})`
      );
    }
  );
}

// ============ 9. ANALYZE: Withdrawal Scenarios ============

async function analyzeWithdrawalScenarios(weightsContract, vaultAddress) {
  const [guardians, weights] = await weightsContract.getWeightDistribution(vaultAddress);
  const stats = await weightsContract.getVotingStats(vaultAddress);
  
  const scenarios = [];
  
  // Generate all possible combinations
  const combinations = getCombinations(guardians);
  
  for (const combo of combinations) {
    let totalWeight = 0;
    for (const guardian of combo) {
      const idx = guardians.indexOf(guardian);
      totalWeight += weights[idx].toNumber();
    }
    
    const wouldPass = totalWeight >= stats.quorumThreshold;
    scenarios.push({
      guardians: combo,
      weight: totalWeight,
      required: stats.quorumThreshold.toNumber(),
      passes: wouldPass
    });
  }
  
  // Sort by weight
  scenarios.sort((a, b) => b.weight - a.weight);
  
  return scenarios;
}

function getCombinations(array) {
  const results = [];
  
  // Helper function
  function combine(currentCombo, startIdx) {
    if (currentCombo.length > 0) {
      results.push([...currentCombo]);
    }
    
    for (let i = startIdx; i < array.length; i++) {
      currentCombo.push(array[i]);
      combine(currentCombo, i + 1);
      currentCombo.pop();
    }
  }
  
  combine([], 0);
  return results;
}

// Usage
const scenarios = await analyzeWithdrawalScenarios(
  weightsContract,
  vaultAddress
);

console.log("Withdrawal Scenarios:");
scenarios.forEach(s => {
  const status = s.passes ? "✅ PASS" : "❌ FAIL";
  console.log(
    `${status}: ${s.guardians.length} guardians = ` +
    `${s.weight}/${s.required}`
  );
});

// ============ 10. MANAGE: Update Guardian Weight ============

async function updateGuardianWeight(
  weightsContract,
  vaultAddress,
  guardianAddress,
  newWeight
) {
  if (newWeight === 0) {
    // Remove weight
    await weightsContract.removeGuardianWeight(vaultAddress, guardianAddress);
    console.log(`Removed weight for ${guardianAddress}`);
  } else {
    // Update weight
    await weightsContract.setGuardianWeight(
      vaultAddress,
      guardianAddress,
      newWeight
    );
    console.log(`Updated ${guardianAddress} to weight ${newWeight}`);
  }
  
  // Get new stats
  const stats = await weightsContract.getVotingStats(vaultAddress);
  console.log(`New total weight: ${stats.totalWeight}`);
}

// ============ 11. REPORT: Generate Guardian Report ============

async function generateGuardianWeightReport(weightsContract, vaultAddress) {
  const [guardians, weights] = await weightsContract.getWeightDistribution(vaultAddress);
  const stats = await weightsContract.getVotingStats(vaultAddress);
  
  let report = `
════════════════════════════════════════════════════════════════
                    GUARDIAN WEIGHT REPORT
════════════════════════════════════════════════════════════════

Vault: ${vaultAddress}
Voting Mode: ${stats.isEnabled ? "WEIGHTED" : "TRADITIONAL"}
Total Weight: ${stats.totalWeight}
Quorum Threshold: ${stats.quorumThreshold}
Active Guardians: ${stats.guardianCount}

GUARDIAN BREAKDOWN:
──────────────────────────────────────────────────────────────`;

  for (let i = 0; i < guardians.length; i++) {
    const weight = weights[i].toNumber();
    const percentage = ((weight / stats.totalWeight) * 100).toFixed(1);
    const canPass = weight >= stats.quorumThreshold ? "YES" : "NO";
    
    report += `
${guardians[i]}
  Weight: ${weight} (${percentage}%)
  Can Pass Alone: ${canPass}`;
  }
  
  report += `

════════════════════════════════════════════════════════════════`;
  
  return report;
}

// Usage
const report = await generateGuardianWeightReport(weightsContract, vaultAddress);
console.log(report);

// ============ 12. REACT COMPONENT STATE ============

// Example React component managing weighted voting
const [vaultState, setVaultState] = useState({
  guardians: [],
  totalWeight: 0,
  quorumThreshold: 0,
  isWeightedVoting: false,
  selectedSigners: []
});

async function loadGuardianWeights() {
  const info = await getWeightedGuardianInfo(weightsContract, vaultAddress);
  
  setVaultState({
    guardians: info.guardians,
    totalWeight: parseInt(info.stats.totalWeight),
    quorumThreshold: parseInt(info.stats.quorumThreshold),
    isWeightedVoting: info.stats.isEnabled,
    selectedSigners: []
  });
}

// Export all functions
module.exports = {
  setupWeightedGuardians,
  configureWeightedQuorum,
  enableWeightedVoting,
  getWeightedGuardianInfo,
  getEligibleSigners,
  executeWeightedWithdrawal,
  setupWeightEventListeners,
  setupWithdrawalEventListeners,
  analyzeWithdrawalScenarios,
  updateGuardianWeight,
  generateGuardianWeightReport
};
