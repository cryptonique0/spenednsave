// Utility functions for wallet operations

export const formatBalance = (balance, decimals = 18) => {
  if (!balance) return '0';
  const value = parseFloat(balance) / Math.pow(10, decimals);
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
};

export const parseUnits = (value, decimals = 18) => {
  return (parseFloat(value) * Math.pow(10, decimals)).toString();
};

export const formatUnits = (value, decimals = 18) => {
  return (parseFloat(value) / Math.pow(10, decimals)).toString();
};

export const calculateGasLimit = (txType) => {
  const gasLimits = {
    transfer: 21000,
    erc20Transfer: 65000,
    erc20Approve: 46000,
    swap: 150000,
    addLiquidity: 200000,
    removeLiquidity: 180000,
    stake: 120000,
    unstake: 100000,
    nftMint: 100000,
    nftTransfer: 85000,
    contractDeploy: 500000
  };
  return gasLimits[txType] || 100000;
};

export const estimateGasCost = (gasLimit, gasPrice, ethPrice = 2000) => {
  const costEth = (gasLimit * gasPrice) / 1e9;
  const costUsd = costEth * ethPrice;
  return {
    eth: costEth.toFixed(6),
    usd: costUsd.toFixed(2)
  };
};

export const shortenAddress = (address, chars = 4) => {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
};

export const isValidAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const compareAddresses = (addr1, addr2) => {
  if (!addr1 || !addr2) return false;
  return addr1.toLowerCase() === addr2.toLowerCase();
};

export const getTokenBalance = async (tokenAddress, userAddress, provider) => {
  const erc20Abi = [
    'function balanceOf(address owner) view returns (uint256)'
  ];
  
  try {
    const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    const balance = await contract.balanceOf(userAddress);
    return balance.toString();
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return '0';
  }
};

export const getTokenInfo = async (tokenAddress, provider) => {
  const erc20Abi = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)'
  ];
  
  try {
    const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply()
    ]);
    
    return { name, symbol, decimals, totalSupply: totalSupply.toString() };
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
};

export const waitForTransaction = async (txHash, provider, confirmations = 1) => {
  try {
    const receipt = await provider.waitForTransaction(txHash, confirmations);
    return receipt;
  } catch (error) {
    console.error('Error waiting for transaction:', error);
    throw error;
  }
};

export const calculateSlippage = (amount, slippageBps) => {
  const slippageDecimal = slippageBps / 10000;
  const minAmount = amount * (1 - slippageDecimal);
  return minAmount.toString();
};

export const getExplorerUrl = (chainId, type, value) => {
  const explorers = {
    1: 'https://etherscan.io',
    137: 'https://polygonscan.com',
    42161: 'https://arbiscan.io',
    10: 'https://optimistic.etherscan.io',
    42220: 'https://celoscan.io',
    44787: 'https://alfajores.celoscan.io'
  };
  
  const baseUrl = explorers[chainId] || explorers[1];
  
  switch (type) {
    case 'tx':
      return `${baseUrl}/tx/${value}`;
    case 'address':
      return `${baseUrl}/address/${value}`;
    case 'token':
      return `${baseUrl}/token/${value}`;
    case 'block':
      return `${baseUrl}/block/${value}`;
    default:
      return baseUrl;
  }
};

export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

export const getTimeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
