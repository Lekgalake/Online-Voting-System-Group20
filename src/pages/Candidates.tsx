import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import type { Party } from '../types';
import { Edit, Plus, Trash2 } from 'lucide-react';

const Candidates: React.FC = () => {
  const { candidates, parties, elections, currentUser, createParty, updateParty, deleteParty, createCandidate } = useData();
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [candidateName, setCandidateName] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!currentUser || currentUser.type === 'voter') return null;

  const canManage = currentUser.roleName === 'System Administrator' || currentUser.roleName === 'Election Administrator';

  const resetPartyForm = () => {
    setPartyName('');
    setEditingParty(null);
    setIsPartyModalOpen(false);
  };

  const handleOpenEditParty = (party: Party) => {
    setError('');
    setEditingParty(party);
    setPartyName(party.party_name);
    setIsPartyModalOpen(true);
  };

  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createParty(partyName);
      resetPartyForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add political party.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParty) return;

    setError('');
    setLoading(true);

    try {
      await updateParty(editingParty.party_id, partyName.trim());
      resetPartyForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update political party.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParty = async (party: Party) => {
    const partyCandidates = candidates.filter(candidate => candidate.party_id === party.party_id);
    const warning = partyCandidates.length > 0
      ? `Delete ${party.party_name}? This will also delete ${partyCandidates.length} candidate record${partyCandidates.length === 1 ? '' : 's'} linked to this party.`
      : `Delete ${party.party_name}?`;

    if (!window.confirm(warning)) return;

    setError('');
    setLoading(true);

    try {
      await deleteParty(party.party_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete political party.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createCandidate(candidateName, Number(selectedPartyId), Number(selectedElectionId));
      setCandidateName('');
      setSelectedPartyId('');
      setSelectedElectionId('');
      setIsCandidateModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add candidate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-section active">
      <div className="section-header">
        <h1 className="page-title">🏛️ Candidates & Parties</h1>
        <p className="page-subtitle">Manage political parties and their candidates.</p>
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Registered Candidates</h3>
            {canManage && (
              <button className="btn btn-primary btn-sm" onClick={() => setIsCandidateModalOpen(true)}>
                <Plus size={16} /> Add
              </button>
            )}
          </div>
          <div className="card-body">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Party</th>
                    <th>Election</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(c => {
                    const party = parties.find(p => p.party_id === c.party_id);
                    const election = elections.find(e => e.election_id === c.election_id);
                    return (
                      <tr key={c.candidate_id}>
                        <td><strong>{c.candidate_name}</strong></td>
                        <td>{party?.party_name}</td>
                        <td>{election?.election_name}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Political Parties</h3>
            {canManage && (
              <button className="btn btn-primary btn-sm" onClick={() => {
                setEditingParty(null);
                setPartyName('');
                setIsPartyModalOpen(true);
              }}>
                <Plus size={16} /> Add
              </button>
            )}
          </div>
          <div className="card-body">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Party Name</th>
                    {canManage && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {parties.map(p => (
                    <tr key={p.party_id}>
                      <td>#{p.party_id}</td>
                      <td><strong>{p.party_name}</strong></td>
                      {canManage && (
                        <td>
                          <div className="table-actions">
                            <button className="btn btn-outline btn-sm" onClick={() => handleOpenEditParty(p)}>
                              <Edit size={14} /> Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteParty(p)} disabled={loading}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isPartyModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span>{editingParty ? 'Edit Political Party' : 'Add Political Party'}</span>
              <button className="modal-close" onClick={() => {
                resetPartyForm();
              }}>&times;</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={editingParty ? handleSaveParty : handleCreateParty}>
                <div className="form-group">
                  <label className="form-label">Party Name</label>
                  <input
                    className="form-input"
                    value={partyName}
                    onChange={e => setPartyName(e.target.value)}
                    placeholder="e.g. People's Democratic Party"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                  {loading ? 'Saving...' : editingParty ? 'Update Party' : 'Save Party'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {isCandidateModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span>Add Candidate</span>
              <button className="modal-close" onClick={() => setIsCandidateModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleCreateCandidate}>
                <div className="form-group">
                  <label className="form-label">Candidate Name</label>
                  <input
                    className="form-input"
                    value={candidateName}
                    onChange={e => setCandidateName(e.target.value)}
                    placeholder="e.g. Candidate Full Name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="candidate-party">Political Party</label>
                  <select id="candidate-party" className="form-select" value={selectedPartyId} onChange={e => setSelectedPartyId(e.target.value)} required>
                    <option value="">Select party</option>
                    {parties.map(p => (
                      <option key={p.party_id} value={p.party_id}>{p.party_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="candidate-election">Election</label>
                  <select id="candidate-election" className="form-select" value={selectedElectionId} onChange={e => setSelectedElectionId(e.target.value)} required>
                    <option value="">Select election</option>
                    {elections.map(el => (
                      <option key={el.election_id} value={el.election_id}>{el.election_name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Candidate'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Candidates;
