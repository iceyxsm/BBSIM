import type { MarketProvider, OnTickCallback } from './types';

const DEFAULT_BRIDGE_URL = 'ws://localhost:8765';

export class CryptofeedProvider implements MarketProvider {
  name = 'Cryptofeed Bridge';
  id = 'cryptofeed' as const;
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private bridgeUrl: string;

  constructor(bridgeUrl = DEFAULT_BRIDGE_URL) {
    this.bridgeUrl = bridgeUrl;
  }

  connect(symbols: string[], onTick: OnTickCallback): void {
    this.doConnect(symbols, onTick);
  }

  private doConnect(symbols: string[], onTick: OnTickCallback): void {
    this.ws = new WebSocket(this.bridgeUrl);

    this.ws.onopen = () => {
      console.log('[Cryptofeed Bridge] Connected');
      // Tell the bridge which symbols we want
      const subscribeMsg = {
        type: 'subscribe',
        symbols,
      };
      this.ws?.send(JSON.stringify(subscribeMsg));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'tick') {
          onTick({
            symbol: data.symbol,
            bid: data.bid,
            ask: data.ask,
            last: data.last,
            volume: data.volume,
            timestamp: data.timestamp,
          });
        }
      } catch {
        // Skip malformed messages
      }
    };

    this.ws.onerror = (err) => {
      console.error('[Cryptofeed Bridge] Error:', err);
    };

    this.ws.onclose = () => {
      console.log('[Cryptofeed Bridge] Disconnected, retrying in 3s...');
      this.reconnectTimer = window.setTimeout(() => {
        this.doConnect(symbols, onTick);
      }, 3000);
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
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
