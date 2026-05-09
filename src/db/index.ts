import Dexie, { type EntityTable } from 'dexie';

export interface Order {
  id?: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  type: 'MARKET' | 'LIMIT' | 'STOP';
  status: 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED';
  filledQuantity: number;
  filledPrice: number;
  createdAt: number;
  updatedAt: number;
}

export interface Position {
  id?: number;
  symbol: string;
  quantity: number;
  avgEntryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  updatedAt: number;
}

export interface Trade {
  id?: number;
  orderId: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  pnl: number;
  executedAt: number;
}

export interface MarketData {
  id?: number;
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  updatedAt: number;
}

const db = new Dexie('BBSIM') as Dexie & {
  orders: EntityTable<Order, 'id'>;
  positions: EntityTable<Position, 'id'>;
  trades: EntityTable<Trade, 'id'>;
  marketData: EntityTable<MarketData, 'id'>;
};

db.version(1).stores({
  orders: '++id, symbol, side, status, createdAt',
  positions: '++id, &symbol',
  trades: '++id, orderId, symbol, executedAt',
  marketData: '++id, &symbol, updatedAt',
});

export { db };
