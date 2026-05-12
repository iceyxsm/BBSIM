import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { api } from './lib/api';

const TOKEN_KEY = 'qalgo_token';

function readToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

function writeToken(token: string, remember: boolean) {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function App() {
  const [token, setToken] = useState<string | null>(readToken());
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (token) {
      api.get('/api/auth/me', token).then((res) => {
        if (res.success && res.data.role === 'firm') setUser(res.data);
        else { setToken(null); clearToken(); }
      });
    }
  }, [token]);

  const handleLogin = (newToken: string, userData: any, remember: boolean) => {
    if (userData.role !== 'firm') return;
    setToken(newToken);
    setUser(userData);
    writeToken(newToken, remember);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    clearToken();
  };

  if (!token || !user) return <Login onLogin={handleLogin} />;
  return <Dashboard user={user} token={token} onLogout={handleLogout} />;
}
