import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import type { AppUser } from '../types';

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
      <div className="login-card">
        <div className="login-header">
          <div className="logo-circle">EVC</div>
          <h1>E-Vote Commission</h1>
          <p>Secure Online Voting System</p>
        </div>
        <div className="login-body">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
              ❌ {error}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">South African ID Number</label>
              <input 
                type="text" 
                className="form-input" 
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="e.g. 9001015009087" 
                maxLength={13} 
                required 
              />
              <div className="form-hint">Enter your 13-digit SA ID number or Username</div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password" 
                required 
              />
            </div>
            <button type="submit" className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
              🔐 Sign In
            </button>
          </form>
          <div className="login-divider">or</div>
          <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => demoLogin('voter')}>
            👤 Demo: Voter Login
          </button>
          <button className="btn btn-outline-gold" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} onClick={() => demoLogin('admin')}>
            ⚙️ Demo: Admin Login
          </button>
          <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} onClick={() => demoLogin('auditor')}>
            📋 Demo: Auditor Login
          </button>
        </div>
        <div className="login-footer">
          🇿🇦 Official Electoral System — Secured & Verified
        </div>
      </div>
    </div>
  );
};

export default Login;
