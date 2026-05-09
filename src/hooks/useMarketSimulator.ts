import { useEffect, useRef } from 'react';
import { db } from '../db';
import { createProvider, type ExchangeId, type MarketProvider, type MarketTick } from '../providers';

export function useMarketSimulator(exchangeId: ExchangeId) {
  const providerRef = useRef<MarketProvider | null>(null);

  useEffect(() => {
    // Disconnect previous provider
    if (providerRef.current) {
      providerRef.current.disconnect();
      providerRef.current = null;
    }

    const provider = createProvider(exchangeId);
    providerRef.current = provider;

    const symbols = provider.getDefaultSymbols();

    // Seed market data table with symbols
    const seed = async () => {
      // Clear old market data when switching exchanges
      await db.marketData.clear();

      const now = Date.now();
      for (const symbol of symbols) {
        await db.marketData.add({
          symbol,
          bid: 0,
          ask: 0,
          last: 0,
          volume: 0,
          updatedAt: now,
        });
      }
    };

    const handleTick = async (tick: MarketTick) => {
      const existing = await db.marketData.where('symbol').equals(tick.symbol).first();
      if (existing) {
        await db.marketData.update(existing.id!, {
          bid: tick.bid,
          ask: tick.ask,
          last: tick.last,
          volume: tick.volume,
          updatedAt: tick.timestamp,
        });
      }

      // Update position unrealized P&L
      const positions = await db.positions.where('symbol').equals(tick.symbol).toArray();
      for (const pos of positions) {
        const unrealizedPnl = +((tick.last - pos.avgEntryPrice) * pos.quantity).toFixed(2);
        await db.positions.update(pos.id!, {
          currentPrice: tick.last,
          unrealizedPnl,
          updatedAt: tick.timestamp,
        });
      }
    };

    seed().then(() => {
      provider.connect(symbols, handleTick);
    });

    return () => {
      provider.disconnect();
    };
  }, [exchangeId]);
}
