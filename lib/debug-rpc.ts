// This is a debug utility to directly query the RPC for events
// Usage: Call from browser console: 
// import { debugDepositEvents } from '@/lib/debug-rpc'
// debugDepositEvents('0x8457238BDD8B3F548C3b0cF83E2bad1f9fe46181')

import { createPublicClient, http, getEventSelector, decodeEventLog } from 'viem';
import { baseSepolia } from 'viem/chains';

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export function getDebugInfo(vaultAddress: string) {
  try {
    const key = `deposits-debug-${vaultAddress.toLowerCase()}`;
    const info = localStorage.getItem(key);
    if (info) {
      const data = JSON.parse(info);
      console.log('===== STORED DEBUG INFO =====');
      console.log(JSON.stringify(data, null, 2));
      return data;
    } else {
      console.log('No debug info found in localStorage for:', key);
      console.log('Try running debugDepositEvents() first');
      return null;
    }
  } catch (e) {
    console.error('Error retrieving debug info:', e);
    return null;
  }
}

export async function debugDepositEvents(vaultAddress: string) {
  console.log('=== DEBUGGING DEPOSIT EVENTS ===');
  console.log('Vault Address:', vaultAddress);
  
  try {
    // Get current block
    const currentBlock = await client.getBlockNumber();
    console.log('Current block:', currentBlock.toString());
    
    // Method 1: Query ALL logs from vault without topic filter
    console.log('\n--- Method 1: All logs from vault (no filter) ---');
    const allLogs = await client.getLogs({
      address: vaultAddress as any,
      fromBlock: 0n,
      toBlock: currentBlock,
    } as any);
    console.log('Total logs:', allLogs.length);
    allLogs.forEach((log, i) => {
      console.log(`Log ${i}:`, {
        blockNumber: log.blockNumber.toString(),
        transactionHash: log.transactionHash,
        data: log.data.slice(0, 66) + '...',
      });
    });
    
    // Method 2: Get specific Deposited event topic and query with that
    console.log('\n--- Method 2: Filter by Deposited event topic ---');
    const depositedTopic = getEventSelector({ 
      name: 'Deposited', 
      type: 'event', 
      inputs: [
        { indexed: true, name: 'token', type: 'address' },
        { indexed: true, name: 'from', type: 'address' },
        { indexed: false, name: 'amount', type: 'uint256' },
      ] 
    });
    console.log('Deposited event topic:', depositedTopic);
    
    const depositedLogs = await client.getLogs({
      address: vaultAddress as any,
      topics: [depositedTopic] as any,
      fromBlock: 0n,
      toBlock: currentBlock,
    } as any);
    console.log('Deposited event logs:', depositedLogs.length);
    depositedLogs.forEach((log, i) => {
      console.log(`Deposit ${i}:`, {
        blockNumber: log.blockNumber.toString(),
        txHash: log.transactionHash,
        logIndex: log.logIndex,
      });
    });
    
    // Method 3: Decode the deposited logs
    console.log('\n--- Method 3: Decode Deposited events ---');
    const SpendVaultABI = [
      {
        "anonymous": false,
        "inputs": [
          { "indexed": true, "name": "token", "type": "address" },
          { "indexed": true, "name": "from", "type": "address" },
          { "indexed": false, "name": "amount", "type": "uint256" }
        ],
        "name": "Deposited",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          { "indexed": true, "name": "token", "type": "address" },
          { "indexed": true, "name": "recipient", "type": "address" },
          { "indexed": false, "name": "amount", "type": "uint256" },
          { "indexed": false, "name": "reason", "type": "string" }
        ],
        "name": "Withdrawn",
        "type": "event"
      }
    ];
    
    depositedLogs.forEach((log, i) => {
      try {
        const decoded = decodeEventLog({
          abi: SpendVaultABI as any,
          data: log.data,
          topics: log.topics,
        });
        console.log(`  Deposit ${i}:`, decoded);
      } catch (e) {
        console.error(`  Failed to decode log ${i}:`, e);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

// Also export a function to check recent transaction status
export async function checkTransactionByHash(txHash: string) {
  try {
    const tx = await client.getTransaction({ hash: txHash as any });
    console.log('Transaction:', tx);
    
    const receipt = await client.getTransactionReceipt({ hash: txHash as any });
    console.log('Receipt:', receipt);
    console.log('Logs in receipt:', receipt?.logs?.length || 0);
    
    // Try to decode the logs
    if (receipt && receipt.logs.length > 0) {
      const SpendVaultABI = [
        {
          "anonymous": false,
          "inputs": [
            { "indexed": true, "name": "token", "type": "address" },
            { "indexed": true, "name": "from", "type": "address" },
            { "indexed": false, "name": "amount", "type": "uint256" }
          ],
          "name": "Deposited",
          "type": "event"
        }
      ];
      
      receipt.logs.forEach((log, i) => {
        try {
          const decoded = decodeEventLog({
            abi: SpendVaultABI as any,
            data: log.data,
            topics: log.topics,
          });
          console.log(`Log ${i} decoded:`, decoded);
        } catch (e) {
          console.log(`Log ${i} could not be decoded (not a Deposited event)`);
        }
      });
    }
  } catch (error) {
    console.error('Error checking transaction:', error);
  }
}
