import { useState } from 'react';
import { useAccount } from 'wagmi';

export default function LimitOrders() {
  const { address } = useAccount();
  const [newOrder, setNewOrder] = useState({
    type: 'buy',
    fromToken: 'cUSD',
    toToken: 'CELO',
    amount: '',
    targetPrice: ''
  });

  const [openOrders, setOpenOrders] = useState([
    {
      id: 1,
      type: 'buy',
      fromToken: 'cUSD',
      toToken: 'CELO',
      amount: 1000,
      targetPrice: 0.68,
      currentPrice: 0.75,
      status: 'pending',
      created: '2024-11-28 10:30'
    },
    {
      id: 2,
      type: 'sell',
      fromToken: 'CELO',
      toToken: 'cUSD',
      amount: 500,
      targetPrice: 0.80,
      currentPrice: 0.75,
      status: 'pending',
      created: '2024-11-29 14:15'
    }
  ]);

  const tokens = ['CELO', 'cUSD', 'cEUR', 'ETH', 'MATIC'];

  const handleCreateOrder = () => {
    if (!newOrder.amount || !newOrder.targetPrice) {
      alert('Please fill all fields');
      return;
    }
    alert(`Creating ${newOrder.type} order: ${newOrder.amount} ${newOrder.fromToken} for ${newOrder.toToken} at $${newOrder.targetPrice}`);
  };

  const handleCancelOrder = (orderId) => {
    setOpenOrders(openOrders.filter(o => o.id !== orderId));
    alert(`Order #${orderId} cancelled`);
  };

  const getPriceDistance = (targetPrice, currentPrice) => {
    const distance = ((currentPrice - targetPrice) / targetPrice * 100).toFixed(1);
    return distance;
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
        <h2 style={{ margin: '0 0 12px 0' }}>📈 Limit Orders</h2>
        <p style={{ margin: 0 }}>Connect wallet to create limit orders</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '900px',
      margin: '20px auto',
      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '24px' }}>
        📈 Limit Orders
      </h2>
      <p style={{ margin: '0 0 20px 0', color: 'rgba(255,255,255,0.95)', fontSize: '14px' }}>
        Set your target price and execute automatically
      </p>

      {/* Create Order Form */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>
          Create New Limit Order
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
              Order Type
            </label>
            <select
              value={newOrder.type}
              onChange={(e) => setNewOrder({ ...newOrder, type: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
              Amount
            </label>
            <input
              type="number"
              value={newOrder.amount}
              onChange={(e) => setNewOrder({ ...newOrder, amount: e.target.value })}
              placeholder="0.0"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
              From
            </label>
            <select
              value={newOrder.fromToken}
              onChange={(e) => setNewOrder({ ...newOrder, fromToken: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            >
              {tokens.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
              To
            </label>
            <select
              value={newOrder.toToken}
              onChange={(e) => setNewOrder({ ...newOrder, toToken: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            >
              {tokens.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
              Target Price
            </label>
            <input
              type="number"
              step="0.01"
              value={newOrder.targetPrice}
              onChange={(e) => setNewOrder({ ...newOrder, targetPrice: e.target.value })}
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <button
          onClick={handleCreateOrder}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Create Limit Order
        </button>
      </div>

      {/* Open Orders */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>
          Open Orders ({openOrders.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {openOrders.map(order => {
            const priceDistance = getPriceDistance(order.targetPrice, order.currentPrice);
            const isClose = Math.abs(parseFloat(priceDistance)) < 5;

            return (
              <div
                key={order.id}
                style={{
                  background: '#f8f9fa',
                  borderRadius: '10px',
                  padding: '16px',
                  border: isClose ? '2px solid #fbbf24' : 'none'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <span style={{
                        background: order.type === 'buy' ? '#10b981' : '#f5576c',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {order.type}
                      </span>
                      {isClose && (
                        <span style={{
                          background: '#fbbf24',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          NEAR TARGET
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {order.amount} {order.fromToken} → {order.toToken}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Created {order.created}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                      Target: ${order.targetPrice}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      Current: ${order.currentPrice}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: parseFloat(priceDistance) >= 0 ? '#10b981' : '#ef4444',
                      fontWeight: 'bold'
                    }}>
                      {priceDistance >= 0 ? '+' : ''}{priceDistance}%
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCancelOrder(order.id)}
                  style={{
                    width: '100%',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancel Order
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
