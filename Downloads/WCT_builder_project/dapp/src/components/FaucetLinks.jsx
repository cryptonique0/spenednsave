import { useAccount, useBalance, useNetwork } from 'wagmi';
import { formatEther } from 'ethers';
import { useState } from 'react';

const FAUCETS = {
  11155111: [ // Sepolia
    {
      name: 'Alchemy Sepolia Faucet',
      url: 'https://sepoliafaucet.com/',
      amount: '0.5 ETH/day',
      requirements: 'Alchemy account',
      recommended: true
    },
    {
      name: 'QuickNode Sepolia Faucet',
      url: 'https://faucet.quicknode.com/ethereum/sepolia',
      amount: '0.1 ETH',
      requirements: 'Twitter account',
      recommended: true
    },
    {
      name: 'Infura Sepolia Faucet',
      url: 'https://www.infura.io/faucet/sepolia',
      amount: '0.5 ETH/day',
      requirements: 'Infura account',
      recommended: false
    },
    {
      name: 'Chainlink Sepolia Faucet',
      url: 'https://faucets.chain.link/sepolia',
      amount: '0.1 ETH',
      requirements: 'GitHub account',
      recommended: false
    },
    {
      name: 'PoW Sepolia Faucet',
      url: 'https://sepolia-faucet.pk910.de/',
      amount: 'Variable',
      requirements: 'Mining (no account)',
      recommended: false
    }
  ],
  1: [ // Mainnet (for reference)
    {
      name: 'Bridge from L2',
      url: 'https://bridge.arbitrum.io/',
      amount: 'Variable',
      requirements: 'Already have ETH on L2',
      recommended: true
    }
  ]
};

const RECOMMENDED_AMOUNT = 0.05; // ETH
const WARNING_THRESHOLD = 0.01; // ETH

export default function FaucetLinks() {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { data: balanceData } = useBalance({ address });
  const [copied, setCopied] = useState(false);

  // Only show for Sepolia testnet
  const faucets = FAUCETS[chain?.id] || [];
  
  if (!address || faucets.length === 0) {
    return null;
  }

  const balance = balanceData ? parseFloat(formatEther(balanceData.value)) : 0;
  const shouldShowWarning = balance < WARNING_THRESHOLD;
  const needsMore = balance < RECOMMENDED_AMOUNT;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div style={styles.container}>
      {/* Balance status */}
      <div style={{
        ...styles.balanceCard,
        ...(shouldShowWarning ? styles.balanceWarning : styles.balanceInfo)
      }}>
        <div style={styles.balanceHeader}>
          <span style={styles.balanceLabel}>
            {shouldShowWarning ? '⚠️ Low Balance' : needsMore ? 'ℹ️ Consider Getting More' : '✅ Balance OK'}
          </span>
          <span style={styles.balanceAmount}>
            {balance.toFixed(4)} ETH
          </span>
        </div>
        {needsMore && (
          <p style={styles.balanceHint}>
            Recommended: {RECOMMENDED_AMOUNT} ETH for testing
          </p>
        )}
      </div>

      {/* Address copy section */}
      <div style={styles.addressSection}>
        <label style={styles.label}>Your Address (copy for faucets)</label>
        <div style={styles.addressContainer}>
          <code style={styles.address}>
            {address.slice(0, 10)}...{address.slice(-8)}
          </code>
          <button
            onClick={copyAddress}
            style={styles.copyButton}
          >
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
        </div>
      </div>

      {/* Faucet list */}
      <div style={styles.faucetList}>
        <h3 style={styles.heading}>
          {chain?.name} Faucets
        </h3>
        <p style={styles.description}>
          Get free test ETH from these faucets. You'll need it to pay for transaction gas.
        </p>

        {faucets.map((faucet, index) => (
          <div
            key={index}
            style={{
              ...styles.faucetCard,
              ...(faucet.recommended ? styles.faucetRecommended : {})
            }}
          >
            {faucet.recommended && (
              <span style={styles.recommendedBadge}>⭐ Recommended</span>
            )}
            <div style={styles.faucetHeader}>
              <h4 style={styles.faucetName}>{faucet.name}</h4>
              <span style={styles.faucetAmount}>{faucet.amount}</span>
            </div>
            <p style={styles.faucetRequirements}>
              <strong>Requirements:</strong> {faucet.requirements}
            </p>
            <a
              href={faucet.url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.faucetLink}
            >
              Visit Faucet →
            </a>
          </div>
        ))}
      </div>

      {/* Usage tips */}
      <div style={styles.tipsCard}>
        <h4 style={styles.tipsHeading}>💡 Tips</h4>
        <ul style={styles.tipsList}>
          <li>Most faucets have daily limits - try multiple ones</li>
          <li>Some require social media verification to prevent abuse</li>
          <li>PoW faucets use CPU mining - slower but no signup needed</li>
          <li>Keep at least {WARNING_THRESHOLD} ETH to avoid transaction failures</li>
          <li>Gas prices vary - claim during off-peak hours to save ETH</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px'
  },
  balanceCard: {
    padding: '16px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '2px solid'
  },
  balanceWarning: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    color: '#856404'
  },
  balanceInfo: {
    backgroundColor: '#d1ecf1',
    borderColor: '#17a2b8',
    color: '#0c5460'
  },
  balanceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  balanceLabel: {
    fontSize: '14px',
    fontWeight: '600'
  },
  balanceAmount: {
    fontSize: '18px',
    fontWeight: 'bold'
  },
  balanceHint: {
    margin: '8px 0 0',
    fontSize: '13px'
  },
  addressSection: {
    marginBottom: '24px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  addressContainer: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  address: {
    flex: 1,
    padding: '10px 14px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '14px'
  },
  copyButton: {
    padding: '10px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  faucetList: {
    marginBottom: '24px'
  },
  heading: {
    margin: '0 0 8px',
    fontSize: '20px',
    color: '#333'
  },
  description: {
    margin: '0 0 16px',
    color: '#666',
    fontSize: '14px'
  },
  faucetCard: {
    padding: '16px',
    marginBottom: '12px',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    backgroundColor: '#fff',
    position: 'relative',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  faucetRecommended: {
    borderColor: '#28a745',
    borderWidth: '2px',
    boxShadow: '0 2px 8px rgba(40, 167, 69, 0.1)'
  },
  recommendedBadge: {
    position: 'absolute',
    top: '-10px',
    right: '12px',
    padding: '4px 10px',
    backgroundColor: '#28a745',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '12px'
  },
  faucetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  faucetName: {
    margin: 0,
    fontSize: '16px',
    color: '#333'
  },
  faucetAmount: {
    padding: '4px 8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#495057'
  },
  faucetRequirements: {
    margin: '0 0 12px',
    fontSize: '13px',
    color: '#666'
  },
  faucetLink: {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s'
  },
  tipsCard: {
    padding: '16px 20px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '8px'
  },
  tipsHeading: {
    margin: '0 0 12px',
    fontSize: '16px',
    color: '#333'
  },
  tipsList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.8'
  }
};
