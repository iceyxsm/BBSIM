import { useState, useEffect } from 'react';
import { ServerConnect } from './components/ServerConnect';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { api, setBaseUrl } from './lib/api';

export function App() {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [trader, setTrader] = useState<any>(null);

  // Check if we have a saved server + token
  useEffect(() => {
    const savedServer = localStorage.getItem('bbsim_server');
    const savedToken = localStorage.getItem('bbsim_token');

    if (savedServer) {
      const url = savedServer.startsWith('http') ? savedServer : `http://${savedServer}`;
      setBaseUrl(url.endsWith('/') ? url.slice(0, -1) : url);
      setServerUrl(url);
    }

    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Validate saved token
  useEffect(() => {
    if (token && serverUrl !== null) {
      api.get('/api/auth/me', token).then((res) => {
        if (res.success) setTrader(res.data);
        else { setToken(null); localStorage.removeItem('bbsim_token'); }
      }).catch(() => {
        setToken(null);
        localStorage.removeItem('bbsim_token');
      });
    }
  }, [token, serverUrl]);

  const handleConnect = (url: string) => {
    setBaseUrl(url);
    setServerUrl(url);
  };

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

  const handleDisconnect = () => {
    setServerUrl(null);
    setToken(null);
    setTrader(null);
    localStorage.removeItem('bbsim_server');
    localStorage.removeItem('bbsim_token');
    setBaseUrl('');
  };

  // Step 1: Connect to server
  if (serverUrl === null) {
    return <ServerConnect onConnect={handleConnect} />;
  }

  // Step 2: Login
  if (!token || !trader) {
    return <Login onLogin={handleLogin} />;
  }

  // Step 3: Dashboard
  return <Dashboard trader={trader} token={token} onLogout={handleLogout} onDisconnect={handleDisconnect} />;
}
