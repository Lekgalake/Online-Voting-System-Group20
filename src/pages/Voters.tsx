import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';
import { UserPlus, X } from 'lucide-react';

// Luhn check digit calculation (mirrors the DB function)
const luhnCheckDigit = (id12: string): number => {
  let total = 0;
  for (let i = 1; i <= 12; i++) {
    let d = parseInt(id12[12 - i]);
    if (i % 2 === 0) { d *= 2; if (d > 9) d = Math.floor(d / 10) + (d % 10); }
    total += d;
  }
  return (10 - (total % 10)) % 10;
};

const validateSAID = (id: string): string | null => {
  if (!/^\d{13}$/.test(id)) return 'ID must be exactly 13 digits.';
  const mm = parseInt(id.substring(2, 4));
  const dd = parseInt(id.substring(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return 'ID contains an invalid date.';
  const yy = parseInt(id.substring(0, 2));
  const currentYear = new Date().getFullYear();
  const birthYear = yy + (yy + 2000 <= currentYear ? 2000 : 1900);
  const birthDate = new Date(birthYear, mm - 1, dd);
  const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 18) return 'Voter must be at least 18 years old.';
  const check = luhnCheckDigit(id.substring(0, 12));
  if (check !== parseInt(id[12])) return `Invalid ID check digit (expected ${check}).`;
  return null;
};

const Voters: React.FC = () => {
  const { voters, toggleVoterStatus, currentUser, refreshData } = useData();
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [voterId, setVoterId] = useState('');
  const [fullName, setFullName] = useState('');
  const [surname, setSurname] = useState('');
  const [password, setPassword] = useState('');

  if (!currentUser || currentUser.type === 'voter') return null;
  // Only System Administrator can manage voters
  if (currentUser.roleName !== 'System Administrator') return (
    <div className="page-section active">
      <div className="section-header">
        <h1 className="page-title">👥 Voter Management</h1>
      </div>
      <div className="alert alert-error">Access denied. Only System Administrators can manage voters.</div>
    </div>
  );

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const idError = validateSAID(voterId);
    if (idError) { setFormError(idError); return; }

    // Check uniqueness
    const existing = voters.find(v => v.voter_id === voterId);
    if (existing) { setFormError('A voter with this ID number is already registered.'); return; }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('voter').insert({
        voter_id: voterId,
        full_name: fullName,
        surname,
        password_hash: password,
        voter_status: 'active',
        qualification_status: false, // Requires manual verification
      });
      if (error) throw error;
      await refreshData();
      setFormSuccess(`Voter ${fullName} ${surname} registered successfully. Qualification pending verification.`);
      setVoterId(''); setFullName(''); setSurname(''); setPassword('');
    } catch (err: any) {
      setFormError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-section active">
      <div className="section-header">
        <h1 className="page-title">👥 Voter Management</h1>
        <p className="page-subtitle">Verify qualifications and manage voter access.</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Registered Voters ({voters.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={() => { setShowModal(true); setFormError(''); setFormSuccess(''); }}>
            <UserPlus size={16} /> Register New Voter
          </button>
        </div>
        <div className="card-body">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID Number</th>
                  <th>Full Name</th>
                  <th>Surname</th>
                  <th>Status</th>
                  <th>Qualification</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {voters.map(v => (
                  <tr key={v.voter_id}>
                    <td><code>{v.voter_id}</code></td>
                    <td>{v.full_name}</td>
                    <td>{v.surname}</td>
                    <td>
                      <span className={`table-badge ${v.voter_status === 'active' ? 'badge-active' : 'badge-suspended'}`}>
                        {v.voter_status}
                      </span>
                    </td>
                    <td>
                      <span className={`table-badge ${v.qualification_status ? 'badge-verified' : 'badge-pending'}`}>
                        {v.qualification_status ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => toggleVoterStatus(v.voter_id)}
                      >
                        {v.voter_status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span>👤 Register New Voter</span>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{formError}</div>}
              {formSuccess && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{formSuccess}</div>}
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label">SA ID Number (13 digits)</label>
                  <input
                    className="form-input"
                    value={voterId}
                    onChange={e => setVoterId(e.target.value)}
                    placeholder="e.g. 9001015009087"
                    maxLength={13}
                    required
                  />
                  <div className="form-hint">Must be a valid 13-digit South African ID. Voter must be ≥18 years old.</div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Surname</label>
                    <input className="form-input" value={surname} onChange={e => setSurname(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Password</label>
                  <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                  <div className="form-hint">Voter will use this to log in. Qualification status requires manual verification after registration.</div>
                </div>
                <button type="submit" className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Registering…' : 'Register Voter'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Voters;
