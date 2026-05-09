import type { MarketProvider, OnTickCallback } from './types';

const BINANCE_WS = 'wss://stream.binance.com:9443/ws';

// Map display symbols to Binance stream format
function toBinanceStream(symbol: string): string {
  // BTC-USD -> btcusdt (Binance uses USDT pairs)
  return symbol.replace('-USD', 'usdt').toLowerCase();
}

function toDisplaySymbol(binanceSymbol: string): string {
  // btcusdt -> BTC-USD
  const base = binanceSymbol.replace('usdt', '').toUpperCase();
  return `${base}-USD`;
}

export class BinanceProvider implements MarketProvider {
  name = 'Binance';
  id = 'binance' as const;
  private ws: WebSocket | null = null;

  connect(symbols: string[], onTick: OnTickCallback): void {
    const streams = symbols.map((s) => `${toBinanceStream(s)}@ticker`).join('/');
    const url = `${BINANCE_WS}/${streams}`;

    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Combined stream format: { stream: "btcusdt@ticker", data: {...} }
        const ticker = data.data || data;

        if (ticker.e === '24hrTicker') {
          const symbol = toDisplaySymbol(ticker.s.toLowerCase());
          onTick({
            symbol,
            bid: parseFloat(ticker.b),
            ask: parseFloat(ticker.a),
            last: parseFloat(ticker.c),
            volume: parseFloat(ticker.v),
            timestamp: ticker.E,
          });
        }
      } catch {
        // Skip malformed messages
      }
    };

    this.ws.onerror = (err) => {
      console.error('[Binance WS] Error:', err);
    };

    this.ws.onclose = () => {
      console.log('[Binance WS] Disconnected');
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  getDefaultSymbols(): string[] {
    return ['BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD', 'XRP-USD', 'ADA-USD', 'AVAX-USD', 'LINK-USD'];
  }
}
