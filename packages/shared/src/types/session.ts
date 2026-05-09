export type SessionStatus = 'recording' | 'stopped' | 'replaying';

export interface Session {
  id: string;
  name: string;
  exchange: string;
  status: SessionStatus;
  tickCount: number;
  startedAt: number;
  stoppedAt: number | null;
  durationMs: number;
}

export interface SessionTick {
  id?: number;
  sessionId: string;
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  timestamp: number;
  offsetMs: number; // ms from session start (for replay timing)
}

export interface ReplayConfig {
  sessionId: string;
  speed: number; // 1 = real-time, 2 = 2x, 0.5 = half speed
  startOffsetMs?: number; // resume from a specific point
}
