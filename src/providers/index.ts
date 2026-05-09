import type { ExchangeId, MarketProvider } from './types';
import { SimulatedProvider } from './simulated';
import { BinanceProvider } from './binance';
import { CoinbaseProvider } from './coinbase';
import { BybitProvider } from './bybit';
import { CryptofeedProvider } from './cryptofeed';

export function createProvider(exchangeId: ExchangeId): MarketProvider {
  switch (exchangeId) {
    case 'simulated':
      return new SimulatedProvider();
    case 'binance':
      return new BinanceProvider();
    case 'coinbase':
      return new CoinbaseProvider();
    case 'bybit':
      return new BybitProvider();
    case 'cryptofeed':
      return new CryptofeedProvider();
    default:
      return new SimulatedProvider();
  }
}

export { EXCHANGES } from './types';
export type { MarketProvider, MarketTick, OnTickCallback, ExchangeId, ExchangeOption } from './types';
