export interface Trade {
  id: string;
  orderId: string;
  traderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  pnl: number;
  executedAt: number;
}
