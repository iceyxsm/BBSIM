import type { MarketProvider, OnTickCallback } from './types';

const COINBASE_WS = 'wss://ws-feed.exchange.coinbase.com';

export class CoinbaseProvider implements MarketProvider {
  name = 'Coinbase';
  id = 'coinbase' as const;
  private ws: WebSocket | null = null;

  connect(symbols: string[], onTick: OnTickCallback): void {
    this.ws = new WebSocket(COINBASE_WS);

    this.ws.onopen = () => {
      // Subscribe to ticker channel
      const subscribeMsg = {
        type: 'subscribe',
        product_ids: symbols,
        channels: ['ticker'],
      };
      this.ws?.send(JSON.stringify(subscribeMsg));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'ticker') {
          onTick({
            symbol: data.product_id,
            bid: parseFloat(data.best_bid),
            ask: parseFloat(data.best_ask),
            last: parseFloat(data.price),
            volume: parseFloat(data.volume_24h || '0'),
            timestamp: new Date(data.time).getTime(),
          });
        }
      } catch {
        // Skip malformed messages
      }
    };

    this.ws.onerror = (err) => {
      console.error('[Coinbase WS] Error:', err);
    };

    this.ws.onclose = () => {
      console.log('[Coinbase WS] Disconnected');
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
