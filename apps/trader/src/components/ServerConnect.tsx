import { useState } from 'react';
import '../styles/login.css';

interface Props {
  onConnect: (serverUrl: string) => void;
}

export function ServerConnect({ onConnect }: Props) {
  const [host, setHost] = useState(localStorage.getItem('bbsim_server') || '');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTesting(true);

    const url = host.startsWith('http') ? host : `http://${host}`;
    const serverUrl = url.endsWith('/') ? url.slice(0, -1) : url;

    try {
      const res = await fetch(`${serverUrl}/api/health`);
      const data = await res.json();

      if (data.status === 'ok') {
        localStorage.setItem('bbsim_server', host);
        onConnect(serverUrl);
      } else {
        setError('Server responded but is not a BBSIM instance');
      }
    } catch {
      setError('Cannot reach server. Check the address and make sure the firm is running.');
    }

    setTesting(false);
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
              <p className="welcome-text">CONNECT TO SERVER</p>
            </div>

            <form className="auth-form" onSubmit={handleConnect}>
              <div className="form-group">
                <label className="form-label" htmlFor="server">Server Address</label>
                <input
                  type="text"
                  id="server"
                  className="form-input"
                  placeholder="192.168.1.100:3001"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  required
                />
              </div>

              <p className="server-hint">
                Enter the IP address of the machine running BBSIM Firm.
                Ask the host for their address.
              </p>

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="auth-btn" disabled={testing}>
                {testing ? 'Connecting...' : 'Connect'}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                <button className="switch-mode" onClick={() => onConnect('')}>
                  Use localhost (dev mode)
                </button>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
