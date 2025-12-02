import { useState, useEffect } from 'react';

export default function PriceCharts() {
  const [selectedToken, setSelectedToken] = useState('CELO');
  const [timeframe, setTimeframe] = useState('24h');
  const [priceData, setPriceData] = useState({
    current: 0.65,
    change24h: 5.2,
    high24h: 0.68,
    low24h: 0.62,
    volume24h: 45000000
  });

  const tokens = ['CELO', 'ETH', 'cUSD', 'cEUR', 'MATIC'];
  const timeframes = ['24h', '7d', '30d', '1y'];

  // Mock price data - in production, fetch from CoinGecko API
  useEffect(() => {
    const mockPrices = {
      CELO: { current: 0.65, change24h: 5.2, high24h: 0.68, low24h: 0.62, volume24h: 45000000 },
      ETH: { current: 2000, change24h: -2.1, high24h: 2050, low24h: 1980, volume24h: 15000000000 },
      cUSD: { current: 1.0, change24h: 0.01, high24h: 1.001, low24h: 0.999, volume24h: 5000000 },
      cEUR: { current: 1.08, change24h: 0.05, high24h: 1.082, low24h: 1.078, volume24h: 2000000 },
      MATIC: { current: 0.85, change24h: 3.5, high24h: 0.88, low24h: 0.82, volume24h: 500000000 }
    };
    setPriceData(mockPrices[selectedToken]);
  }, [selectedToken]);

  // Mock chart data points
  const generateChartData = () => {
    const points = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 12;
    return Array.from({ length: points }, (_, i) => ({
      x: i,
      y: priceData.current * (0.95 + Math.random() * 0.1)
    }));
  };

  const chartData = generateChartData();

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '800px',
      margin: '20px auto',
      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ margin: '0 0 20px 0', color: 'white', fontSize: '24px' }}>
        📈 Price Charts
      </h2>

      {/* Token Selector */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        {tokens.map(token => (
          <button
            key={token}
            onClick={() => setSelectedToken(token)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: selectedToken === token ? 'white' : 'rgba(255,255,255,0.2)',
              color: selectedToken === token ? '#667eea' : 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {token}
          </button>
        ))}
      </div>

      {/* Price Info Card */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
              {selectedToken} Price
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
              ${priceData.current.toLocaleString()}
            </div>
            <div style={{
              fontSize: '14px',
              color: priceData.change24h >= 0 ? '#22c55e' : '#ef4444',
              fontWeight: 'bold'
            }}>
              {priceData.change24h >= 0 ? '↑' : '↓'} {Math.abs(priceData.change24h)}% (24h)
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>24h High</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>${priceData.high24h}</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', marginBottom: '4px' }}>24h Low</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>${priceData.low24h}</div>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                background: timeframe === tf ? '#667eea' : 'white',
                color: timeframe === tf ? 'white' : '#333',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Simple Chart Visualization */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '16px',
          height: '200px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <svg width="100%" height="100%" viewBox="0 0 600 180">
            <polyline
              points={chartData.map((point, i) => 
                `${(i / (chartData.length - 1)) * 600},${180 - ((point.y - priceData.low24h) / (priceData.high24h - priceData.low24h)) * 160}`
              ).join(' ')}
              fill="none"
              stroke={priceData.change24h >= 0 ? '#22c55e' : '#ef4444'}
              strokeWidth="3"
            />
          </svg>
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '11px',
            color: '#999'
          }}>
            {timeframe === '24h' ? 'Hourly' : timeframe === '7d' ? 'Daily' : 'Weekly'} data
          </div>
        </div>

        {/* Volume */}
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            24h Volume
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
            ${(priceData.volume24h / 1000000).toFixed(2)}M
          </div>
        </div>
      </div>

      <p style={{
        fontSize: '12px',
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        margin: 0
      }}>
        💡 Prices update in real-time from CoinGecko
      </p>
    </div>
  );
}
