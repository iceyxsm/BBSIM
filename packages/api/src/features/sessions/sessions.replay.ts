import { getDb } from '../../shared/db/index.js';
import { processTick } from '../market/market.feed-filter.js';
import type { ReplayConfig } from '@qalgo/shared';

let replayTimer: ReturnType<typeof setTimeout> | null = null;
let isReplaying = false;
let currentSessionId: string | null = null;
let replaySpeed = 1;
let replayStartOffset = 0;

export function getReplayState() {
  return {
    isReplaying,
    sessionId: currentSessionId,
    speed: replaySpeed,
  };
}

export function startReplay(config: ReplayConfig): boolean {
  const db = getDb();

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(config.sessionId) as any;
  if (!session || session.status === 'recording') {
    return false;
  }

  // Stop any existing replay
  stopReplay();

  currentSessionId = config.sessionId;
  replaySpeed = config.speed || 1;
  replayStartOffset = config.startOffsetMs || 0;
  isReplaying = true;

  // Update session status
  db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run('replaying', config.sessionId);

  console.log(`[Replay] Starting session ${session.name} at ${replaySpeed}x speed`);

  // Load all ticks for this session
  const ticks = db.prepare(
    'SELECT * FROM session_ticks WHERE session_id = ? AND offset_ms >= ? ORDER BY offset_ms ASC'
  ).all(config.sessionId, replayStartOffset) as any[];

  if (ticks.length === 0) {
    console.log('[Replay] No ticks to replay');
    stopReplay();
    return false;
  }

  // Schedule tick playback
  let tickIndex = 0;

  const scheduleNext = () => {
    if (!isReplaying || tickIndex >= ticks.length) {
      stopReplay();
      return;
    }

    const tick = ticks[tickIndex];
    const nextTick = ticks[tickIndex + 1];

    // Send tick through feed filter (applies firm controls)
    processTick({ symbol: tick.symbol, bid: tick.bid, ask: tick.ask, last: tick.last, volume: tick.volume, timestamp: Date.now() });

    tickIndex++;

    // Schedule next tick
    if (nextTick && isReplaying) {
      const delayMs = (nextTick.offset_ms - tick.offset_ms) / replaySpeed;
      replayTimer = setTimeout(scheduleNext, Math.max(1, delayMs));
    } else {
      stopReplay();
    }
  };

  scheduleNext();
  return true;
}

export function stopReplay(): void {
  if (replayTimer) {
    clearTimeout(replayTimer);
    replayTimer = null;
  }

  if (currentSessionId) {
    const db = getDb();
    db.prepare('UPDATE sessions SET status = ? WHERE id = ? AND status = ?').run('stopped', currentSessionId, 'replaying');
  }

  if (isReplaying) {
    console.log('[Replay] Stopped');
  }

  isReplaying = false;
  currentSessionId = null;
}

export function setReplaySpeed(speed: number): void {
  replaySpeed = Math.max(0.1, Math.min(100, speed));
  console.log(`[Replay] Speed set to ${replaySpeed}x`);
}
