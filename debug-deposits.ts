import { createPublicClient, http, getEventSelector } from 'viem';
import { baseSepolia } from 'viem/chains';
import { SpendVaultABI } from './lib/abis/SpendVault';

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

async function debugDeposits() {
  const vaultAddress = '0x8457238BDD8B3F548C3b0cF83E2bad1f9fe46181';
  
  try {
    // Get current block
    const currentBlock = await client.getBlockNumber();
    console.log('Current block:', currentBlock);
    
    // Get the Deposited event selector
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
    
    // Get all logs for the vault
    console.log('\n=== Fetching all logs (no topic filter) ===');
    const allLogs = await client.getLogs({
      address: vaultAddress,
      fromBlock: 0n,
      toBlock: currentBlock,
    });
    console.log('Total logs (all types):', allLogs.length);
    if (allLogs.length > 0) {
      console.log('First 5 log topics:');
      allLogs.slice(0, 5).forEach((log, i) => {
        console.log(`  Log ${i}: topics[0] = ${log.topics[0]}`);
      });
    }
    
    // Get Deposited event logs specifically
    console.log('\n=== Fetching Deposited event logs ===');
    const depositedLogs = await client.getLogs({
      address: vaultAddress,
      topics: [depositedTopic],
      fromBlock: 0n,
      toBlock: currentBlock,
    } as any);
    console.log('Deposited event logs:', depositedLogs.length);
    depositedLogs.forEach((log, i) => {
      console.log(`  Deposit ${i}:`);
      console.log(`    Block: ${log.blockNumber}`);
      console.log(`    TX: ${log.transactionHash}`);
      console.log(`    Data: ${log.data}`);
    });
    
    // Try with chunked queries
    console.log('\n=== Chunked query (100k blocks) ===');
    const CHUNK_SIZE = 100000n;
    let fromBlock = 0n;
    let totalChunkedLogs = 0;
    
    while (fromBlock <= currentBlock) {
      const toBlock = currentBlock < fromBlock + CHUNK_SIZE - 1n ? currentBlock : fromBlock + CHUNK_SIZE - 1n;
      const chunkLogs = await client.getLogs({
        address: vaultAddress as any,
        topics: [depositedTopic] as any,
        fromBlock,
        toBlock,
      } as any);
      totalChunkedLogs += chunkLogs.length;
      console.log(`Chunk [${String(fromBlock)}, ${String(toBlock)}]: ${chunkLogs.length} logs`);
      fromBlock = toBlock + 1n;
    }
    console.log('Total from chunked query:', totalChunkedLogs);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

debugDeposits();
