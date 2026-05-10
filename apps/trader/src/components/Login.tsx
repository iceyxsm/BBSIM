import { useState } from 'react';
import { api } from '../lib/api';
import '../styles/login.css';

interface LoginProps {
  onLogin: (token: string, trader: any) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.post('/api/auth/login', { email: username, password });
        if (res.success) {
          onLogin(res.data.token, res.data.trader);
        } else {
          setError(res.error || 'Invalid credentials');
        }
      } else {
        const res = await api.post('/api/auth/register-self', { name: username, email, password });
        if (res.success) {
          onLogin(res.data.token, res.data.trader);
        } else {
          setError(res.error || 'Signup failed');
        }
      }
    } catch {
      setError('Server unavailable');
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="background">
        <div className="trending-lines">
          <div className="trend-line"></div>
          <div className="trend-line"></div>
          <div className="trend-line"></div>
          <div className="trend-line"></div>
          <div className="trend-line"></div>
        </div>
        <div className="particle" style={{ left: '20%', top: '30%' }}></div>
        <div className="particle" style={{ left: '60%', top: '20%' }}></div>
        <div className="particle" style={{ left: '80%', top: '60%' }}></div>
        <div className="particle" style={{ left: '40%', top: '80%' }}></div>
        <div className="particle" style={{ left: '10%', top: '70%' }}></div>
        <div className="particle" style={{ left: '50%', top: '50%' }}></div>
        <div className="particle" style={{ left: '90%', top: '40%' }}></div>
        <div className="particle" style={{ left: '15%', top: '15%' }}></div>
      </div>

      <div className="main-layout">
        <main className="main-content">
          <div className="glass-card">
            <div className="auth-header">
              <h1 className="logo-text">BBSIM</h1>
              <p className="welcome-text">BROKERS BOOK SIMULATOR</p>
            </div>

            <div className="auth-tabs">
              <button className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(true); setError(''); }}>
                Login
              </button>
              <button className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(false); setError(''); }}>
                Sign Up
              </button>
              <div className={`tab-indicator ${isLogin ? 'left' : 'right'}`}></div>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="username">
                  {isLogin ? 'Email' : 'Username'}
                </label>
                <input
                  type={isLogin ? 'email' : 'text'}
                  id="username"
                  className="form-input"
                  placeholder={isLogin ? 'Enter email' : 'Enter username'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="form-input"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button className="switch-mode" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
                  {isLogin ? 'Sign Up' : 'Login'}
                </button>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
