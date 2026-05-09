import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { api } from './lib/api';

export function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('bbsim_firm_token'));
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (token) {
      api.get('/api/auth/me', token).then((res) => {
        if (res.success && res.data.role === 'firm') setUser(res.data);
        else { setToken(null); localStorage.removeItem('bbsim_firm_token'); }
      });
    }
  }, [token]);

  const handleLogin = (newToken: string, userData: any) => {
    if (userData.role !== 'firm') return;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('bbsim_firm_token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bbsim_firm_token');
  };

  if (!token || !user) return <Login onLogin={handleLogin} />;
  return <Dashboard user={user} token={token} onLogout={handleLogout} />;
}
