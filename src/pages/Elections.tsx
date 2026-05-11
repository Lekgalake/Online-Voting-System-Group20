import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import type { Election, Candidate } from '../types';
import { Vote, Plus } from 'lucide-react';

const Elections: React.FC = () => {
  const { 
    currentUser, elections, candidates, parties, anonymousVotes, 
    participations, addVote, createElection 
  } = useData();
  
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [viewingResultsId, setViewingResultsId] = useState<number | null>(null);

  // Create Election Form State
  const [newElectionName, setNewElectionName] = useState('');
  const [newElectionType, setNewElectionType] = useState('National');
  const [newElectionStart, setNewElectionStart] = useState('');
  const [newElectionEnd, setNewElectionEnd] = useState('');

  if (!currentUser) return null;

  const isElectionActive = (e: Election) => {
    const now = new Date();
    return now >= new Date(e.start_date) && now <= new Date(e.end_date) && e.status === 'Active';
  };

  const hasVoted = (electionId: number) => {
    return participations.some(p => p.voter_id === currentUser.id && p.election_id === electionId);
  };

  const handleOpenVoteModal = (election: Election) => {
    setSelectedElection(election);
    setSelectedCandidateId(null);
    setVoteSuccess(false);
    setIsVoteModalOpen(true);
  };

  const handleSubmitVote = () => {
    if (selectedElection && selectedCandidateId) {
      addVote(selectedElection.election_id, selectedCandidateId);
      setVoteSuccess(true);
      setTimeout(() => {
        setIsVoteModalOpen(false);
        setVoteSuccess(false);
      }, 2000);
    }
  };

  const handleCreateElection = (e: React.FormEvent) => {
    e.preventDefault();
    createElection({
      election_name: newElectionName,
      election_type: newElectionType,
      start_date: newElectionStart,
      end_date: newElectionEnd,
      status: 'Upcoming',
      result_locked: false
    });
    setIsCreateModalOpen(false);
    setNewElectionName('');
  };

  const getResults = (electionId: number) => {
    const electionVotes = anonymousVotes.filter(v => v.election_id === electionId);
    const electionCandidates = candidates.filter(c => c.election_id === electionId);
    
    return electionCandidates.map(c => {
      const count = electionVotes.filter(v => v.candidate_id === c.candidate_id).length;
      const party = parties.find(p => p.party_id === c.party_id);
      return {
        ...c,
        partyName: party?.party_name || 'Independent',
        voteCount: count,
        percentage: electionVotes.length > 0 ? Math.round((count / electionVotes.length) * 100) : 0
      };
    }).sort((a, b) => b.voteCount - a.voteCount);
  };

  const results = viewingResultsId ? getResults(viewingResultsId) : [];
  const resultsElection = elections.find(e => e.election_id === viewingResultsId);

  return (
    <div className="page-section active">
      <div className="section-header">
        <h1 className="page-title">🗳️ Elections</h1>
        <p className="page-subtitle">Browse active, upcoming, and closed elections.</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>All Elections</h3>
          {(currentUser.roleName === 'System Administrator' || currentUser.roleName === 'Election Administrator') && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} /> New Election
            </button>
          )}
        </div>
        <div className="card-body">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {elections.map(el => {
                  const active = isElectionActive(el);
                  const voted = hasVoted(el.election_id);
                  const statusClass = el.status === 'Active' ? 'badge-active' : el.status === 'Closed' ? 'badge-closed' : 'badge-upcoming';
                  
                  return (
                    <tr key={el.election_id}>
                      <td>#{el.election_id}</td>
                      <td><strong>{el.election_name}</strong></td>
                      <td>{el.election_type}</td>
                      <td>{new Date(el.start_date).toLocaleDateString()}</td>
                      <td>{new Date(el.end_date).toLocaleDateString()}</td>
                      <td><span className={`table-badge ${statusClass}`}>{el.status}</span></td>
                      <td>
                        {currentUser.type === 'voter' && active && !voted && (
                          <button className="btn btn-gold btn-sm" onClick={() => handleOpenVoteModal(el)}>Vote</button>
                        )}
                        {voted && <span className="table-badge badge-verified">✅ Voted</span>}
                        {el.status === 'Closed' && (
                          <button className="btn btn-outline btn-sm" onClick={() => {
                            setViewingResultsId(el.election_id);
                            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                          }}>
                            Results
                          </button>
                        )}
                        {!active && !voted && el.status !== 'Closed' && <span style={{ color: 'var(--gray-400)' }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {viewingResultsId && resultsElection && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3>📊 Election Results: {resultsElection.election_name}</h3>
            <span className="table-badge badge-closed">Closed</span>
          </div>
          <div className="card-body">
            {results.length === 0 ? (
              <p style={{ color: 'var(--gray-500)' }}>No candidates found for this election.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {results.map(res => (
                  <div key={res.candidate_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span><strong>{res.candidate_name}</strong> <small>({res.partyName})</small></span>
                      <span><strong>{res.voteCount}</strong> votes ({res.percentage}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${res.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
                <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}>
                  Total votes recorded: <strong>{anonymousVotes.filter(v => v.election_id === viewingResultsId).length}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vote Modal */}
      {isVoteModalOpen && selectedElection && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span>🗳️ Cast Your Vote</span>
              <button className="modal-close" onClick={() => setIsVoteModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {voteSuccess ? (
                <div className="alert alert-success">
                  ✅ Your vote has been recorded securely and anonymously. Thank you!
                </div>
              ) : (
                <>
                  <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Election: {selectedElection.election_name}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
                    Select one candidate. Your identity will NOT be linked to your choice.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {candidates.filter(c => c.election_id === selectedElection.election_id).map(cand => {
                      const party = parties.find(p => p.party_id === cand.party_id);
                      return (
                        <div 
                          key={cand.candidate_id}
                          className={`ballot-option ${selectedCandidateId === cand.candidate_id ? 'selected' : ''}`}
                          onClick={() => setSelectedCandidateId(cand.candidate_id)}
                        >
                          <div className="ballot-radio"></div>
                          <div className="ballot-party-logo">
                            {party?.party_name.split(' ').map(w => w[0]).join('').substring(0, 3)}
                          </div>
                          <div>
                            <strong>{cand.candidate_name}</strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{party?.party_name}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button 
                    className="btn btn-gold btn-lg" 
                    style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}
                    disabled={!selectedCandidateId}
                    onClick={handleSubmitVote}
                  >
                    🔒 Submit Anonymous Vote
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Election Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span>📅 Create New Election</span>
              <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateElection}>
                <div className="form-group">
                  <label className="form-label">Election Name</label>
                  <input 
                    className="form-input" 
                    value={newElectionName}
                    onChange={e => setNewElectionName(e.target.value)}
                    placeholder="e.g. Municipal Election 2026"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select 
                    className="form-select"
                    value={newElectionType}
                    onChange={e => setNewElectionType(e.target.value)}
                  >
                    <option>National</option>
                    <option>Provincial</option>
                    <option>Local</option>
                  </select>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input 
                      type="datetime-local" 
                      className="form-input" 
                      value={newElectionStart}
                      onChange={e => setNewElectionStart(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input 
                      type="datetime-local" 
                      className="form-input" 
                      value={newElectionEnd}
                      onChange={e => setNewElectionEnd(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                  Create Election
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Elections;
