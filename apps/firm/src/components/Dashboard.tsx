import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { connectWs, onWsMessage, disconnectWs } from '../lib/ws';
import { TradersPanel } from './TradersPanel';
import { RiskOverview } from './RiskOverview';
import { AllPositions } from './AllPositions';
import { AllOrders } from './AllOrders';
import { ExchangeControl } from './ExchangeControl';

interface Props {
  user: any;
  token: string;
  onLogout: () => void;
}

export function Dashboard({ user, token, onLogout }: Props) {
  const [traders, setTraders] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const refresh = useCallback(async () => {
    const [t, p, o, s] = await Promise.all([
      api.get('/api/traders', token),
      api.get('/api/positions', token),
      api.get('/api/orders', token),
      api.get('/api/positions/summary', token),
    ]);
    if (t.success) setTraders(t.data);
    if (p.success) setPositions(p.data);
    if (o.success) setOrders(o.data);
    if (s.success) setStats(s.data);
  }, [token]);

  useEffect(() => {
    refresh();
    connectWs(token);
    const unsub = onWsMessage(() => refresh());
    const interval = setInterval(refresh, 5000);
    return () => { unsub(); disconnectWs(); clearInterval(interval); };
  }, [token, refresh]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>BBSIM</h1>
          <span className="subtitle">Firm Dashboard — {user.name}</span>
        </div>
        <div className="header-right">
          <ExchangeControl token={token} />
          <button className="btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </header>
      <main className="firm-grid">
        <RiskOverview stats={stats} />
        <TradersPanel traders={traders} token={token} onRefresh={refresh} />
        <AllPositions positions={positions} />
        <AllOrders orders={orders} />
      </main>
    </div>
  );
}
