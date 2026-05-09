export interface MarketTick {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  timestamp: number;
}

export type OnTickCallback = (tick: MarketTick) => void;

export interface MarketProvider {
  name: string;
  id: string;
  connect(symbols: string[], onTick: OnTickCallback): void;
  disconnect(): void;
  getDefaultSymbols(): string[];
}

export type ExchangeId = 'simulated' | 'binance' | 'coinbase' | 'bybit' | 'cryptofeed';

export interface ExchangeOption {
  id: ExchangeId;
  name: string;
  description: string;
  requiresBridge: boolean;
}

export const EXCHANGES: ExchangeOption[] = [
  { id: 'simulated', name: 'Simulated', description: 'Local random walk simulation', requiresBridge: false },
  { id: 'binance', name: 'Binance', description: 'Live data via browser WebSocket', requiresBridge: false },
  { id: 'coinbase', name: 'Coinbase', description: 'Live data via browser WebSocket', requiresBridge: false },
  { id: 'bybit', name: 'Bybit', description: 'Live data via browser WebSocket', requiresBridge: false },
  { id: 'cryptofeed', name: 'Cryptofeed Bridge', description: 'Python bridge — multi-exchange', requiresBridge: true },
];
