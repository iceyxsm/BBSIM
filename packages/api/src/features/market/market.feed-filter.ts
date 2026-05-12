import { DEFAULT_FEED_CONTROLS } from '@qalgo/shared';
import type { FeedControls, SymbolOverride, MarketTick } from '@qalgo/shared';
import { broadcast } from '../../shared/ws/index.js';
import { getDb } from '../../shared/db/index.js';

let controls: FeedControls = { ...DEFAULT_FEED_CONTROLS };
let symbolOverrides: Map<string, SymbolOverride> = new Map();
let lastTickTime: Map<string, number> = new Map();

// Delayed tick queue
const delayQueue: { tick: MarketTick; deliverAt: number }[] = [];
let drainInterval: ReturnType<typeof setInterval> | null = null;

export function getControls(): FeedControls {
  return { ...controls };
}

export function setControls(update: Partial<FeedControls>): FeedControls {
  controls = { ...controls, ...update };
  // Restart drain loop if delay changed
  setupDrainLoop();
  return controls;
}

export function getSymbolOverrides(): SymbolOverride[] {
  return Array.from(symbolOverrides.values());
}

export function setSymbolOverride(override: SymbolOverride): void {
  symbolOverrides.set(override.symbol, override);
}

export function removeSymbolOverride(symbol: string): void {
  symbolOverrides.delete(symbol);
}

function getEffectiveControls(symbol: string) {
  const override = symbolOverrides.get(symbol);
  return {
    delayMs: override?.delayMs ?? controls.delayMs,
    noisePercent: override?.noisePercent ?? controls.noisePercent,
    spreadMultiplier: override?.spreadMultiplier ?? controls.spreadMultiplier,
    priceOffsetPercent: override?.priceOffsetPercent ?? controls.priceOffsetPercent,
    throttleMs: override?.throttleMs ?? controls.throttleMs,
    blackout: override?.blackout ?? controls.blackoutSymbols.includes(symbol),
  };
}

function applyNoise(price: number, noisePercent: number): number {
  if (noisePercent === 0) return price;
  const noise = price * (noisePercent / 100) * (Math.random() * 2 - 1);
  return +(price + noise).toFixed(price < 1 ? 6 : 2);
}

function applyOffset(price: number, offsetPercent: number): number {
  if (offsetPercent === 0) return price;
  return +(price * (1 + offsetPercent / 100)).toFixed(price < 1 ? 6 : 2);
}

function applySpread(bid: number, ask: number, multiplier: number): { bid: number; ask: number } {
  if (multiplier === 1) return { bid, ask };
  const mid = (bid + ask) / 2;
  const halfSpread = ((ask - bid) / 2) * multiplier;
  return {
    bid: +(mid - halfSpread).toFixed(bid < 1 ? 6 : 2),
    ask: +(mid + halfSpread).toFixed(ask < 1 ? 6 : 2),
  };
}

/**
 * Process a raw tick through the feed filter.
 * This is the single entry point — all ticks (live + replay) go through here.
 */
export function processTick(tick: MarketTick): void {
  if (!controls.enabled) {
    // No manipulation — pass through immediately
    deliverTick(tick);
    return;
  }

  const ctl = getEffectiveControls(tick.symbol);

  // Blackout — drop the tick entirely
  if (ctl.blackout) return;

  // Throttle — skip if too soon since last tick for this symbol
  if (ctl.throttleMs > 0) {
    const lastTime = lastTickTime.get(tick.symbol) || 0;
    if (Date.now() - lastTime < ctl.throttleMs) return;
    lastTickTime.set(tick.symbol, Date.now());
  }

  // Apply manipulations
  let { bid, ask, last } = tick;

  // Price offset
  bid = applyOffset(bid, ctl.priceOffsetPercent);
  ask = applyOffset(ask, ctl.priceOffsetPercent);
  last = applyOffset(last, ctl.priceOffsetPercent);

  // Noise
  bid = applyNoise(bid, ctl.noisePercent);
  ask = applyNoise(ask, ctl.noisePercent);
  last = applyNoise(last, ctl.noisePercent);

  // Spread manipulation
  const spread = applySpread(bid, ask, ctl.spreadMultiplier);
  bid = spread.bid;
  ask = spread.ask;

  const filteredTick: MarketTick = { ...tick, bid, ask, last };

  // Delay
  if (ctl.delayMs > 0) {
    delayQueue.push({ tick: filteredTick, deliverAt: Date.now() + ctl.delayMs });
  } else {
    deliverTick(filteredTick);
  }
}

function deliverTick(tick: MarketTick): void {
  const now = Date.now();

  // Update market_data in DB (this is what traders see via REST)
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO market_data (symbol, bid, ask, last, volume, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(tick.symbol, tick.bid, tick.ask, tick.last, tick.volume, now);

  // Update positions with filtered prices
  const positions = db.prepare('SELECT * FROM positions WHERE symbol = ?').all(tick.symbol) as any[];
  for (const pos of positions) {
    const unrealizedPnl = +((tick.last - pos.avg_entry_price) * pos.quantity).toFixed(2);
    db.prepare('UPDATE positions SET current_price = ?, unrealized_pnl = ?, updated_at = ? WHERE id = ?')
      .run(tick.last, unrealizedPnl, now, pos.id);
  }

  // Broadcast to WebSocket clients
  broadcast({ type: 'market:tick', payload: tick, timestamp: now });
}

function setupDrainLoop(): void {
  if (drainInterval) clearInterval(drainInterval);

  if (controls.delayMs > 0 && controls.enabled) {
    drainInterval = setInterval(() => {
      const now = Date.now();
      while (delayQueue.length > 0 && delayQueue[0].deliverAt <= now) {
        const item = delayQueue.shift()!;
        deliverTick(item.tick);
      }
    }, 50); // Check every 50ms
  } else {
    drainInterval = null;
  }
}
