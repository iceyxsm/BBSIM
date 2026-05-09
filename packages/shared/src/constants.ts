export const EXCHANGES: { id: string; name: string; description: string; requiresBridge: boolean }[] = [
  { id: 'simulated', name: 'Simulated', description: 'Local random walk simulation', requiresBridge: false },
  { id: 'binance', name: 'Binance', description: 'Live data via browser WebSocket', requiresBridge: false },
  { id: 'coinbase', name: 'Coinbase', description: 'Live data via browser WebSocket', requiresBridge: false },
  { id: 'bybit', name: 'Bybit', description: 'Live data via browser WebSocket', requiresBridge: false },
  { id: 'cryptofeed', name: 'Cryptofeed Bridge', description: 'Python bridge — multi-exchange', requiresBridge: true },
];

export const DEFAULT_SYMBOLS = [
  'BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD',
  'XRP-USD', 'ADA-USD', 'AVAX-USD', 'LINK-USD',
];

export const API_PORT = 3001;
export const FIRM_PORT = 5173;
export const TRADER_PORT = 5174;
export const BRIDGE_PORT = 8765;
