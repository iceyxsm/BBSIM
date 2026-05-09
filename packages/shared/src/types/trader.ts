export type TraderRole = 'trader' | 'firm';

export interface Trader {
  id: string;
  name: string;
  email: string;
  role: TraderRole;
  maxPositionSize: number;
  maxDailyLoss: number;
  isActive: boolean;
  createdAt: number;
}

export interface TraderStats {
  traderId: string;
  totalTrades: number;
  totalPnl: number;
  openPositions: number;
  dailyPnl: number;
  winRate: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  trader: Trader;
}
