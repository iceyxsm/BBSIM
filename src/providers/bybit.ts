import type { MarketProvider, OnTickCallback } from './types';

const BYBIT_WS = 'wss://stream.bybit.com/v5/public/spot';

function toBybitSymbol(symbol: string): string {
  // BTC-USD -> BTCUSDT
  return symbol.replace('-USD', 'USDT');
}

function toDisplaySymbol(bybitSymbol: string): string {
  // BTCUSDT -> BTC-USD
  const base = bybitSymbol.replace('USDT', '');
  return `${base}-USD`;
}

export class BybitProvider implements MarketProvider {
  name = 'Bybit';
  id = 'bybit' as const;
  private ws: WebSocket | null = null;
  private pingInterval: number | null = null;

  connect(symbols: string[], onTick: OnTickCallback): void {
    this.ws = new WebSocket(BYBIT_WS);

    this.ws.onopen = () => {
      // Subscribe to tickers
      const args = symbols.map((s) => `tickers.${toBybitSymbol(s)}`);
      const subscribeMsg = {
        op: 'subscribe',
        args,
      };
      this.ws?.send(JSON.stringify(subscribeMsg));

      // Bybit requires ping every 20s
      this.pingInterval = window.setInterval(() => {
        this.ws?.send(JSON.stringify({ op: 'ping' }));
      }, 20000);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.topic?.startsWith('tickers.') && msg.data) {
          const data = msg.data;
          const symbol = toDisplaySymbol(data.symbol);
          onTick({
            symbol,
            bid: parseFloat(data.bid1Price || '0'),
            ask: parseFloat(data.ask1Price || '0'),
            last: parseFloat(data.lastPrice || '0'),
            volume: parseFloat(data.volume24h || '0'),
            timestamp: msg.ts || Date.now(),
          });
        }
      } catch {
        // Skip malformed messages
      }
    };

    this.ws.onerror = (err) => {
      console.error('[Bybit WS] Error:', err);
    };

    this.ws.onclose = () => {
      console.log('[Bybit WS] Disconnected');
      if (this.pingInterval) clearInterval(this.pingInterval);
    };
  }

  disconnect(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  getDefaultSymbols(): string[] {
    return ['BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD', 'XRP-USD', 'ADA-USD', 'AVAX-USD', 'LINK-USD'];
  }
}
