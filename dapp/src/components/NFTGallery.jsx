import { useState } from 'react';
import { useAccount } from 'wagmi';

export default function NFTGallery() {
  const { address, isConnected } = useAccount();
  const [selectedChain, setSelectedChain] = useState('celo');
  
  // Mock NFT data - in production, fetch from APIs like Alchemy, Moralis, or TheGraph
  const mockNFTs = [
    {
      id: 1,
      name: 'Celo Punk #1234',
      collection: 'Celo Punks',
      image: 'https://via.placeholder.com/200/667eea/ffffff?text=NFT+1',
      chain: 'celo',
      traits: { Rarity: 'Rare', Type: 'Punk' }
    },
    {
      id: 2,
      name: 'Celo Ape #5678',
      collection: 'Celo Apes',
      image: 'https://via.placeholder.com/200/764ba2/ffffff?text=NFT+2',
      chain: 'celo',
      traits: { Rarity: 'Common', Type: 'Ape' }
    },
    {
      id: 3,
      name: 'Ethereum Art #999',
      collection: 'ETH Art',
      image: 'https://via.placeholder.com/200/f093fb/ffffff?text=NFT+3',
      chain: 'ethereum',
      traits: { Rarity: 'Legendary', Type: 'Art' }
    },
    {
      id: 4,
      name: 'Polygon NFT #111',
      collection: 'MATIC Collection',
      image: 'https://via.placeholder.com/200/f5576c/ffffff?text=NFT+4',
      chain: 'polygon',
      traits: { Rarity: 'Epic', Type: 'Character' }
    }
  ];

  const [selectedNFT, setSelectedNFT] = useState(null);
  const chains = ['all', 'celo', 'ethereum', 'polygon'];

  const filteredNFTs = selectedChain === 'all' 
    ? mockNFTs 
    : mockNFTs.filter(nft => nft.chain === selectedChain);

  if (!isConnected) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '1000px',
        margin: '20px auto',
        color: 'white',
        textAlign: 'center'
      }}>
        <h2>🖼️ NFT Gallery</h2>
        <p>Connect your wallet to view your NFT collection</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '1000px',
      margin: '20px auto',
      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ margin: '0 0 20px 0', color: 'white', fontSize: '24px' }}>
        🖼️ NFT Gallery
      </h2>

      {/* Chain Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {chains.map(chain => (
          <button
            key={chain}
            onClick={() => setSelectedChain(chain)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: selectedChain === chain ? 'white' : 'rgba(255,255,255,0.2)',
              color: selectedChain === chain ? '#667eea' : 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {chain} {chain === 'all' && `(${mockNFTs.length})`}
          </button>
        ))}
      </div>

      {/* NFT Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '16px'
      }}>
        {filteredNFTs.map(nft => (
          <div
            key={nft.id}
            onClick={() => setSelectedNFT(nft)}
            style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{
              width: '100%',
              height: '200px',
              background: `url(${nft.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />
            <div style={{ padding: '12px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                {nft.name}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                {nft.collection}
              </div>
              <div style={{
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: '4px',
                background: '#f0f9ff',
                color: '#0284c7',
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'capitalize'
              }}>
                {nft.chain}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNFTs.length === 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          color: '#999'
        }}>
          No NFTs found on {selectedChain} network
        </div>
      )}

      {/* NFT Details Modal */}
      {selectedNFT && (
        <div
          onClick={() => setSelectedNFT(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              overflow: 'hidden'
            }}
          >
            <div style={{
              width: '100%',
              height: '300px',
              background: `url(${selectedNFT.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />
            <div style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>{selectedNFT.name}</h3>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                {selectedNFT.collection}
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#999', marginBottom: '8px' }}>
                  TRAITS
                </div>
                {Object.entries(selectedNFT.traits).map(([key, value]) => (
                  <div key={key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px',
                    background: '#f8f9fa',
                    borderRadius: '6px',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>{key}</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSelectedNFT(null)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    background: 'white',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => alert('Transfer feature coming soon!')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#667eea',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <p style={{
        fontSize: '12px',
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        margin: 0
      }}>
        💡 Showing {filteredNFTs.length} NFT{filteredNFTs.length !== 1 ? 's' : ''} from your collection
      </p>
    </div>
  );
}
