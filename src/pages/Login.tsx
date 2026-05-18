import React, { useState } from 'react';
import { ArrowRight, BadgeCheck, Fingerprint, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { AppUser } from '../types';
import { supabase } from '../lib/supabaseClient';
import evcLogo from '../../Untitled design.png';

const getErrorMessage = (err: unknown, fallback: string) => {
  if (!err || typeof err !== 'object') return fallback;

  const details = err as { message?: string; details?: string; hint?: string; code?: string };
  return [details.message, details.details, details.hint, details.code ? `Code: ${details.code}` : '']
    .filter(Boolean)
    .join(' ') || fallback;
};

const Login: React.FC = () => {
  const { setCurrentUser, refreshData } = useData();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginType, setLoginType] = useState<'voter' | 'admin'>('voter');
  const [idNumber, setIdNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [surname, setSurname] = useState('');
  const [race, setRace] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (loginType === 'voter') {
        const { data: voter, error: voterError } = await supabase
          .from('voter')
          .select('*')
          .eq('voter_id', idNumber)
          .eq('password_hash', password)
          .maybeSingle();

        if (voterError) throw voterError;

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

        setError('Invalid ID number or password.');
        return;
      }

      const { data: sysUser, error: sysUserError } = await supabase
        .from('admin_user')
        .select('*')
        .eq('username', idNumber)
        .eq('password_hash', password)
        .maybeSingle();

      if (sysUserError) throw sysUserError;

      if (sysUser) {
        const { data: role, error: roleError } = await supabase
          .from('role')
          .select('role_name')
          .eq('role_id', sysUser.role_id)
          .maybeSingle();

        if (roleError) throw roleError;

        const user: AppUser = {
          id: sysUser.user_id.toString(),
          displayName: sysUser.username,
          roleName: role?.role_name || 'Voter',
          type: 'system_user',
          data: { ...sysUser, role }
        };
        setCurrentUser(user);
        return;
      }

      setError('Invalid admin username or password.');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to sign in. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!/^[0-9]{13}$/.test(idNumber)) {
      setError('Please enter a valid 13-digit South African ID number.');
      setLoading(false);
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('voter')
        .insert({
          voter_id: idNumber,
          full_name: fullName,
          surname,
          race,
          password_hash: password,
          voter_status: 'active',
          qualification_status: true
        });

      if (insertError) throw insertError;

      await refreshData();
      setSuccess('Account created successfully. You can now sign in.');
      setMode('login');
      setFullName('');
      setSurname('');
      setRace('');
      setPassword('');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to create account. Please try again.'));
    } finally {
      setLoading(false);
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
          <span className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Create account'}</span>
          <h2>{mode === 'login' ? loginType === 'voter' ? 'Voter Login' : 'Admin Login' : 'Register as a voter'}</h2>
          <p>{mode === 'login' ? loginType === 'voter' ? 'Use your South African ID number to access voter services.' : 'Use your authorised staff username to manage elections and results.' : 'Create a voter account stored securely in Supabase.'}</p>
        </div>
        <div className="login-body">
          {error && (
            <div className="alert alert-error login-error">
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success login-error">
              {success}
            </div>
          )}
          {mode === 'login' && (
            <div className="login-type-switch">
              <button
                type="button"
                className={loginType === 'voter' ? 'active' : ''}
                onClick={() => {
                  setLoginType('voter');
                  setError('');
                  setSuccess('');
                  setIdNumber('');
                  setPassword('');
                }}
              >
                Voter Login
              </button>
              <button
                type="button"
                className={loginType === 'admin' ? 'active' : ''}
                onClick={() => {
                  setLoginType('admin');
                  setError('');
                  setSuccess('');
                  setIdNumber('');
                  setPassword('');
                }}
              >
                Admin Login
              </button>
            </div>
          )}
          <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Surname</label>
                  <input
                    type="text"
                    className="form-input"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder="Enter your surname"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="race">Race / Population Group</label>
                  <select
                    id="race"
                    className="form-select"
                    value={race}
                    onChange={(e) => setRace(e.target.value)}
                    required
                  >
                    <option value="">Select population group</option>
                    <option value="Black African">Black African</option>
                    <option value="Coloured">Coloured</option>
                    <option value="Indian or Asian">Indian or Asian</option>
                    <option value="White">White</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </>
            )}
            <div className="form-group">
              <label className="form-label">{mode === 'login' && loginType === 'admin' ? 'Admin Username' : 'South African ID Number'}</label>
              <div className="input-with-icon">
                <UserRound size={18} />
                <input 
                  type="text" 
                  className="form-input" 
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder={mode === 'login' && loginType === 'admin' ? 'e.g. admin' : 'e.g. 9001015009087'} 
                  maxLength={mode === 'login' && loginType === 'admin' ? undefined : 13} 
                  required 
                />
              </div>
              <div className="form-hint">{mode === 'login' && loginType === 'admin' ? 'Enter your authorised admin username' : 'Enter your 13-digit SA ID number'}</div>
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
            <button type="submit" className="btn btn-gold btn-lg btn-full" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
            </button>
          </form>
          <div className="login-divider"><span>{mode === 'login' ? 'New voter?' : 'Already registered?'}</span></div>
          <button
            className="btn btn-outline btn-full"
            onClick={() => {
              setError('');
              setSuccess('');
              setMode(mode === 'login' ? 'register' : 'login');
              setLoginType('voter');
            }}
          >
            {mode === 'login' ? 'Create voter account' : 'Back to sign in'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default Login;
