import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { connectWs, onWsMessage, disconnectWs } from '../lib/ws';
import { MarketWatch } from './MarketWatch';
import { OrderEntry } from './OrderEntry';
import { Positions } from './Positions';
import { OrderBook } from './OrderBook';
import { TradeHistory } from './TradeHistory';
import type { MarketTick } from '@bbsim/shared';

interface DashboardProps {
  trader: any;
  token: string;
  onLogout: () => void;
  onDisconnect: () => void;
}

export function Dashboard({ trader, token, onLogout, onDisconnect }: DashboardProps) {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<MarketTick[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);

  const refresh = useCallback(async () => {
    const [mkt, pos, ord, trd] = await Promise.all([
      api.get('/api/market', token),
      api.get('/api/positions', token),
      api.get('/api/orders', token),
      api.get('/api/trades', token),
    ]);
    if (mkt.success) setMarketData(mkt.data);
    if (pos.success) setPositions(pos.data);
    if (ord.success) setOrders(ord.data);
    if (trd.success) setTrades(trd.data);
  }, [token]);

  useEffect(() => {
    refresh();
    connectWs(token);

    const unsub = onWsMessage((msg) => {
      if (msg.type === 'market:tick') {
        setMarketData((prev) => {
          const tick = msg.payload as MarketTick;
          const idx = prev.findIndex((m) => m.symbol === tick.symbol);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = tick;
            return next;
          }
          return [...prev, tick];
        });
      } else {
        // Refresh on order/trade/position updates
        refresh();
      }
    });

    return () => { unsub(); disconnectWs(); };
  }, [token, refresh]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>BBSIM</h1>
          <span className="subtitle">Trader: {trader.name}</span>
        </div>
        <button className="btn-logout" onClick={onLogout}>Logout</button>
        <button className="btn-logout" onClick={onDisconnect} style={{ marginLeft: 8 }}>⏏ Server</button>
      </header>
      <main className="app-grid">
        <div className="col-left">
          <MarketWatch data={marketData} onSelect={setSelectedSymbol} selected={selectedSymbol} />
          <OrderEntry selectedSymbol={selectedSymbol} token={token} onOrderPlaced={refresh} />
        </div>
        <div className="col-right">
          <Positions data={positions} />
          <OrderBook data={orders} token={token} onCancel={refresh} />
          <TradeHistory data={trades} />
        </div>
      </main>
    </div>
  );
}
