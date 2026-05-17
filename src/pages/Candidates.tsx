import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';
import { Plus, X } from 'lucide-react';

const Candidates: React.FC = () => {
  const { candidates, parties, elections, currentUser, refreshData } = useData();

  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [candName, setCandName] = useState('');
  const [candParty, setCandParty] = useState('');
  const [candElection, setCandElection] = useState('');
  const [partyName, setPartyName] = useState('');
  const [candError, setCandError] = useState('');
  const [partyError, setPartyError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser || currentUser.type === 'voter') return null;
  // Auditors cannot access this page
  if (currentUser.roleName === 'Auditor') return (
    <div className="page-section active">
      <div className="section-header"><h1 className="page-title">🏛️ Candidates & Parties</h1></div>
      <div className="alert alert-error">Access denied. Auditors may only view audit logs and reports.</div>
    </div>
  );

  const canEdit = currentUser.roleName === 'System Administrator' || currentUser.roleName === 'Election Administrator';

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCandError('');
    if (!candParty || !candElection) { setCandError('Please select a party and election.'); return; }
    // Business rule: election must not be Active or Closed
    const election = elections.find(el => el.election_id === parseInt(candElection));
    if (election && election.status === 'Active') {
      setCandError('Cannot add candidates to an Active election (voting in progress).');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('candidate').insert({
        candidate_name: candName,
        party_id: parseInt(candParty),
        election_id: parseInt(candElection),
      });
      if (error) throw error;
      await refreshData();
      setShowCandidateModal(false);
      setCandName(''); setCandParty(''); setCandElection('');
    } catch (err: any) {
      setCandError(err.message || 'Failed to add candidate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddParty = async (e: React.FormEvent) => {
    e.preventDefault();
    setPartyError('');
    if (parties.find(p => p.party_name.toLowerCase() === partyName.toLowerCase())) {
      setPartyError('A party with this name already exists.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('party').insert({ party_name: partyName });
      if (error) throw error;
      await refreshData();
      setShowPartyModal(false);
      setPartyName('');
    } catch (err: any) {
      setPartyError(err.message || 'Failed to add party.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-section active">
      <div className="section-header">
        <h1 className="page-title">🏛️ Candidates & Parties</h1>
        <p className="page-subtitle">Manage political parties and their candidates per election.</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Registered Candidates ({candidates.length})</h3>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={() => { setShowCandidateModal(true); setCandError(''); }}>
                <Plus size={16} /> Add Candidate
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
            <h3>Political Parties ({parties.length})</h3>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={() => { setShowPartyModal(true); setPartyError(''); }}>
                <Plus size={16} /> Add Party
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
                    <th>Candidates</th>
                  </tr>
                </thead>
                <tbody>
                  {parties.map(p => (
                    <tr key={p.party_id}>
                      <td>#{p.party_id}</td>
                      <td><strong>{p.party_name}</strong></td>
                      <td>{candidates.filter(c => c.party_id === p.party_id).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Candidate Modal */}
      {showCandidateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span>➕ Add Candidate</span>
              <button className="modal-close" onClick={() => setShowCandidateModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {candError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{candError}</div>}
              <form onSubmit={handleAddCandidate}>
                <div className="form-group">
                  <label className="form-label">Candidate Name</label>
                  <input className="form-input" value={candName} onChange={e => setCandName(e.target.value)} required placeholder="Full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Political Party</label>
                  <select className="form-select" value={candParty} onChange={e => setCandParty(e.target.value)} required>
                    <option value="">— Select party —</option>
                    {parties.map(p => <option key={p.party_id} value={p.party_id}>{p.party_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Election</label>
                  <select className="form-select" value={candElection} onChange={e => setCandElection(e.target.value)} required>
                    <option value="">— Select election —</option>
                    {elections.filter(e => e.status !== 'Closed').map(e => (
                      <option key={e.election_id} value={e.election_id}>{e.election_name} ({e.status})</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Adding…' : 'Add Candidate'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Party Modal */}
      {showPartyModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span>🏛️ Add Political Party</span>
              <button className="modal-close" onClick={() => setShowPartyModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {partyError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{partyError}</div>}
              <form onSubmit={handleAddParty}>
                <div className="form-group">
                  <label className="form-label">Party Name</label>
                  <input className="form-input" value={partyName} onChange={e => setPartyName(e.target.value)} required placeholder="e.g. Democratic Alliance" />
                </div>
                <button type="submit" className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Adding…' : 'Add Party'}
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
