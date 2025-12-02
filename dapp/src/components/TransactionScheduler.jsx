import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export default function TransactionScheduler() {
  const { address, isConnected } = useAccount();
  const [scheduledTxs, setScheduledTxs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newTx, setNewTx] = useState({
    to: '',
    amount: '',
    token: 'CELO',
    scheduledTime: '',
    note: ''
  });

  useEffect(() => {
    if (address) {
      const stored = localStorage.getItem(`scheduledTxs_${address}`);
      if (stored) {
        setScheduledTxs(JSON.parse(stored));
      }
    }
  }, [address]);

  const saveTxs = (txs) => {
    setScheduledTxs(txs);
    localStorage.setItem(`scheduledTxs_${address}`, JSON.stringify(txs));
  };

  const scheduleTx = () => {
    if (!newTx.to || !newTx.amount || !newTx.scheduledTime) return;

    const tx = {
      id: Date.now(),
      ...newTx,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    saveTxs([tx, ...scheduledTxs]);
    setNewTx({ to: '', amount: '', token: 'CELO', scheduledTime: '', note: '' });
    setShowForm(false);
  };

  const cancelTx = (id) => {
    if (confirm('Cancel this scheduled transaction?')) {
      saveTxs(scheduledTxs.filter(tx => tx.id !== id));
    }
  };

  const getStatus = (tx) => {
    const now = new Date();
    const scheduled = new Date(tx.scheduledTime);
    
    if (tx.status === 'executed') return { text: 'Executed', color: '#22c55e' };
    if (tx.status === 'cancelled') return { text: 'Cancelled', color: '#999' };
    if (now >= scheduled) return { text: 'Ready', color: '#f59e0b' };
    return { text: 'Scheduled', color: '#3b82f6' };
  };

  const tokens = ['CELO', 'cUSD', 'cEUR', 'ETH', 'MATIC'];

  if (!isConnected) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '700px',
        margin: '20px auto',
        color: 'white',
        textAlign: 'center'
      }}>
        <h2>⏰ Transaction Scheduler</h2>
        <p>Connect your wallet to schedule transactions</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '700px',
      margin: '20px auto',
      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: 'white', fontSize: '24px' }}>
          ⏰ Transaction Scheduler
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: 'white',
            color: '#667eea',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {showForm ? '✕ Cancel' : '+ Schedule'}
        </button>
      </div>

      {/* Schedule Form */}
      {showForm && (
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Schedule New Transaction</h3>
          
          <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px' }}>
            Recipient Address *
          </label>
          <input
            type="text"
            value={newTx.to}
            onChange={(e) => setNewTx({ ...newTx, to: e.target.value })}
            placeholder="0x..."
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
              fontFamily: 'monospace',
              boxSizing: 'border-box'
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px' }}>
                Amount *
              </label>
              <input
                type="number"
                value={newTx.amount}
                onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
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
            <div>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px' }}>
                Token *
              </label>
              <select
                value={newTx.token}
                onChange={(e) => setNewTx({ ...newTx, token: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                {tokens.map(token => (
                  <option key={token} value={token}>{token}</option>
                ))}
              </select>
            </div>
          </div>

          <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px' }}>
            Execute At *
          </label>
          <input
            type="datetime-local"
            value={newTx.scheduledTime}
            onChange={(e) => setNewTx({ ...newTx, scheduledTime: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />

          <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px' }}>
            Note (optional)
          </label>
          <input
            type="text"
            value={newTx.note}
            onChange={(e) => setNewTx({ ...newTx, note: e.target.value })}
            placeholder="e.g., Monthly payment"
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '16px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />

          <button
            onClick={scheduleTx}
            disabled={!newTx.to || !newTx.amount || !newTx.scheduledTime}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: (!newTx.to || !newTx.amount || !newTx.scheduledTime) ? '#ccc' : '#667eea',
              color: 'white',
              fontWeight: 'bold',
              cursor: (!newTx.to || !newTx.amount || !newTx.scheduledTime) ? 'not-allowed' : 'pointer'
            }}
          >
            Schedule Transaction
          </button>
        </div>
      )}

      {/* Scheduled Transactions List */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {scheduledTxs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            No scheduled transactions yet
          </div>
        ) : (
          scheduledTxs.map((tx, index) => {
            const status = getStatus(tx);
            return (
              <div
                key={tx.id}
                style={{
                  padding: '16px',
                  borderBottom: index < scheduledTxs.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        {tx.amount} {tx.token}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: status.color + '20',
                        color: status.color,
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {status.text}
                      </span>
                    </div>
                    {tx.note && (
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                        {tx.note}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace', marginBottom: '4px' }}>
                      To: {tx.to}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      ⏰ {new Date(tx.scheduledTime).toLocaleString()}
                    </div>
                  </div>
                  {tx.status === 'scheduled' && (
                    <button
                      onClick={() => cancelTx(tx.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #fee',
                        background: '#fef2f2',
                        color: '#ef4444',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginLeft: '12px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <p style={{
        marginTop: '16px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        margin: '16px 0 0 0'
      }}>
        💡 {scheduledTxs.length} scheduled transaction{scheduledTxs.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
