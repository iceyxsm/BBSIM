import { useState } from 'react';
import { api } from '../lib/api';

interface LoginProps {
  onLogin: (token: string, trader: any) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await api.post('/api/auth/login', { email, password });
    setLoading(false);

    if (res.success) {
      onLogin(res.data.token, res.data.trader);
    } else {
      setError(res.error || 'Login failed');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>BBSIM</h1>
        <p className="subtitle">Trader Login</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
      </div>
    </div>
  );
}
