import { nanoid } from 'nanoid';
import { getDb } from '../db/init.js';
import type { MarketTick } from '@bbsim/shared';

let activeSessionId: string | null = null;
let sessionStartTime: number = 0;

export function isRecording(): boolean {
  return activeSessionId !== null;
}

export function getActiveSessionId(): string | null {
  return activeSessionId;
}

export function startRecording(name: string, exchange: string): string {
  if (activeSessionId) {
    stopRecording();
  }

  const db = getDb();
  const id = nanoid();
  const now = Date.now();

  db.prepare(`
    INSERT INTO sessions (id, name, exchange, status, started_at)
    VALUES (?, ?, ?, 'recording', ?)
  `).run(id, name, exchange, now);

  activeSessionId = id;
  sessionStartTime = now;

  console.log(`[Recorder] Started recording session: ${name} (${id})`);
  return id;
}

export function stopRecording(): string | null {
  if (!activeSessionId) return null;

  const db = getDb();
  const now = Date.now();
  const durationMs = now - sessionStartTime;

  const tickCount = (db.prepare('SELECT COUNT(*) as count FROM session_ticks WHERE session_id = ?').get(activeSessionId) as any).count;

  db.prepare(`
    UPDATE sessions SET status = 'stopped', stopped_at = ?, duration_ms = ?, tick_count = ?
    WHERE id = ?
  `).run(now, durationMs, tickCount, activeSessionId);

  console.log(`[Recorder] Stopped session ${activeSessionId} — ${tickCount} ticks, ${(durationMs / 1000).toFixed(1)}s`);

  const id = activeSessionId;
  activeSessionId = null;
  sessionStartTime = 0;
  return id;
}

export function recordTick(tick: MarketTick): void {
  if (!activeSessionId) return;

  const db = getDb();
  const offsetMs = tick.timestamp - sessionStartTime;

  db.prepare(`
    INSERT INTO session_ticks (session_id, symbol, bid, ask, last, volume, timestamp, offset_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(activeSessionId, tick.symbol, tick.bid, tick.ask, tick.last, tick.volume, tick.timestamp, offsetMs);
}
