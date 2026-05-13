import React, { useState } from 'react';
import { ArrowRight, BadgeCheck, Fingerprint, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { AppUser } from '../types';
import evcLogo from '../../Untitled design.png';

const Login: React.FC = () => {
  const { setCurrentUser, voters, systemUsers, roles } = useData();
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Try voter login
    const voter = voters.find(v => v.voter_id === idNumber && v.password_hash === password);
    if (voter) {
      const user: AppUser = {
        id: voter.voter_id,
        displayName: `${voter.full_name} ${voter.surname}`,
        roleName: 'Voter',
        type: 'voter',
        data: voter
      };
      setCurrentUser(user);
      return;
    }

    // Try system user login (using idNumber as username for system users)
    const sysUser = systemUsers.find(u => u.username === idNumber && u.password_hash === password);
    if (sysUser) {
      const role = roles.find(r => r.role_id === sysUser.role_id);
      const user: AppUser = {
        id: sysUser.user_id.toString(),
        displayName: sysUser.username,
        roleName: role?.role_name || 'Voter',
        type: 'system_user',
        data: sysUser
      };
      setCurrentUser(user);
      return;
    }

    setError('Invalid ID number or password.');
  };

  const demoLogin = (type: 'voter' | 'admin' | 'auditor') => {
    if (type === 'voter') {
      setIdNumber('9001015009087');
      setPassword('pass123');
    } else if (type === 'admin') {
      setIdNumber('admin');
      setPassword('admin123');
    } else if (type === 'auditor') {
      setIdNumber('auditor1');
      setPassword('audit123');
    }
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
          <div className="trust-item">
            <BadgeCheck size={24} />
            <span>Verified voters</span>
          </div>
          <div className="trust-item">
            <Fingerprint size={24} />
            <span>Identity protected</span>
          </div>
          <div className="trust-item">
            <LockKeyhole size={24} />
            <span>Secure access</span>
          </div>
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
          {error && (
            <div className="alert alert-error login-error">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">South African ID Number</label>
              <div className="input-with-icon">
                <UserRound size={18} />
                <input 
                  type="text" 
                  className="form-input" 
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. 9001015009087" 
                  maxLength={13} 
                  required 
                />
              </div>
              <div className="form-hint">Enter your 13-digit SA ID number or Username</div>
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
            <button type="submit" className="btn btn-gold btn-lg btn-full">
              Sign In <ArrowRight size={18} />
            </button>
          </form>
          <div className="login-divider"><span>Quick demo access</span></div>
          <button className="btn btn-outline btn-full" onClick={() => demoLogin('voter')}>
            Demo: Voter Login
          </button>
          <button className="btn btn-outline-gold btn-full demo-button-spaced" onClick={() => demoLogin('admin')}>
            Demo: Admin Login
          </button>
          <button className="btn btn-outline btn-full demo-button-spaced" onClick={() => demoLogin('auditor')}>
            Demo: Auditor Login
          </button>
        </div>
        <div className="login-footer">
          Official Electoral System — Secured & Verified
        </div>
      </section>
    </div>
  );
};

export default Login;
