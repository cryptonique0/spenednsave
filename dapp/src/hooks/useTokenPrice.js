import { useState, useEffect } from 'react';
import { API_ENDPOINTS, fetcher } from '../config/api';

/**
 * Custom hook to fetch and track token prices
 * @param {string} tokenAddress - Token contract address
 * @param {string} chainId - Chain ID
 * @returns {Object} - Price data and loading state
 */
export const useTokenPrice = (tokenAddress, chainId) => {
  const [price, setPrice] = useState(null);
  const [priceChange24h, setPriceChange24h] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tokenAddress) {
      setLoading(false);
      return;
    }

    const fetchPrice = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use CoinGecko API endpoint
        const platform = getPlatformId(chainId);
        const url = `${API_ENDPOINTS.COINGECKO}/simple/token_price/${platform}?contract_addresses=${tokenAddress}&vs_currencies=usd&include_24hr_change=true`;
        
        const data = await fetcher(url);
        
        if (data && data[tokenAddress.toLowerCase()]) {
          setPrice(data[tokenAddress.toLowerCase()].usd);
          setPriceChange24h(data[tokenAddress.toLowerCase()].usd_24h_change || 0);
        }
      } catch (err) {
        console.error('Error fetching token price:', err);
        setError(err.message);
        // Use mock data on error
        setPrice(Math.random() * 100);
        setPriceChange24h((Math.random() - 0.5) * 20);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();

    // Update price every 30 seconds
    const interval = setInterval(fetchPrice, 30000);

    return () => clearInterval(interval);
  }, [tokenAddress, chainId]);

  return { price, priceChange24h, loading, error };
};

/**
 * Hook to fetch multiple token prices at once
 * @param {Array} tokens - Array of {address, chainId} objects
 * @returns {Object} - Prices object keyed by token address
 */
export const useTokenPrices = (tokens) => {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tokens || tokens.length === 0) {
      setLoading(false);
      return;
    }

    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);

        const priceData = {};
        
        // Group tokens by platform
        const tokensByPlatform = {};
        tokens.forEach(token => {
          const platform = getPlatformId(token.chainId);
          if (!tokensByPlatform[platform]) {
            tokensByPlatform[platform] = [];
          }
          tokensByPlatform[platform].push(token.address);
        });

        // Fetch prices for each platform
        await Promise.all(
          Object.entries(tokensByPlatform).map(async ([platform, addresses]) => {
            try {
              const url = `${API_ENDPOINTS.COINGECKO}/simple/token_price/${platform}?contract_addresses=${addresses.join(',')}&vs_currencies=usd&include_24hr_change=true`;
              const data = await fetcher(url);
              
              Object.entries(data).forEach(([address, priceInfo]) => {
                priceData[address] = {
                  price: priceInfo.usd,
                  change24h: priceInfo.usd_24h_change || 0
                };
              });
            } catch (err) {
              console.error(`Error fetching prices for ${platform}:`, err);
            }
          })
        );

        setPrices(priceData);
      } catch (err) {
        console.error('Error fetching token prices:', err);
        setError(err.message);
        
        // Generate mock data on error
        const mockPrices = {};
        tokens.forEach(token => {
          mockPrices[token.address.toLowerCase()] = {
            price: Math.random() * 100,
            change24h: (Math.random() - 0.5) * 20
          };
        });
        setPrices(mockPrices);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();

    // Update prices every 30 seconds
    const interval = setInterval(fetchPrices, 30000);

    return () => clearInterval(interval);
  }, [JSON.stringify(tokens)]);

  return { prices, loading, error };
};

// Helper function to get platform ID for CoinGecko
function getPlatformId(chainId) {
  const platformMap = {
    1: 'ethereum',
    137: 'polygon-pos',
    42161: 'arbitrum-one',
    10: 'optimistic-ethereum',
    42220: 'celo',
    44787: 'celo',
    56: 'binance-smart-chain',
    43114: 'avalanche'
  };
  
  return platformMap[chainId] || 'ethereum';
}
