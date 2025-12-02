import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

const NFTMarketplace = () => {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('explore');
  const [nfts, setNfts] = useState([]);
  const [userNFTs, setUserNFTs] = useState([]);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [listingPrice, setListingPrice] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Mock NFT marketplace data
    setNfts([
      {
        id: 1,
        name: 'Celo Punk #1234',
        collection: 'Celo Punks',
        image: '🎨',
        price: 125,
        currency: 'CELO',
        seller: '0x742d...0a2e',
        listed: true,
        category: 'pfp'
      },
      {
        id: 2,
        name: 'Abstract Art #89',
        collection: 'Digital Dreams',
        image: '🖼️',
        price: 45,
        currency: 'cUSD',
        seller: '0x851f...9b3c',
        listed: true,
        category: 'art'
      },
      {
        id: 3,
        name: 'Celo Land Parcel #456',
        collection: 'Celo Lands',
        image: '🏝️',
        price: 380,
        currency: 'CELO',
        seller: '0x9a2c...4d7e',
        listed: true,
        category: 'metaverse'
      },
      {
        id: 4,
        name: 'Rare Collectible #23',
        collection: 'Treasure Box',
        image: '💎',
        price: 210,
        currency: 'CELO',
        seller: '0x3c1b...8f2a',
        listed: true,
        category: 'collectible'
      },
      {
        id: 5,
        name: 'Gaming Avatar #789',
        collection: 'Meta Warriors',
        image: '⚔️',
        price: 95,
        currency: 'cUSD',
        seller: '0x6f4d...1e9b',
        listed: true,
        category: 'gaming'
      },
      {
        id: 6,
        name: 'Music NFT #102',
        collection: 'Sound Waves',
        image: '🎵',
        price: 55,
        currency: 'cUSD',
        seller: '0x8e2a...7c4f',
        listed: true,
        category: 'music'
      }
    ]);

    // Mock user's NFTs
    if (address) {
      setUserNFTs([
        {
          id: 101,
          name: 'My Celo Punk #5678',
          collection: 'Celo Punks',
          image: '🎨',
          listed: false,
          category: 'pfp'
        },
        {
          id: 102,
          name: 'My Art Piece #42',
          collection: 'Digital Dreams',
          image: '🖼️',
          price: 75,
          currency: 'CELO',
          listed: true,
          category: 'art'
        }
      ]);
    }
  }, [address]);

  const handleBuyNFT = async (nft) => {
    if (!address) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Successfully purchased ${nft.name} for ${nft.price} ${nft.currency}`);
    } catch (error) {
      alert('Purchase failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleListNFT = async (nft) => {
    if (!address || !listingPrice || parseFloat(listingPrice) <= 0) {
      alert('Please enter a valid listing price');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Successfully listed ${nft.name} for ${listingPrice} CELO`);
      setListingPrice('');
      setSelectedNFT(null);
    } catch (error) {
      alert('Listing failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlistNFT = async (nft) => {
    if (!address) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert(`Successfully unlisted ${nft.name}`);
    } catch (error) {
      alert('Unlisting failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeOffer = async (nft) => {
    if (!address || !offerAmount || parseFloat(offerAmount) <= 0) {
      alert('Please enter a valid offer amount');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Offer of ${offerAmount} ${nft.currency} submitted for ${nft.name}`);
      setOfferAmount('');
      setSelectedNFT(null);
    } catch (error) {
      alert('Offer failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredNFTs = () => {
    if (filter === 'all') return nfts;
    return nfts.filter(nft => nft.category === filter);
  };

  const categories = [
    { value: 'all', label: 'All', icon: '🌐' },
    { value: 'pfp', label: 'PFPs', icon: '🎨' },
    { value: 'art', label: 'Art', icon: '🖼️' },
    { value: 'metaverse', label: 'Metaverse', icon: '🏝️' },
    { value: 'collectible', label: 'Collectibles', icon: '💎' },
    { value: 'gaming', label: 'Gaming', icon: '⚔️' },
    { value: 'music', label: 'Music', icon: '🎵' }
  ];

  if (!address) {
    return (
      <div style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        borderRadius: '12px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>NFT Marketplace 🖼️</h2>
        <p>Please connect your wallet to explore NFTs</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      borderRadius: '12px'
    }}>
      <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>
        NFT Marketplace 🖼️
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '2rem' }}>
        Discover, buy, and sell unique digital assets
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('explore')}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: activeTab === 'explore' ? 'white' : 'rgba(255,255,255,0.2)',
            color: activeTab === 'explore' ? '#f5576c' : 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Explore
        </button>
        <button
          onClick={() => setActiveTab('myNFTs')}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: activeTab === 'myNFTs' ? 'white' : 'rgba(255,255,255,0.2)',
            color: activeTab === 'myNFTs' ? '#f5576c' : 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          My NFTs ({userNFTs.length})
        </button>
      </div>

      {activeTab === 'explore' && (
        <>
          {/* Category Filter */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setFilter(cat.value)}
                style={{
                  padding: '0.5rem 1rem',
                  background: filter === cat.value ? 'white' : 'rgba(255,255,255,0.2)',
                  color: filter === cat.value ? '#f5576c' : 'white',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* NFT Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {getFilteredNFTs().map(nft => (
              <div
                key={nft.id}
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  height: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '5rem'
                }}>
                  {nft.image}
                </div>
                <div style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                    {nft.collection}
                  </div>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{nft.name}</h4>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>Price</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>
                        {nft.price} {nft.currency}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>Seller</div>
                      <div style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                        {nft.seller}
                      </div>
                    </div>
                  </div>
                  
                  {selectedNFT?.id === nft.id ? (
                    <div>
                      <input
                        type="number"
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(e.target.value)}
                        placeholder={`Offer amount (${nft.currency})`}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '6px',
                          marginBottom: '0.5rem'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleBuyNFT(nft)}
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
                          Buy Now
                        </button>
                        <button
                          onClick={() => handleMakeOffer(nft)}
                          disabled={loading}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            opacity: loading ? 0.5 : 1
                          }}
                        >
                          Make Offer
                        </button>
                        <button
                          onClick={() => {
                            setSelectedNFT(null);
                            setOfferAmount('');
                          }}
                          style={{
                            padding: '0.75rem',
                            background: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedNFT(nft)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#f5576c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      View Options
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'myNFTs' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          {userNFTs.map(nft => (
            <div
              key={nft.id}
              style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            >
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '5rem'
              }}>
                {nft.image}
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                  {nft.collection}
                </div>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>{nft.name}</h4>
                
                {nft.listed && (
                  <div style={{
                    background: '#10b981',
                    color: 'white',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    marginBottom: '0.75rem',
                    textAlign: 'center'
                  }}>
                    Listed for {nft.price} {nft.currency}
                  </div>
                )}

                {selectedNFT?.id === nft.id && !nft.listed ? (
                  <div>
                    <input
                      type="number"
                      value={listingPrice}
                      onChange={(e) => setListingPrice(e.target.value)}
                      placeholder="Listing price (CELO)"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '6px',
                        marginBottom: '0.5rem'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleListNFT(nft)}
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
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setSelectedNFT(null);
                          setListingPrice('');
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          background: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : nft.listed ? (
                  <button
                    onClick={() => handleUnlistNFT(nft)}
                    disabled={loading}
                    style={{
                      width: '100%',
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
                    {loading ? 'Unlisting...' : 'Unlist NFT'}
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedNFT(nft)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#f5576c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    List for Sale
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NFTMarketplace;
