import React, { useState } from 'react';
import { ArrowRight, BadgeCheck, Fingerprint, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';
import type { AppUser } from '../types';
import evcLogo from '../../Untitled design.png';

// Validate SA ID: 13 digits + age >= 18
const validateSAID = (id: string): { valid: boolean; error?: string } => {
  if (!/^\d{13}$/.test(id)) return { valid: false, error: 'ID must be exactly 13 digits.' };
  const yy = parseInt(id.substring(0, 2));
  const mm = parseInt(id.substring(2, 4));
  const dd = parseInt(id.substring(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return { valid: false, error: 'ID contains an invalid date.' };
  const currentYear = new Date().getFullYear();
  const birthYear = yy + (yy + 2000 <= currentYear ? 2000 : 1900);
  const birthDate = new Date(birthYear, mm - 1, dd);
  const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 18) return { valid: false, error: 'Voter must be at least 18 years old.' };
  return { valid: true };
};

const Login: React.FC = () => {
  const { setCurrentUser } = useData();
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // If input looks like an SA ID (all digits, 13 chars), validate format & age
      const looksLikeId = /^\d+$/.test(idNumber);
      if (looksLikeId) {
        const validation = validateSAID(idNumber);
        if (!validation.valid) {
          setError(validation.error!);
          setIsLoading(false);
          return;
        }
      }

      // Try voter login
      const { data: voterData } = await supabase
        .from('voter')
        .select('*')
        .eq('voter_id', idNumber)
        .eq('password_hash', password)
        .single();

      if (voterData) {
        // Enforce voter_status must be 'active'
        if (voterData.voter_status !== 'active') {
          setError(`Your account is ${voterData.voter_status}. Please contact the Electoral Commission.`);
          setIsLoading(false);
          return;
        }
        const user: AppUser = {
          id: voterData.voter_id,
          displayName: `${voterData.full_name} ${voterData.surname}`,
          roleName: 'Voter',
          type: 'voter',
          data: voterData,
        };
        setCurrentUser(user);
        return;
      }

      // Try system user login
      const { data: sysUserData } = await supabase
        .from('admin_user')
        .select('*, role(*)')
        .eq('username', idNumber)
        .eq('password_hash', password)
        .single();

      if (sysUserData) {
        const roleName = sysUserData.role?.role_name || 'Auditor';
        const user: AppUser = {
          id: sysUserData.user_id.toString(),
          displayName: sysUserData.username,
          roleName,
          type: 'system_user',
          data: sysUserData,
        };
        setCurrentUser(user);
        return;
      }

      setError('Invalid credentials. Please check your ID number and password.');
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = (type: 'voter' | 'admin' | 'auditor' | 'election_admin') => {
    if (type === 'voter') { setIdNumber('9001015009087'); setPassword('pass123'); }
    else if (type === 'admin') { setIdNumber('admin'); setPassword('admin123'); }
    else if (type === 'auditor') { setIdNumber('auditor1'); setPassword('audit123'); }
    else if (type === 'election_admin') { setIdNumber('election_admin'); setPassword('admin123'); }
  };

  return (
    <div className="login-page">
      <section className="login-hero-panel">
        <div className="login-brand-lockup">
          <img src={evcLogo} alt="E-Vote Commission logo" className="login-logo-img" />
          <div>
            <span>Official South African Electoral Platform</span>
            <h1>E-Vote Commission</h1>
          </div>
        </div>
        <div className="login-hero-content">
          <span className="security-pill"><ShieldCheck size={18} /> Secured and verified voting</span>
          <h2>Trusted digital elections for every citizen.</h2>
          <p>Access national, provincial, and local elections through a professional voting portal designed for clarity, confidence, and integrity.</p>
        </div>
        <div className="trust-grid">
          <div className="trust-item"><BadgeCheck size={24} /><span>Verified voters</span></div>
          <div className="trust-item"><Fingerprint size={24} /><span>Identity protected</span></div>
          <div className="trust-item"><LockKeyhole size={24} /><span>Secure access</span></div>
        </div>
      </section>

      <section className="login-card">
        <div className="login-header">
          <img src={evcLogo} alt="E-Vote Commission logo" className="login-card-logo" />
          <span className="eyebrow">Welcome back</span>
          <h2>Sign in to your account</h2>
          <p>Use your South African ID number or authorised staff username.</p>
        </div>
        <div className="login-body">
          {error && <div className="alert alert-error login-error">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">South African ID Number / Username</label>
              <div className="input-with-icon">
                <UserRound size={18} />
                <input
                  type="text"
                  className="form-input"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. 9001015009087"
                  maxLength={50}
                  required
                />
              </div>
              <div className="form-hint">Enter your 13-digit SA ID number or staff username</div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <LockKeyhole size={18} />
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-gold btn-lg btn-full" disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign In'} <ArrowRight size={18} />
            </button>
          </form>
          <div className="login-divider"><span>Quick demo access</span></div>
          <button className="btn btn-outline btn-full" onClick={() => demoLogin('voter')}>Demo: Voter</button>
          <button className="btn btn-outline-gold btn-full demo-button-spaced" onClick={() => demoLogin('admin')}>Demo: System Administrator</button>
          <button className="btn btn-outline btn-full demo-button-spaced" onClick={() => demoLogin('election_admin')}>Demo: Election Administrator</button>
          <button className="btn btn-outline btn-full demo-button-spaced" onClick={() => demoLogin('auditor')}>Demo: Auditor</button>
        </div>
        <div className="login-footer">Official Electoral System — Secured &amp; Verified</div>
      </section>
    </div>
  );
};

export default Login;
