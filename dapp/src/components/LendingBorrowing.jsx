import { useState } from 'react';
import { useAccount } from 'wagmi';

export default function LendingBorrowing() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('lend');
  const [amount, setAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('CELO');

  const lendingPools = [
    { asset: 'CELO', apy: 5.2, supplied: 15000000, available: 5000000, collateralFactor: 75 },
    { asset: 'cUSD', apy: 4.8, supplied: 8500000, available: 3200000, collateralFactor: 80 },
    { asset: 'ETH', apy: 3.5, supplied: 32000000, available: 12000000, collateralFactor: 82 },
    { asset: 'USDC', apy: 4.2, supplied: 45000000, available: 18000000, collateralFactor: 85 }
  ];

  const borrowRates = [
    { asset: 'CELO', apr: 7.5, borrowed: 10000000, available: 5000000, maxLTV: 75 },
    { asset: 'cUSD', apr: 6.8, borrowed: 5300000, available: 3200000, maxLTV: 80 },
    { asset: 'ETH', apr: 5.2, borrowed: 20000000, available: 12000000, maxLTV: 82 },
    { asset: 'USDC', apr: 6.1, borrowed: 26500000, available: 18000000, maxLTV: 85 }
  ];

  const userPositions = {
    supplied: [
      { asset: 'CELO', amount: 5000, value: 3750, apy: 5.2, earnings: 25.50 },
      { asset: 'cUSD', amount: 2000, value: 2000, apy: 4.8, earnings: 8.20 }
    ],
    borrowed: [
      { asset: 'ETH', amount: 1.5, value: 3000, apr: 5.2, interest: 12.80 }
    ],
    healthFactor: 2.35
  };

  const handleSupply = () => {
    alert(`Supplying ${amount} ${selectedAsset}`);
  };

  const handleBorrow = () => {
    alert(`Borrowing ${amount} ${selectedAsset}`);
  };

  const handleWithdraw = (asset, amount) => {
    alert(`Withdrawing ${amount} ${asset}`);
  };

  const handleRepay = (asset, amount) => {
    alert(`Repaying ${amount} ${asset}`);
  };

  if (!address) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
        color: 'white',
        maxWidth: '1000px',
        margin: '20px auto'
      }}>
        <h2 style={{ margin: '0 0 12px 0' }}>🏦 Lending & Borrowing</h2>
        <p style={{ margin: 0 }}>Connect wallet to lend and borrow crypto</p>
      </div>
    );
  }

  const totalSupplied = userPositions.supplied.reduce((sum, p) => sum + p.value, 0);
  const totalBorrowed = userPositions.borrowed.reduce((sum, p) => sum + p.value, 0);
  const totalEarnings = userPositions.supplied.reduce((sum, p) => sum + p.earnings, 0);
  const borrowLimit = totalSupplied * 0.75;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '1200px',
      margin: '20px auto',
      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '24px' }}>
        🏦 Lending & Borrowing Platform
      </h2>
      <p style={{ margin: '0 0 20px 0', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
        Supply assets to earn interest or borrow against your collateral
      </p>

      {/* User Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            Total Supplied
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
            ${totalSupplied.toLocaleString()}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            Total Borrowed
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f5576c' }}>
            ${totalBorrowed.toLocaleString()}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            Net APY
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            4.2%
          </div>
        </div>

        <div style={{
          background: userPositions.healthFactor > 1.5 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          borderRadius: '12px',
          padding: '16px',
          border: `2px solid ${userPositions.healthFactor > 1.5 ? '#10b981' : '#ef4444'}`
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            Health Factor
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: userPositions.healthFactor > 1.5 ? '#10b981' : '#ef4444'
          }}>
            {userPositions.healthFactor.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px'
      }}>
        {['lend', 'borrow', 'positions'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? 'white' : 'rgba(255,255,255,0.3)',
              color: activeTab === tab ? '#667eea' : 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontSize: '14px'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Lending Tab */}
      {activeTab === 'lend' && (
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>
            Supply Assets to Earn Interest
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {lendingPools.map(pool => (
              <div
                key={pool.asset}
                style={{
                  background: '#f8f9fa',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr 2fr auto',
                  gap: '16px',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    {pool.asset}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>
                    Supply APY
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                    {pool.apy}%
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>
                    Total Supplied
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    ${(pool.supplied / 1000000).toFixed(1)}M
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedAsset(pool.asset);
                    const amt = prompt(`Enter amount of ${pool.asset} to supply:`);
                    if (amt) handleSupply();
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Supply
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Borrowing Tab */}
      {activeTab === 'borrow' && (
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{
            background: '#fef3c7',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            border: '1px solid #fbbf24'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
              Borrow Limit: ${borrowLimit.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Used: ${totalBorrowed.toLocaleString()} ({((totalBorrowed / borrowLimit) * 100).toFixed(1)}%)
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              background: '#e5e7eb',
              borderRadius: '3px',
              marginTop: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(totalBorrowed / borrowLimit) * 100}%`,
                height: '100%',
                background: totalBorrowed / borrowLimit > 0.8 ? '#ef4444' : '#fbbf24'
              }} />
            </div>
          </div>

          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>
            Borrow Assets
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {borrowRates.map(rate => (
              <div
                key={rate.asset}
                style={{
                  background: '#f8f9fa',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr 2fr auto',
                  gap: '16px',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    {rate.asset}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>
                    Borrow APR
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f5576c' }}>
                    {rate.apr}%
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>
                    Available
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    ${(rate.available / 1000000).toFixed(1)}M
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedAsset(rate.asset);
                    const amt = prompt(`Enter amount of ${rate.asset} to borrow:`);
                    if (amt) handleBorrow();
                  }}
                  disabled={totalBorrowed >= borrowLimit}
                  style={{
                    background: totalBorrowed >= borrowLimit ? '#d1d5db' : 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: totalBorrowed >= borrowLimit ? 'not-allowed' : 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Borrow
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positions Tab */}
      {activeTab === 'positions' && (
        <div>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>
              Your Supplied Assets
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {userPositions.supplied.map(position => (
                <div
                  key={position.asset}
                  style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
                      {position.amount.toLocaleString()} {position.asset}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      ${position.value.toLocaleString()} • APY: {position.apy}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>
                      +${position.earnings.toFixed(2)}
                    </div>
                    <button
                      onClick={() => handleWithdraw(position.asset, position.amount)}
                      style={{
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>
              Your Borrowed Assets
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {userPositions.borrowed.map(position => (
                <div
                  key={position.asset}
                  style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
                      {position.amount} {position.asset}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      ${position.value.toLocaleString()} • APR: {position.apr}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ef4444', marginBottom: '4px' }}>
                      -${position.interest.toFixed(2)}
                    </div>
                    <button
                      onClick={() => handleRepay(position.asset, position.amount)}
                      style={{
                        background: '#f5576c',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Repay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
