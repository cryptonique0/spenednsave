import { useState } from 'react';
import { useAccount } from 'wagmi';

export default function DAOVoting() {
  const { address } = useAccount();
  const [selectedProposal, setSelectedProposal] = useState(null);

  const proposals = [
    {
      id: 1,
      title: 'Increase Staking Rewards by 5%',
      description: 'Proposal to increase the annual staking rewards from 15% to 20% to attract more liquidity providers.',
      status: 'active',
      votesFor: 12450,
      votesAgainst: 3200,
      totalVotes: 15650,
      quorum: 10000,
      endTime: '2024-12-15',
      category: 'Treasury',
      proposer: '0x742d...4f2e'
    },
    {
      id: 2,
      title: 'Deploy on Arbitrum Network',
      description: 'Expand the protocol to Arbitrum to reduce gas costs and reach more users.',
      status: 'active',
      votesFor: 8900,
      votesAgainst: 1200,
      totalVotes: 10100,
      quorum: 10000,
      endTime: '2024-12-20',
      category: 'Development',
      proposer: '0x8a3c...7d92'
    },
    {
      id: 3,
      title: 'Partner with Celo Foundation',
      description: 'Strategic partnership to integrate with Celo mobile-first ecosystem.',
      status: 'passed',
      votesFor: 18500,
      votesAgainst: 2100,
      totalVotes: 20600,
      quorum: 10000,
      endTime: '2024-11-28',
      category: 'Partnership',
      proposer: '0x4e9a...3bc1'
    },
    {
      id: 4,
      title: 'Reduce Transaction Fees',
      description: 'Lower protocol fees from 0.3% to 0.2% to remain competitive.',
      status: 'rejected',
      votesFor: 4200,
      votesAgainst: 11800,
      totalVotes: 16000,
      quorum: 10000,
      endTime: '2024-11-25',
      category: 'Economics',
      proposer: '0x1d7f...8e4a'
    }
  ];

  const [userVotes, setUserVotes] = useState({});
  const votingPower = 250;

  const handleVote = (proposalId, support) => {
    if (userVotes[proposalId]) {
      alert('You have already voted on this proposal');
      return;
    }
    setUserVotes({ ...userVotes, [proposalId]: support });
    alert(`Voted ${support ? 'FOR' : 'AGAINST'} proposal #${proposalId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#3b82f6';
      case 'passed': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6c757d';
    }
  };

  const calculateProgress = (votesFor, totalVotes) => {
    return (votesFor / totalVotes * 100).toFixed(1);
  };

  if (!address) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
        color: 'white',
        maxWidth: '900px',
        margin: '20px auto'
      }}>
        <h2 style={{ margin: '0 0 12px 0' }}>🗳️ DAO Governance</h2>
        <p style={{ margin: 0 }}>Connect wallet to participate in governance</p>
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
      <h2 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '24px' }}>
        🗳️ DAO Governance
      </h2>
      <p style={{ margin: '0 0 20px 0', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
        Vote on protocol proposals and shape the future
      </p>

      {/* Voting Power Card */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
            Your Voting Power
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#667eea' }}>
            {votingPower.toLocaleString()}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
            Active Proposals
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
            {proposals.filter(p => p.status === 'active').length}
          </div>
        </div>
      </div>

      {/* Proposals List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {proposals.map(proposal => {
          const progress = calculateProgress(proposal.votesFor, proposal.totalVotes);
          const hasVoted = userVotes[proposal.id] !== undefined;
          const quorumReached = proposal.totalVotes >= proposal.quorum;

          return (
            <div
              key={proposal.id}
              style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '12px',
                padding: '24px',
                border: selectedProposal?.id === proposal.id ? '2px solid #667eea' : 'none'
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
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      background: getStatusColor(proposal.status),
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {proposal.status}
                    </span>
                    <span style={{
                      background: '#f3f4f6',
                      color: '#666',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {proposal.category}
                    </span>
                  </div>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '18px',
                    color: '#333'
                  }}>
                    {proposal.title}
                  </h3>
                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    color: '#666',
                    lineHeight: '1.5'
                  }}>
                    {proposal.description}
                  </p>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    Proposed by {proposal.proposer} • Ends {proposal.endTime}
                  </div>
                </div>
              </div>

              {/* Voting Stats */}
              <div style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  fontSize: '14px'
                }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                    FOR: {proposal.votesFor.toLocaleString()} ({progress}%)
                  </span>
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                    AGAINST: {proposal.votesAgainst.toLocaleString()} ({(100 - parseFloat(progress)).toFixed(1)}%)
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#ef4444',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: '#10b981',
                    transition: 'width 0.3s'
                  }} />
                </div>

                {/* Quorum */}
                <div style={{
                  marginTop: '12px',
                  fontSize: '13px',
                  color: '#666'
                }}>
                  Total Votes: {proposal.totalVotes.toLocaleString()} / {proposal.quorum.toLocaleString()} (Quorum {quorumReached ? '✓' : '✗'})
                </div>
              </div>

              {/* Voting Buttons */}
              {proposal.status === 'active' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleVote(proposal.id, true)}
                    disabled={hasVoted}
                    style={{
                      flex: 1,
                      background: hasVoted ? '#d1d5db' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: hasVoted ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {hasVoted && userVotes[proposal.id] ? '✓ Voted FOR' : 'Vote FOR'}
                  </button>
                  <button
                    onClick={() => handleVote(proposal.id, false)}
                    disabled={hasVoted}
                    style={{
                      flex: 1,
                      background: hasVoted ? '#d1d5db' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: hasVoted ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {hasVoted && !userVotes[proposal.id] ? '✓ Voted AGAINST' : 'Vote AGAINST'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
