import { useEffect, useRef } from 'react';
import { db, type MarketData } from '../db';

const DEFAULT_SYMBOLS = [
  { symbol: 'AAPL', base: 185.0 },
  { symbol: 'GOOGL', base: 141.0 },
  { symbol: 'MSFT', base: 420.0 },
  { symbol: 'TSLA', base: 245.0 },
  { symbol: 'AMZN', base: 178.0 },
  { symbol: 'NVDA', base: 880.0 },
  { symbol: 'META', base: 505.0 },
  { symbol: 'JPM', base: 198.0 },
];

function randomWalk(price: number, volatility = 0.002): number {
  const change = price * volatility * (Math.random() * 2 - 1);
  return Math.max(0.01, +(price + change).toFixed(2));
}

export function useMarketSimulator(intervalMs = 1000) {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Seed initial market data
    const seed = async () => {
      const count = await db.marketData.count();
      if (count === 0) {
        const now = Date.now();
        const entries: MarketData[] = DEFAULT_SYMBOLS.map(({ symbol, base }) => ({
          symbol,
          bid: +(base - 0.05).toFixed(2),
          ask: +(base + 0.05).toFixed(2),
          last: base,
          volume: Math.floor(Math.random() * 1_000_000),
          updatedAt: now,
        }));
        await db.marketData.bulkAdd(entries);
      }
    };
    seed();

    // Tick market prices
    intervalRef.current = window.setInterval(async () => {
      const allData = await db.marketData.toArray();
      const now = Date.now();

      for (const item of allData) {
        const newLast = randomWalk(item.last);
        const spread = +(Math.random() * 0.1 + 0.01).toFixed(2);
        await db.marketData.update(item.id!, {
          last: newLast,
          bid: +(newLast - spread / 2).toFixed(2),
          ask: +(newLast + spread / 2).toFixed(2),
          volume: item.volume + Math.floor(Math.random() * 1000),
          updatedAt: now,
        });
      }

      // Update position unrealized P&L
      const positions = await db.positions.toArray();
      for (const pos of positions) {
        const market = allData.find((m) => m.symbol === pos.symbol);
        if (market) {
          const currentPrice = market.last;
          const unrealizedPnl = +((currentPrice - pos.avgEntryPrice) * pos.quantity).toFixed(2);
          await db.positions.update(pos.id!, { currentPrice, unrealizedPnl, updatedAt: now });
        }
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [intervalMs]);
}
