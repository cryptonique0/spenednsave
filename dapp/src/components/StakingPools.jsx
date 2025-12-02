import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

const StakingPools = () => {
  const { address } = useAccount();
  const [pools, setPools] = useState([]);
  const [userStakes, setUserStakes] = useState([]);
  const [selectedPool, setSelectedPool] = useState(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pools');

  useEffect(() => {
    // Mock staking pools
    setPools([
      {
        id: 1,
        name: 'CELO Staking',
        token: 'CELO',
        apy: 12.5,
        tvl: 15000000,
        minStake: 1,
        lockPeriod: 0,
        rewards: 'CELO',
        totalStakers: 2345,
        flexible: true
      },
      {
        id: 2,
        name: 'cUSD Fixed 30D',
        token: 'cUSD',
        apy: 18.5,
        tvl: 5000000,
        minStake: 100,
        lockPeriod: 30,
        rewards: 'cUSD',
        totalStakers: 876,
        flexible: false
      },
      {
        id: 3,
        name: 'cEUR Fixed 90D',
        token: 'cEUR',
        apy: 25.0,
        tvl: 3000000,
        minStake: 100,
        lockPeriod: 90,
        rewards: 'cEUR',
        totalStakers: 543,
        flexible: false
      },
      {
        id: 4,
        name: 'CELO Fixed 180D',
        token: 'CELO',
        apy: 32.5,
        tvl: 8000000,
        minStake: 10,
        lockPeriod: 180,
        rewards: 'CELO',
        totalStakers: 1234,
        flexible: false
      },
      {
        id: 5,
        name: 'Multi-Asset Pool',
        token: 'LP Token',
        apy: 45.0,
        tvl: 2500000,
        minStake: 1,
        lockPeriod: 60,
        rewards: 'CELO + Bonus',
        totalStakers: 432,
        flexible: false
      }
    ]);

    // Mock user stakes
    if (address) {
      setUserStakes([
        {
          poolId: 1,
          poolName: 'CELO Staking',
          amount: 500,
          token: 'CELO',
          earned: 15.3,
          apy: 12.5,
          stakedAt: Math.floor(Date.now() / 1000) - 2592000, // 30 days ago
          unlockAt: null
        },
        {
          poolId: 3,
          poolName: 'cEUR Fixed 90D',
          amount: 1000,
          token: 'cEUR',
          earned: 68.5,
          apy: 25.0,
          stakedAt: Math.floor(Date.now() / 1000) - 5184000, // 60 days ago
          unlockAt: Math.floor(Date.now() / 1000) + 2592000 // 30 days from now
        }
      ]);
    }
  }, [address]);

  const handleStake = async (pool) => {
    if (!address) return;
    if (!stakeAmount || parseFloat(stakeAmount) < pool.minStake) {
      alert(`Minimum stake amount is ${pool.minStake} ${pool.token}`);
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Successfully staked ${stakeAmount} ${pool.token} in ${pool.name}`);
      setStakeAmount('');
      setSelectedPool(null);
    } catch (error) {
      alert('Staking failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async (stake) => {
    if (!address) return;

    const pool = pools.find(p => p.id === stake.poolId);
    if (stake.unlockAt && stake.unlockAt > Date.now() / 1000) {
      const daysLeft = Math.ceil((stake.unlockAt - Date.now() / 1000) / 86400);
      alert(`Cannot unstake yet. Unlocks in ${daysLeft} days.`);
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Successfully unstaked ${stake.amount} ${stake.token} from ${stake.poolName}`);
    } catch (error) {
      alert('Unstaking failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (stake) => {
    if (!address) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert(`Claimed ${stake.earned.toFixed(4)} ${stake.token} rewards`);
    } catch (error) {
      alert('Claim failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Flexible';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  const getDaysStaked = (stakedAt) => {
    const now = Math.floor(Date.now() / 1000);
    const days = Math.floor((now - stakedAt) / 86400);
    return days;
  };

  if (!address) {
    return (
      <div style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        borderRadius: '12px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Staking Pools 💰</h2>
        <p>Please connect your wallet to start staking</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      borderRadius: '12px'
    }}>
      <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>
        Staking Pools 💰
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '2rem' }}>
        Stake your tokens to earn passive rewards
      </p>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          padding: '1rem',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
            Total Staked
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
            {formatCurrency(userStakes.reduce((sum, s) => sum + s.amount * 2, 0))}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.95)',
          padding: '1rem',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
            Total Earned
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
            {formatCurrency(userStakes.reduce((sum, s) => sum + s.earned * 2, 0))}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.95)',
          padding: '1rem',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
            Active Pools
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
            {userStakes.length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('pools')}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: activeTab === 'pools' ? 'white' : 'rgba(255,255,255,0.2)',
            color: activeTab === 'pools' ? '#fa709a' : 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          All Pools ({pools.length})
        </button>
        <button
          onClick={() => setActiveTab('myStakes')}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: activeTab === 'myStakes' ? 'white' : 'rgba(255,255,255,0.2)',
            color: activeTab === 'myStakes' ? '#fa709a' : 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          My Stakes ({userStakes.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'pools' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pools.map(pool => (
            <div
              key={pool.id}
              style={{
                background: 'rgba(255,255,255,0.95)',
                padding: '1.5rem',
                borderRadius: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>{pool.name}</h3>
                    {pool.flexible ? (
                      <span style={{
                        background: '#10b981',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        Flexible
                      </span>
                    ) : (
                      <span style={{
                        background: '#ef4444',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        Locked {pool.lockPeriod}D
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    Stake {pool.token} • Earn {pool.rewards}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                    {pool.apy}%
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>APY</div>
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '1rem', 
                marginBottom: '1rem' 
              }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>TVL</div>
                  <div style={{ fontWeight: 'bold' }}>{formatCurrency(pool.tvl)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>Min Stake</div>
                  <div style={{ fontWeight: 'bold' }}>{pool.minStake} {pool.token}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Stakers</div>
                  <div style={{ fontWeight: 'bold' }}>{pool.totalStakers.toLocaleString()}</div>
                </div>
              </div>

              {selectedPool?.id === pool.id ? (
                <div>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder={`Amount (min: ${pool.minStake} ${pool.token})`}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleStake(pool)}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        opacity: loading ? 0.5 : 1
                      }}
                    >
                      {loading ? 'Staking...' : 'Confirm Stake'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPool(null);
                        setStakeAmount('');
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        background: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedPool(pool)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Stake {pool.token}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'myStakes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {userStakes.length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              padding: '2rem',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#666'
            }}>
              <p>You don't have any active stakes yet.</p>
              <p>Start staking to earn rewards!</p>
            </div>
          ) : (
            userStakes.map((stake, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  padding: '1.5rem',
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>{stake.poolName}</h3>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      {getDaysStaked(stake.stakedAt)} days staked • APY: {stake.apy}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
                      {stake.amount} {stake.token}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>Staked Amount</div>
                  </div>
                </div>

                <div style={{
                  background: '#f3f4f6',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>Rewards Earned</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                        {stake.earned.toFixed(4)} {stake.token}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>Unlock Date</div>
                      <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                        {formatDate(stake.unlockAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleClaim(stake)}
                    disabled={loading}
                    style={{
                      padding: '0.75rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      opacity: loading ? 0.5 : 1
                    }}
                  >
                    Claim Rewards
                  </button>
                  <button
                    onClick={() => handleUnstake(stake)}
                    disabled={loading}
                    style={{
                      padding: '0.75rem',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      opacity: loading ? 0.5 : 1
                    }}
                  >
                    Unstake
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default StakingPools;
