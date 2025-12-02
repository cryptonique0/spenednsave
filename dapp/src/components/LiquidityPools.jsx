import { useState } from 'react';
import { useAccount } from 'wagmi';

export default function LiquidityPools() {
  const { address } = useAccount();
  const [selectedPool, setSelectedPool] = useState(null);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');

  const pools = [
    {
      id: 1,
      name: 'CELO/cUSD',
      tokenA: 'CELO',
      tokenB: 'cUSD',
      apr: 45.8,
      tvl: 12500000,
      volume24h: 850000,
      yourLiquidity: 5000,
      yourShare: 0.04,
      rewards: 125.50
    },
    {
      id: 2,
      name: 'ETH/USDC',
      tokenA: 'ETH',
      tokenB: 'USDC',
      apr: 32.5,
      tvl: 85000000,
      volume24h: 5200000,
      yourLiquidity: 0,
      yourShare: 0,
      rewards: 0
    },
    {
      id: 3,
      name: 'cUSD/cEUR',
      tokenA: 'cUSD',
      tokenB: 'cEUR',
      apr: 18.3,
      tvl: 3200000,
      volume24h: 180000,
      yourLiquidity: 1200,
      yourShare: 0.0375,
      rewards: 22.15
    },
    {
      id: 4,
      name: 'CELO/ETH',
      tokenA: 'CELO',
      tokenB: 'ETH',
      apr: 55.2,
      tvl: 8900000,
      volume24h: 720000,
      yourLiquidity: 0,
      yourShare: 0,
      rewards: 0
    }
  ];

  const handleAddLiquidity = () => {
    if (!amountA || !amountB) {
      alert('Please enter both token amounts');
      return;
    }
    alert(`Adding liquidity: ${amountA} ${selectedPool.tokenA} + ${amountB} ${selectedPool.tokenB}`);
    setAmountA('');
    setAmountB('');
  };

  const handleRemoveLiquidity = (pool) => {
    if (pool.yourLiquidity === 0) {
      alert('No liquidity to remove from this pool');
      return;
    }
    alert(`Removing liquidity from ${pool.name}. You'll receive ${pool.tokenA} and ${pool.tokenB}`);
  };

  const handleClaimRewards = (pool) => {
    if (pool.rewards === 0) {
      alert('No rewards to claim');
      return;
    }
    alert(`Claiming ${pool.rewards.toFixed(2)} tokens from ${pool.name} pool`);
  };

  if (!address) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
        color: 'white',
        maxWidth: '900px',
        margin: '20px auto'
      }}>
        <h2 style={{ margin: '0 0 12px 0' }}>🌊 Liquidity Pools</h2>
        <p style={{ margin: 0 }}>Connect wallet to provide liquidity and earn rewards</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '1000px',
      margin: '20px auto',
      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '24px' }}>
        🌊 Liquidity Pools
      </h2>
      <p style={{ margin: '0 0 20px 0', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
        Provide liquidity and earn trading fees + rewards
      </p>

      {/* Your Liquidity Summary */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>
          Your Liquidity Overview
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              Total Value Locked
            </div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#f5576c' }}>
              ${pools.reduce((sum, p) => sum + p.yourLiquidity, 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              Active Pools
            </div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#f5576c' }}>
              {pools.filter(p => p.yourLiquidity > 0).length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              Claimable Rewards
            </div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#10b981' }}>
              ${pools.reduce((sum, p) => sum + p.rewards, 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Pools Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {pools.map(pool => (
          <div
            key={pool.id}
            style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '12px',
              padding: '20px',
              border: selectedPool?.id === pool.id ? '2px solid #f5576c' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#333' }}>
                  {pool.name}
                </h3>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {pool.tokenA}/{pool.tokenB}
                </div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {pool.apr}% APR
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                  TVL
                </div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333' }}>
                  ${(pool.tvl / 1000000).toFixed(2)}M
                </div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                  24h Volume
                </div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333' }}>
                  ${(pool.volume24h / 1000).toFixed(0)}K
                </div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                  Your Liquidity
                </div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: pool.yourLiquidity > 0 ? '#10b981' : '#999' }}>
                  ${pool.yourLiquidity.toLocaleString()}
                </div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                  Your Share
                </div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333' }}>
                  {pool.yourShare.toFixed(3)}%
                </div>
              </div>
            </div>

            {pool.rewards > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '11px', marginBottom: '2px', opacity: 0.9 }}>
                    Rewards Available
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    ${pool.rewards.toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={() => handleClaimRewards(pool)}
                  style={{
                    background: 'white',
                    color: '#10b981',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Claim
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setSelectedPool(pool)}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Add Liquidity
              </button>
              {pool.yourLiquidity > 0 && (
                <button
                  onClick={() => handleRemoveLiquidity(pool)}
                  style={{
                    flex: 1,
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Liquidity Modal */}
      {selectedPool && (
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#333' }}>
            Add Liquidity to {selectedPool.name}
          </h3>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
              {selectedPool.tokenA} Amount
            </label>
            <input
              type="number"
              value={amountA}
              onChange={(e) => setAmountA(e.target.value)}
              placeholder="0.0"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
              {selectedPool.tokenB} Amount
            </label>
            <input
              type="number"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value)}
              placeholder="0.0"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{
            background: '#f8f9fa',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#666'
          }}>
            💡 You'll receive LP tokens representing your share of the pool
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAddLiquidity}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Add Liquidity
            </button>
            <button
              onClick={() => setSelectedPool(null)}
              style={{
                flex: 1,
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
