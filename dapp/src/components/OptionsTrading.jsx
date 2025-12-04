import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

const OptionsTrading = () => {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('market');
  const [options, setOptions] = useState([]);
  const [userPositions, setUserPositions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mock options data
    setOptions([
      {
        id: 1,
        type: 'CALL',
        underlying: 'CELO',
        strikePrice: 1.20,
        currentPrice: 1.00,
        premium: 0.05,
        expiry: Math.floor(Date.now() / 1000) + 604800, // 7 days
        impliedVolatility: 45.5,
        delta: 0.65,
        inTheMoney: false
      },
      {
        id: 2,
        type: 'PUT',
        underlying: 'CELO',
        strikePrice: 0.80,
        currentPrice: 1.00,
        premium: 0.03,
        expiry: Math.floor(Date.now() / 1000) + 1209600, // 14 days
        impliedVolatility: 38.2,
        delta: -0.35,
        inTheMoney: false
      },
      {
        id: 3,
        type: 'CALL',
        underlying: 'ETH',
        strikePrice: 2500,
        currentPrice: 2300,
        premium: 125,
        expiry: Math.floor(Date.now() / 1000) + 2592000, // 30 days
        impliedVolatility: 52.8,
        delta: 0.48,
        inTheMoney: false
      },
      {
        id: 4,
        type: 'PUT',
        underlying: 'ETH',
        strikePrice: 2000,
        currentPrice: 2300,
        premium: 75,
        expiry: Math.floor(Date.now() / 1000) + 1209600,
        impliedVolatility: 41.3,
        delta: -0.28,
        inTheMoney: false
      },
      {
        id: 5,
        type: 'CALL',
        underlying: 'CELO',
        strikePrice: 0.95,
        currentPrice: 1.00,
        premium: 0.08,
        expiry: Math.floor(Date.now() / 1000) + 259200, // 3 days
        impliedVolatility: 58.9,
        delta: 0.82,
        inTheMoney: true
      }
    ]);

    if (address) {
      setUserPositions([
        {
          id: 101,
          type: 'CALL',
          underlying: 'CELO',
          strikePrice: 1.10,
          currentPrice: 1.00,
          purchasePrice: 0.06,
          currentValue: 0.04,
          quantity: 10,
          expiry: Math.floor(Date.now() / 1000) + 432000,
          pnl: -20
        },
        {
          id: 102,
          type: 'PUT',
          underlying: 'ETH',
          strikePrice: 2200,
          currentPrice: 2300,
          purchasePrice: 90,
          currentValue: 65,
          quantity: 2,
          expiry: Math.floor(Date.now() / 1000) + 864000,
          pnl: -27.78
        }
      ]);
    }
  }, [address]);

  const handleBuyOption = async (option) => {
    if (!address || !amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const totalCost = option.premium * parseFloat(amount);
      alert(`Successfully purchased ${amount} ${option.type} option(s) for ${totalCost.toFixed(4)} ${option.underlying === 'CELO' ? 'CELO' : 'ETH'}`);
      setAmount('');
      setSelectedOption(null);
    } catch (error) {
      alert('Purchase failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExercise = async (position) => {
    if (!address) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Successfully exercised ${position.type} option for ${position.underlying}`);
    } catch (error) {
      alert('Exercise failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (position) => {
    if (!address) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pnlAmount = (position.currentValue - position.purchasePrice) * position.quantity;
      alert(`Position closed. P/L: ${pnlAmount > 0 ? '+' : ''}${pnlAmount.toFixed(2)}`);
    } catch (error) {
      alert('Close failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatExpiry = (timestamp) => {
    const now = Date.now() / 1000;
    const diff = timestamp - now;
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const getMoneyness = (option) => {
    if (option.type === 'CALL') {
      return option.currentPrice > option.strikePrice ? 'ITM' : 'OTM';
    }
    return option.currentPrice < option.strikePrice ? 'ITM' : 'OTM';
  };

  if (!address) {
    return (
      <div style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, #00d2ff 0%, #3a47d5 100%)',
        borderRadius: '12px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Options Trading 📊</h2>
        <p>Please connect your wallet to trade options</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      background: 'linear-gradient(135deg, #00d2ff 0%, #3a47d5 100%)',
      borderRadius: '12px'
    }}>
      <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>
        Options Trading 📊
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '2rem' }}>
        Trade crypto options with leverage
      </p>

      {/* Stats */}
      {userPositions.length > 0 && (
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
              Active Positions
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
              {userPositions.length}
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.95)',
            padding: '1rem',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
              Total P/L
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: userPositions.reduce((sum, p) => sum + p.pnl, 0) >= 0 ? '#10b981' : '#ef4444'
            }}>
              {userPositions.reduce((sum, p) => sum + p.pnl, 0).toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('market')}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: activeTab === 'market' ? 'white' : 'rgba(255,255,255,0.2)',
            color: activeTab === 'market' ? '#3a47d5' : 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Market
        </button>
        <button
          onClick={() => setActiveTab('positions')}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: activeTab === 'positions' ? 'white' : 'rgba(255,255,255,0.2)',
            color: activeTab === 'positions' ? '#3a47d5' : 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          My Positions ({userPositions.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'market' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {options.map(option => (
            <div
              key={option.id}
              style={{
                background: 'rgba(255,255,255,0.95)',
                padding: '1.5rem',
                borderRadius: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>{option.underlying} {option.type}</h3>
                    <span style={{
                      background: option.type === 'CALL' ? '#10b981' : '#ef4444',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {option.type}
                    </span>
                    <span style={{
                      background: option.inTheMoney ? '#10b981' : '#6b7280',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem'
                    }}>
                      {getMoneyness(option)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    Strike: ${option.strikePrice} • Expires in {formatExpiry(option.expiry)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
                    ${option.premium}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>Premium</div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>Current Price</div>
                  <div style={{ fontWeight: 'bold' }}>${option.currentPrice}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>IV</div>
                  <div style={{ fontWeight: 'bold' }}>{option.impliedVolatility}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>Delta</div>
                  <div style={{ fontWeight: 'bold' }}>{option.delta}</div>
                </div>
              </div>

              {selectedOption?.id === option.id ? (
                <div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Number of contracts"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <div style={{
                    background: '#f3f4f6',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    Total Cost: ${(option.premium * (parseFloat(amount) || 0)).toFixed(4)}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleBuyOption(option)}
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
                      {loading ? 'Processing...' : 'Buy Option'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOption(null);
                        setAmount('');
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
                  onClick={() => setSelectedOption(option)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#3a47d5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Trade
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'positions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {userPositions.length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              padding: '2rem',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#666'
            }}>
              <p>No active positions</p>
              <p>Buy options from the market to get started</p>
            </div>
          ) : (
            userPositions.map(position => (
              <div
                key={position.id}
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  padding: '1.5rem',
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0 }}>{position.underlying} {position.type}</h3>
                      <span style={{
                        background: position.type === 'CALL' ? '#10b981' : '#ef4444',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        {position.type}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      Strike: ${position.strikePrice} • {position.quantity} contracts
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: position.pnl >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(2)}%
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>P/L</div>
                  </div>
                </div>

                <div style={{
                  background: '#f3f4f6',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>Purchase Price</div>
                      <div style={{ fontWeight: 'bold' }}>${position.purchasePrice}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>Current Value</div>
                      <div style={{ fontWeight: 'bold' }}>${position.currentValue}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>Expires In</div>
                      <div style={{ fontWeight: 'bold' }}>{formatExpiry(position.expiry)}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleExercise(position)}
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
                    Exercise
                  </button>
                  <button
                    onClick={() => handleClose(position)}
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
                    Close Position
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

export default OptionsTrading;
