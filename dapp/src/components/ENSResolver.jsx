import { useState } from 'react';
import { useAccount } from 'wagmi';

export default function ENSResolver() {
  const { address, isConnected } = useAccount();
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Mock ENS/UNS resolution - in production, use ethers.js or ENS SDK
  const mockENSData = {
    'vitalik.eth': '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    'nick.eth': '0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5',
    'celo.crypto': '0x123...abc',
    'satoshi.wallet': '0x456...def'
  };

  const mockAddressToName = {
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045': 'vitalik.eth',
    '0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5': 'nick.eth'
  };

  const resolve = async () => {
    setLoading(true);
    setResult(null);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const isAddress = input.match(/^0x[a-fA-F0-9]{40}$/);
    
    if (isAddress) {
      // Address to name
      const name = mockAddressToName[input];
      if (name) {
        setResult({
          type: 'address-to-name',
          input: input,
          output: name,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${input}`,
          found: true
        });
      } else {
        setResult({
          type: 'address-to-name',
          input: input,
          found: false,
          message: 'No ENS/UNS name found for this address'
        });
      }
    } else {
      // Name to address
      const resolvedAddress = mockENSData[input.toLowerCase()];
      if (resolvedAddress) {
        setResult({
          type: 'name-to-address',
          input: input,
          output: resolvedAddress,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${resolvedAddress}`,
          found: true
        });
      } else {
        setResult({
          type: 'name-to-address',
          input: input,
          found: false,
          message: 'Name not found or not registered'
        });
      }
    }

    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '600px',
      margin: '20px auto',
      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '24px' }}>
        🌐 ENS / UNS Resolver
      </h2>
      <p style={{ margin: '0 0 20px 0', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
        Resolve ENS and Unstoppable Domains names
      </p>

      {/* Input */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px'
      }}>
        <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '8px' }}>
          Enter ENS/UNS name or address
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="vitalik.eth or 0x..."
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '14px',
            fontFamily: input.startsWith('0x') ? 'monospace' : 'inherit',
            boxSizing: 'border-box',
            marginBottom: '12px'
          }}
          onKeyPress={(e) => e.key === 'Enter' && resolve()}
        />
        <button
          onClick={resolve}
          disabled={!input || loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: !input || loading ? '#ccc' : '#667eea',
            color: 'white',
            fontWeight: 'bold',
            cursor: !input || loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? '🔍 Resolving...' : '🔍 Resolve'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          {result.found ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <img
                  src={result.avatar}
                  alt="Avatar"
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    border: '3px solid #667eea'
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                    {result.type === 'name-to-address' ? 'Resolved Address' : 'Primary ENS Name'}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    fontFamily: result.type === 'name-to-address' ? 'monospace' : 'inherit',
                    wordBreak: 'break-all',
                    marginBottom: '8px'
                  }}>
                    {result.output}
                  </div>
                  <button
                    onClick={() => copyToClipboard(result.output)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <div style={{
                padding: '12px',
                background: '#f0f9ff',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#0369a1'
              }}>
                <strong>Input:</strong> {result.input}
              </div>
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#666'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>❌</div>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                Not Found
              </div>
              <div style={{ fontSize: '14px' }}>
                {result.message}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Examples */}
      <div style={{
        marginTop: '16px',
        padding: '16px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '8px',
        color: 'white'
      }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', opacity: 0.8 }}>
          Try these examples:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {['vitalik.eth', 'nick.eth', 'celo.crypto'].map(example => (
            <button
              key={example}
              onClick={() => setInput(example)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <p style={{
        marginTop: '16px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        margin: '16px 0 0 0'
      }}>
        💡 Supports ENS (.eth) and Unstoppable Domains (.crypto, .wallet, etc.)
      </p>
    </div>
  );
}
