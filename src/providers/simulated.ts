import type { MarketProvider, OnTickCallback } from './types';

const DEFAULT_SYMBOLS = [
  { symbol: 'BTC-USD', base: 67500 },
  { symbol: 'ETH-USD', base: 3450 },
  { symbol: 'SOL-USD', base: 172 },
  { symbol: 'DOGE-USD', base: 0.165 },
  { symbol: 'XRP-USD', base: 0.62 },
  { symbol: 'ADA-USD', base: 0.48 },
  { symbol: 'AVAX-USD', base: 38.5 },
  { symbol: 'LINK-USD', base: 15.2 },
];

function randomWalk(price: number, volatility = 0.0015): number {
  const change = price * volatility * (Math.random() * 2 - 1);
  return Math.max(0.0001, +(price + change).toFixed(price < 1 ? 6 : 2));
}

export class SimulatedProvider implements MarketProvider {
  name = 'Simulated';
  id = 'simulated' as const;
  private intervalId: number | null = null;
  private prices: Map<string, number> = new Map();

  connect(symbols: string[], onTick: OnTickCallback): void {
    // Initialize prices
    for (const sym of symbols) {
      const def = DEFAULT_SYMBOLS.find((s) => s.symbol === sym);
      this.prices.set(sym, def?.base ?? 100);
    }

    this.intervalId = window.setInterval(() => {
      for (const sym of symbols) {
        const current = this.prices.get(sym) ?? 100;
        const newPrice = randomWalk(current);
        this.prices.set(sym, newPrice);

        const spread = newPrice * 0.0005;
        onTick({
          symbol: sym,
          bid: +(newPrice - spread).toFixed(newPrice < 1 ? 6 : 2),
          ask: +(newPrice + spread).toFixed(newPrice < 1 ? 6 : 2),
          last: newPrice,
          volume: Math.floor(Math.random() * 500_000),
          timestamp: Date.now(),
        });
      }
    }, 800);
  }

  disconnect(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getDefaultSymbols(): string[] {
    return DEFAULT_SYMBOLS.map((s) => s.symbol);
  }
}
