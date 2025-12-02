import { useState } from 'react';
import { useAccount, useContractRead } from 'wagmi';

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }, { name: '_spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function'
  }
];

export default function TokenApprovalManager() {
  const { address, isConnected } = useAccount();
  const [selectedChain, setSelectedChain] = useState('all');

  // Mock approval data - in production, fetch from blockchain
  const mockApprovals = [
    {
      id: 1,
      token: 'cUSD',
      tokenAddress: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
      spender: 'Ubeswap Router',
      spenderAddress: '0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121',
      allowance: 'Unlimited',
      chain: 'celo',
      lastUpdated: '2 days ago',
      risk: 'medium'
    },
    {
      id: 2,
      token: 'CELO',
      tokenAddress: '0x471EcE3750Da237f93B8E339c536989b8978a438',
      spender: 'Unknown Contract',
      spenderAddress: '0x123...789',
      allowance: '1000000',
      chain: 'celo',
      lastUpdated: '1 week ago',
      risk: 'high'
    },
    {
      id: 3,
      token: 'USDC',
      tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      spender: 'Uniswap V3',
      spenderAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      allowance: '500',
      chain: 'ethereum',
      lastUpdated: '3 days ago',
      risk: 'low'
    }
  ];

  const chains = ['all', 'celo', 'ethereum', 'polygon'];

  const filteredApprovals = selectedChain === 'all'
    ? mockApprovals
    : mockApprovals.filter(a => a.chain === selectedChain);

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#999';
    }
  };

  const revokeApproval = (approval) => {
    if (confirm(`Revoke approval for ${approval.spender} to spend your ${approval.token}?`)) {
      alert('Revoke transaction sent! (Demo mode)');
    }
  };

  if (!isConnected) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '800px',
        margin: '20px auto',
        color: 'white',
        textAlign: 'center'
      }}>
        <h2>🔒 Token Approval Manager</h2>
        <p>Connect your wallet to manage token approvals</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '800px',
      margin: '20px auto',
      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '24px' }}>
        🔒 Token Approval Manager
      </h2>
      <p style={{ margin: '0 0 20px 0', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
        Review and revoke token approvals to protect your assets
      </p>

      {/* Warning Banner */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        borderLeft: '4px solid #f59e0b'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#92400e' }}>
          ⚠️ Security Notice
        </div>
        <div style={{ fontSize: '13px', color: '#78350f' }}>
          Unlimited approvals allow contracts to spend all your tokens. Revoke unused approvals to improve security.
        </div>
      </div>

      {/* Chain Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {chains.map(chain => (
          <button
            key={chain}
            onClick={() => setSelectedChain(chain)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: selectedChain === chain ? 'white' : 'rgba(255,255,255,0.2)',
              color: selectedChain === chain ? '#ef4444' : 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {chain}
          </button>
        ))}
      </div>

      {/* Approvals List */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        {filteredApprovals.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            No approvals found on {selectedChain} network
          </div>
        ) : (
          filteredApprovals.map((approval, index) => (
            <div
              key={approval.id}
              style={{
                padding: '16px',
                borderBottom: index < filteredApprovals.length - 1 ? '1px solid #f3f4f6' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                      {approval.token}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: getRiskColor(approval.risk) + '20',
                      color: getRiskColor(approval.risk),
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {approval.risk} risk
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: '#f0f9ff',
                      color: '#0284c7',
                      fontSize: '11px',
                      textTransform: 'capitalize'
                    }}>
                      {approval.chain}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '2px' }}>
                    Spender: <span style={{ fontWeight: 'bold' }}>{approval.spender}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#999', fontFamily: 'monospace' }}>
                    {approval.spenderAddress}
                  </div>
                </div>
                <button
                  onClick={() => revokeApproval(approval)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#ef4444',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                    marginLeft: '12px'
                  }}
                >
                  Revoke
                </button>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#666',
                paddingTop: '8px',
                borderTop: '1px solid #f3f4f6'
              }}>
                <span>
                  Allowance: <strong>{approval.allowance === 'Unlimited' ? '∞ Unlimited' : approval.allowance}</strong>
                </span>
                <span>{approval.lastUpdated}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginTop: '16px'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '12px',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {mockApprovals.length}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>Total Approvals</div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '12px',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {mockApprovals.filter(a => a.allowance === 'Unlimited').length}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>Unlimited</div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '12px',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {mockApprovals.filter(a => a.risk === 'high').length}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>High Risk</div>
        </div>
      </div>

      <p style={{
        marginTop: '16px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        margin: '16px 0 0 0'
      }}>
        💡 Regularly review and revoke unused approvals for better security
      </p>
    </div>
  );
}
