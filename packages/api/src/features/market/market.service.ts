import { getDb } from '../../shared/db/index.js';
import { DEFAULT_SYMBOLS } from '@qalgo/shared';
import { recordTick } from '../sessions/sessions.recorder.js';
import { processTick } from './market.feed-filter.js';
import type { ExchangeId, MarketTick } from '@qalgo/shared';

let activeExchange: ExchangeId = 'simulated';
let feedInterval: ReturnType<typeof setInterval> | null = null;
let ws: any = null;

const prices: Map<string, number> = new Map();

function randomWalk(price: number, volatility = 0.0015): number {
  const change = price * volatility * (Math.random() * 2 - 1);
  return Math.max(0.0001, +(price + change).toFixed(price < 1 ? 6 : 2));
}

const BASE_PRICES: Record<string, number> = {
  'BTC-USD': 67500, 'ETH-USD': 3450, 'SOL-USD': 172, 'DOGE-USD': 0.165,
  'XRP-USD': 0.62, 'ADA-USD': 0.48, 'AVAX-USD': 38.5, 'LINK-USD': 15.2,
};

/**
 * Central tick handler — records the raw tick, then sends it through
 * the feed filter (which applies firm controls before delivering to traders).
 */
function handleRawTick(tick: MarketTick): void {
  // Record raw (unmanipulated) tick for replay
  recordTick(tick);
  // Send through feed filter (applies delay, noise, spread, etc.)
  processTick(tick);
}

function startSimulated() {
  for (const sym of DEFAULT_SYMBOLS) {
    prices.set(sym, BASE_PRICES[sym] ?? 100);
  }

  const db = getDb();
  const now = Date.now();

  for (const sym of DEFAULT_SYMBOLS) {
    const price = prices.get(sym)!;
    db.prepare('INSERT OR REPLACE INTO market_data (symbol, bid, ask, last, volume, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(sym, price - 0.05, price + 0.05, price, 0, now);
  }

  feedInterval = setInterval(() => {
    const now = Date.now();
    for (const sym of DEFAULT_SYMBOLS) {
      const current = prices.get(sym)!;
      const newPrice = randomWalk(current);
      prices.set(sym, newPrice);

      const spread = newPrice * 0.0005;
      const bid = +(newPrice - spread).toFixed(newPrice < 1 ? 6 : 2);
      const ask = +(newPrice + spread).toFixed(newPrice < 1 ? 6 : 2);

      handleRawTick({ symbol: sym, bid, ask, last: newPrice, volume: Math.floor(Math.random() * 500), timestamp: now });
    }
  }, 800);
}

async function startBinanceWs() {
  const { default: WebSocket } = await import('ws');
  const streams = DEFAULT_SYMBOLS.map(s => `${s.replace('-USD', 'usdt').toLowerCase()}@ticker`).join('/');
  ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);

  ws.on('message', (raw: Buffer) => {
    try {
      const data = JSON.parse(raw.toString());
      const ticker = data.data || data;
      if (ticker.e === '24hrTicker') {
        const base = ticker.s.replace('USDT', '');
        const symbol = `${base}-USD`;
        const bid = parseFloat(ticker.b);
        const ask = parseFloat(ticker.a);
        const last = parseFloat(ticker.c);
        const volume = parseFloat(ticker.v);
        const now = Date.now();

        handleRawTick({ symbol, bid, ask, last, volume, timestamp: now });
      }
    } catch { /* skip */ }
  });

  ws.on('error', (err: Error) => console.error('[Binance Feed]', err.message));
}

function stopFeed() {
  if (feedInterval) { clearInterval(feedInterval); feedInterval = null; }
  if (ws) { ws.close(); ws = null; }
}

export function getActiveExchange(): ExchangeId {
  return activeExchange;
}

export function setActiveExchange(exchange: ExchangeId) {
  stopFeed();
  activeExchange = exchange;
  startMarketFeed();
}

export function startMarketFeed() {
  stopFeed();

  switch (activeExchange) {
    case 'simulated':
      startSimulated();
      break;
    case 'binance':
      startBinanceWs();
      break;
    default:
      startSimulated();
  }

  console.log(`[Market Feed] Active: ${activeExchange}`);
}
