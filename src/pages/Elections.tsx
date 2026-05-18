import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import type { Election } from '../types';
import { Plus } from 'lucide-react';

const Elections: React.FC = () => {
  const { 
    currentUser, voters, elections, candidates, parties, anonymousVotes, 
    participations, addVote, createElection, updateElectionStatus 
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!currentUser) return null;

  const isVotingWindowOpen = (e: Election) => {
    const now = Date.now();
    return e.status === 'Active' && now >= new Date(e.start_date).getTime() && now <= new Date(e.end_date).getTime();
  };

  const hasVotingWindowEnded = (e: Election) => {
    return Date.now() > new Date(e.end_date).getTime();
  };

  const isElectionActive = (e: Election) => {
    return e.status === 'Active';
  };

  const hasVoted = (electionId: number) => {
    return participations.some(p => p.voter_id === currentUser.id && p.election_id === electionId);
  };

  const formatDate = (dateValue: string) => {
    return new Date(dateValue).toLocaleDateString('en-GB');
  };

  const handleOpenVoteModal = (election: Election) => {
    setSelectedElection(election);
    setSelectedCandidateId(null);
    setError('');
    setVoteSuccess(false);
    setIsVoteModalOpen(true);
  };

  const handleSubmitVote = async () => {
    if (selectedElection && selectedCandidateId !== null) {
      setError('');
      setLoading(true);

      try {
        await addVote(selectedElection.election_id, selectedCandidateId);
        setVoteSuccess(true);
        setTimeout(() => {
          setIsVoteModalOpen(false);
          setVoteSuccess(false);
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to submit vote.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createElection({
        election_name: newElectionName,
        election_type: newElectionType,
        start_date: newElectionStart,
        end_date: newElectionEnd,
        status: 'Upcoming',
        result_locked: false
      });
      setIsCreateModalOpen(false);
      setNewElectionName('');
      setNewElectionStart('');
      setNewElectionEnd('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create election.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateElectionStatus = async (electionId: number, status: Election['status']) => {
    setError('');
    setLoading(true);

    try {
      await updateElectionStatus(electionId, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update election status.');
    } finally {
      setLoading(false);
    }
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

  const getVoterProfile = (voterId: string) => {
    const yy = Number(voterId.substring(0, 2));
    const mm = Number(voterId.substring(2, 4));
    const dd = Number(voterId.substring(4, 6));
    const sequence = Number(voterId.substring(6, 10));
    const currentYear = new Date().getFullYear();
    let birthYear = 2000 + yy;

    if (birthYear > currentYear) {
      birthYear = 1900 + yy;
    }

    const birthDate = new Date(birthYear, mm - 1, dd);
    const age = Math.floor((Date.now() - birthDate.getTime()) / 31557600000);
    const gender = sequence >= 5000 ? 'Male' : 'Female';
    const ageGroup = age < 25 ? '18-24' : age < 35 ? '25-34' : age < 45 ? '35-44' : age < 60 ? '45-59' : '60+';

    return { age, gender, ageGroup };
  };

  const getDemographics = (electionId: number) => {
    const electionParticipations = participations.filter(p => p.election_id === electionId);
    const genderCounts = electionParticipations.reduce<Record<string, number>>((acc, participation) => {
      const { gender } = getVoterProfile(participation.voter_id);
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});
    const ageCounts = electionParticipations.reduce<Record<string, number>>((acc, participation) => {
      const { ageGroup } = getVoterProfile(participation.voter_id);
      acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      return acc;
    }, {});
    const raceCounts = electionParticipations.reduce<Record<string, number>>((acc, participation) => {
      const voter = voters.find(v => v.voter_id === participation.voter_id);
      const race = voter?.race || 'Not specified';
      acc[race] = (acc[race] || 0) + 1;
      return acc;
    }, {});

    return { genderCounts, ageCounts, raceCounts, totalTurnout: electionParticipations.length };
  };

  const results = viewingResultsId ? getResults(viewingResultsId) : [];
  const resultsElection = elections.find(e => e.election_id === viewingResultsId);
  const winner = results.length > 0 ? results[0] : null;
  const demographics = viewingResultsId ? getDemographics(viewingResultsId) : null;

  return (
    <div className="page-section active">
      <div className="section-header">
        <h1 className="page-title">🗳️ Elections</h1>
        <p className="page-subtitle">Browse active, upcoming, and closed elections.</p>
      </div>
      {error && <div className="alert alert-error">{error}</div>}

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
                  const votingOpen = isVotingWindowOpen(el);
                  const votingEnded = hasVotingWindowEnded(el);
                  const voted = hasVoted(el.election_id);
                  const statusClass = el.status === 'Active' ? 'badge-active' : el.status === 'Closed' ? 'badge-closed' : 'badge-upcoming';
                  
                  return (
                    <tr key={el.election_id}>
                      <td>#{el.election_id}</td>
                      <td><strong>{el.election_name}</strong></td>
                      <td>{el.election_type}</td>
                      <td>{formatDate(el.start_date)}</td>
                      <td>{formatDate(el.end_date)}</td>
                      <td><span className={`table-badge ${statusClass}`}>{el.status}</span></td>
                      <td>
                        {currentUser.type === 'voter' && votingOpen && !voted && (
                          <button className="btn btn-gold btn-sm" onClick={() => handleOpenVoteModal(el)}>Vote</button>
                        )}
                        {currentUser.type !== 'voter' && (currentUser.roleName === 'System Administrator' || currentUser.roleName === 'Election Administrator') && el.status === 'Upcoming' && !votingEnded && (
                          <button className="btn btn-gold btn-sm" onClick={() => handleUpdateElectionStatus(el.election_id, 'Active')} disabled={loading}>Make Live</button>
                        )}
                        {currentUser.type !== 'voter' && (currentUser.roleName === 'System Administrator' || currentUser.roleName === 'Election Administrator') && el.status === 'Active' && (
                          <button className="btn btn-outline btn-sm" onClick={() => handleUpdateElectionStatus(el.election_id, 'Closed')} disabled={loading}>Close</button>
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
                        {currentUser.type === 'voter' && active && !votingOpen && !voted && (
                          <span className="table-badge badge-upcoming">Not open yet</span>
                        )}
                        {currentUser.type === 'voter' && !active && !voted && el.status !== 'Closed' && <span style={{ color: 'var(--gray-400)' }}>—</span>}
                        {currentUser.type !== 'voter' && el.status === 'Upcoming' && votingEnded && (
                          <span className="table-badge badge-closed">Window ended</span>
                        )}
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
                {winner && (
                  <div className="alert alert-success">
                    Winner: <strong>{winner.candidate_name}</strong> from <strong>{winner.partyName}</strong> with <strong>{winner.voteCount}</strong> vote{winner.voteCount === 1 ? '' : 's'}.
                  </div>
                )}
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
                {demographics && (
                  <div className="grid-2">
                    <div className="card">
                      <div className="card-header">
                        <h3>Gender Turnout</h3>
                      </div>
                      <div className="card-body">
                        <p>Male voters: <strong>{demographics.genderCounts.Male || 0}</strong></p>
                        <p>Female voters: <strong>{demographics.genderCounts.Female || 0}</strong></p>
                      </div>
                    </div>
                    <div className="card">
                      <div className="card-header">
                        <h3>Age Turnout</h3>
                      </div>
                      <div className="card-body">
                        {['18-24', '25-34', '35-44', '45-59', '60+'].map(group => (
                          <p key={group}>{group}: <strong>{demographics.ageCounts[group] || 0}</strong></p>
                        ))}
                      </div>
                    </div>
                    <div className="card">
                      <div className="card-header">
                        <h3>Race / Population Group Turnout</h3>
                      </div>
                      <div className="card-body">
                        {Object.entries(demographics.raceCounts).length === 0 ? (
                          <p>No race data recorded yet.</p>
                        ) : (
                          Object.entries(demographics.raceCounts).map(([raceGroup, count]) => (
                            <p key={raceGroup}>{raceGroup}: <strong>{count}</strong></p>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                  Your vote has been recorded securely. Thank you!
                </div>
              ) : (
                <>
                  <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Election: {selectedElection.election_name}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
                    Select one candidate. Your voter participation is recorded once for this election.
                  </p>
                  {error && <div className="alert alert-error">{error}</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {candidates.filter(c => c.election_id === selectedElection.election_id).map(cand => {
                      const party = parties.find(p => p.party_id === cand.party_id);
                      const optionId = `candidate-${cand.candidate_id}`;
                      return (
                        <label
                          key={cand.candidate_id}
                          htmlFor={optionId}
                          className={`ballot-option ${selectedCandidateId === cand.candidate_id ? 'selected' : ''}`}
                        >
                          <input
                            id={optionId}
                            className="ballot-input"
                            type="radio"
                            name="candidate"
                            value={cand.candidate_id}
                            checked={selectedCandidateId === cand.candidate_id}
                            onChange={() => setSelectedCandidateId(cand.candidate_id)}
                          />
                          <span className="ballot-radio" aria-hidden="true"></span>
                          <div className="ballot-party-logo">
                            {party?.party_name.split(' ').map(w => w[0]).join('').substring(0, 3)}
                          </div>
                          <div>
                            <strong>{cand.candidate_name}</strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{party?.party_name}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <button 
                    className="btn btn-gold btn-lg" 
                    style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}
                    disabled={selectedCandidateId === null || loading}
                    onClick={handleSubmitVote}
                  >
                    {loading ? 'Submitting...' : 'Submit Vote'}
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
              {error && <div className="alert alert-error">{error}</div>}
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
                <button type="submit" className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Election'}
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
