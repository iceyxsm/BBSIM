export interface MarketTick {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  timestamp: number;
}

export type ExchangeId = 'simulated' | 'binance' | 'coinbase' | 'bybit' | 'cryptofeed';

export interface ExchangeOption {
  id: ExchangeId;
  name: string;
  description: string;
  requiresBridge: boolean;
}
