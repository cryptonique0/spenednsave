/**
 * Validation utility functions
 */

/**
 * Validate Ethereum address format
 * @param {string} address - Address to validate
 * @returns {boolean} - True if valid
 */
export const isValidAddress = (address) => {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validate transaction hash format
 * @param {string} hash - Transaction hash to validate
 * @returns {boolean} - True if valid
 */
export const isValidTxHash = (hash) => {
  if (!hash) return false;
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
};

/**
 * Validate ENS name format
 * @param {string} name - ENS name to validate
 * @returns {boolean} - True if valid
 */
export const isValidENSName = (name) => {
  if (!name) return false;
  return /^[a-z0-9-]+\.eth$/.test(name.toLowerCase());
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid
 */
export const isValidUrl = (url) => {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate numeric input
 * @param {string|number} value - Value to validate
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @param {boolean} options.allowDecimals - Allow decimal values
 * @returns {boolean} - True if valid
 */
export const isValidNumber = (value, options = {}) => {
  const { min, max, allowDecimals = true } = options;
  
  if (value === null || value === undefined || value === '') return false;
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return false;
  
  if (!allowDecimals && !Number.isInteger(num)) return false;
  
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  
  return true;
};

/**
 * Validate token amount (positive number with max decimals)
 * @param {string|number} amount - Amount to validate
 * @param {number} maxDecimals - Maximum decimal places (default: 18)
 * @returns {boolean} - True if valid
 */
export const isValidTokenAmount = (amount, maxDecimals = 18) => {
  if (!amount || amount === '0') return false;
  
  const amountStr = amount.toString();
  
  // Check if it's a valid number
  if (!/^\d+\.?\d*$/.test(amountStr)) return false;
  
  const num = parseFloat(amountStr);
  if (num <= 0) return false;
  
  // Check decimal places
  const parts = amountStr.split('.');
  if (parts.length > 1 && parts[1].length > maxDecimals) {
    return false;
  }
  
  return true;
};

/**
 * Validate percentage value (0-100)
 * @param {string|number} value - Percentage to validate
 * @param {boolean} allowZero - Allow 0% (default: true)
 * @returns {boolean} - True if valid
 */
export const isValidPercentage = (value, allowZero = true) => {
  if (value === null || value === undefined) return false;
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return false;
  if (!allowZero && num === 0) return false;
  if (num < 0 || num > 100) return false;
  
  return true;
};

/**
 * Validate slippage value (typically 0.1-50%)
 * @param {string|number} value - Slippage percentage
 * @returns {boolean} - True if valid
 */
export const isValidSlippage = (value) => {
  return isValidNumber(value, { min: 0.01, max: 50 });
};

/**
 * Validate gas limit
 * @param {string|number} gasLimit - Gas limit to validate
 * @returns {boolean} - True if valid
 */
export const isValidGasLimit = (gasLimit) => {
  return isValidNumber(gasLimit, { 
    min: 21000, 
    max: 30000000, 
    allowDecimals: false 
  });
};

/**
 * Validate private key format
 * @param {string} privateKey - Private key to validate
 * @returns {boolean} - True if valid
 */
export const isValidPrivateKey = (privateKey) => {
  if (!privateKey) return false;
  
  // Remove 0x prefix if present
  const key = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  
  return /^[a-fA-F0-9]{64}$/.test(key);
};

/**
 * Validate mnemonic phrase (12 or 24 words)
 * @param {string} mnemonic - Mnemonic phrase
 * @returns {boolean} - True if valid
 */
export const isValidMnemonic = (mnemonic) => {
  if (!mnemonic) return false;
  
  const words = mnemonic.trim().split(/\s+/);
  return words.length === 12 || words.length === 24;
};

/**
 * Validate date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {boolean} - True if valid
 */
export const isValidDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  
  return startDate <= endDate;
};

/**
 * Validate chain ID
 * @param {number} chainId - Chain ID to validate
 * @param {Array} supportedChains - Array of supported chain IDs
 * @returns {boolean} - True if valid
 */
export const isValidChainId = (chainId, supportedChains = []) => {
  if (!chainId) return false;
  
  if (supportedChains.length === 0) return true;
  
  return supportedChains.includes(chainId);
};

/**
 * Validate token symbol (2-10 uppercase letters)
 * @param {string} symbol - Token symbol
 * @returns {boolean} - True if valid
 */
export const isValidTokenSymbol = (symbol) => {
  if (!symbol) return false;
  return /^[A-Z]{2,10}$/.test(symbol);
};

/**
 * Validate token name (2-50 characters)
 * @param {string} name - Token name
 * @returns {boolean} - True if valid
 */
export const isValidTokenName = (name) => {
  if (!name) return false;
  
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 50;
};

/**
 * Validate contract ABI (must be valid JSON array)
 * @param {string} abi - ABI JSON string
 * @returns {boolean} - True if valid
 */
export const isValidABI = (abi) => {
  if (!abi) return false;
  
  try {
    const parsed = JSON.parse(abi);
    return Array.isArray(parsed);
  } catch {
    return false;
  }
};

/**
 * Validate hex string
 * @param {string} hex - Hex string
 * @returns {boolean} - True if valid
 */
export const isValidHex = (hex) => {
  if (!hex) return false;
  
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  return /^[a-fA-F0-9]*$/.test(cleanHex);
};

/**
 * Validate IPFS hash
 * @param {string} hash - IPFS hash
 * @returns {boolean} - True if valid
 */
export const isValidIPFSHash = (hash) => {
  if (!hash) return false;
  
  // CIDv0 (Qm...)
  if (/^Qm[a-zA-Z0-9]{44}$/.test(hash)) return true;
  
  // CIDv1 (baf...)
  if (/^baf[a-z0-9]+$/.test(hash)) return true;
  
  return false;
};

/**
 * Sanitize user input (remove potentially dangerous characters)
 * @param {string} input - User input
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate that a value is within acceptable bounds
 * @param {number} value - Value to check
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {Object} - {valid: boolean, clampedValue: number}
 */
export const validateBounds = (value, min, max) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return { valid: false, clampedValue: min };
  }
  
  const valid = num >= min && num <= max;
  const clampedValue = Math.max(min, Math.min(max, num));
  
  return { valid, clampedValue };
};

/**
 * Check if an address is the zero address
 * @param {string} address - Address to check
 * @returns {boolean} - True if zero address
 */
export const isZeroAddress = (address) => {
  if (!address) return false;
  return address === '0x0000000000000000000000000000000000000000';
};

/**
 * Validate deadline (must be in the future)
 * @param {number} timestamp - Unix timestamp
 * @returns {boolean} - True if valid
 */
export const isValidDeadline = (timestamp) => {
  if (!timestamp) return false;
  
  const now = Math.floor(Date.now() / 1000);
  return timestamp > now;
};
