import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export default function AddressBook() {
  const { address: userAddress } = useAccount();
  const [contacts, setContacts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', address: '', notes: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (userAddress) {
      const stored = localStorage.getItem(`addressBook_${userAddress}`);
      if (stored) {
        setContacts(JSON.parse(stored));
      }
    }
  }, [userAddress]);

  const saveContacts = (updatedContacts) => {
    setContacts(updatedContacts);
    localStorage.setItem(`addressBook_${userAddress}`, JSON.stringify(updatedContacts));
  };

  const addContact = () => {
    if (!newContact.name || !newContact.address) return;
    
    const contact = {
      id: Date.now(),
      ...newContact,
      createdAt: new Date().toISOString()
    };
    
    saveContacts([contact, ...contacts]);
    setNewContact({ name: '', address: '', notes: '' });
    setShowAdd(false);
  };

  const deleteContact = (id) => {
    if (confirm('Delete this contact?')) {
      saveContacts(contacts.filter(c => c.id !== id));
    }
  };

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    alert('Address copied!');
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  );

  if (!userAddress) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '600px',
        margin: '20px auto',
        color: 'white',
        textAlign: 'center'
      }}>
        <h2>📇 Address Book</h2>
        <p>Connect your wallet to manage contacts</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '600px',
      margin: '20px auto',
      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: 'white', fontSize: '24px' }}>
          📇 Address Book
        </h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
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
          {showAdd ? '✕ Cancel' : '+ Add Contact'}
        </button>
      </div>

      {/* Add Contact Form */}
      {showAdd && (
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>New Contact</h3>
          <input
            type="text"
            placeholder="Name *"
            value={newContact.name}
            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '8px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          <input
            type="text"
            placeholder="Address (0x...) *"
            value={newContact.address}
            onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '8px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
              fontFamily: 'monospace',
              boxSizing: 'border-box'
            }}
          />
          <input
            type="text"
            placeholder="Notes (optional)"
            value={newContact.notes}
            onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
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
          <button
            onClick={addContact}
            disabled={!newContact.name || !newContact.address}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: newContact.name && newContact.address ? '#667eea' : '#ccc',
              color: 'white',
              fontWeight: 'bold',
              cursor: newContact.name && newContact.address ? 'pointer' : 'not-allowed'
            }}
          >
            Save Contact
          </button>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="🔍 Search contacts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '16px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '14px',
          boxSizing: 'border-box'
        }}
      />

      {/* Contacts List */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {filteredContacts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            {contacts.length === 0 ? 'No contacts yet. Add your first contact!' : 'No contacts match your search.'}
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              style={{
                padding: '16px',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
                  {contact.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#666',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {contact.address}
                </div>
                {contact.notes && (
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    {contact.notes}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                <button
                  onClick={() => copyAddress(contact.address)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  title="Copy address"
                >
                  📋
                </button>
                <button
                  onClick={() => deleteContact(contact.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #fee',
                    background: '#fef2f2',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  title="Delete contact"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p style={{
        marginTop: '16px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        margin: '16px 0 0 0'
      }}>
        💡 {contacts.length} contact{contacts.length !== 1 ? 's' : ''} saved locally
      </p>
    </div>
  );
}
