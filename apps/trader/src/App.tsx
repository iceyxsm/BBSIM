import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { api } from './lib/api';

export function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('bbsim_token'));
  const [trader, setTrader] = useState<any>(null);

  useEffect(() => {
    if (token) {
      api.get('/api/auth/me', token).then((res) => {
        if (res.success) setTrader(res.data);
        else { setToken(null); localStorage.removeItem('bbsim_token'); }
      });
    }
  }, [token]);

  const handleLogin = (newToken: string, traderData: any) => {
    setToken(newToken);
    setTrader(traderData);
    localStorage.setItem('bbsim_token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    setTrader(null);
    localStorage.removeItem('bbsim_token');
  };

  if (!token || !trader) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard trader={trader} token={token} onLogout={handleLogout} />;
}
