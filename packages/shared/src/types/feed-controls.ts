export interface FeedControls {
  /** Artificial latency in ms before traders see ticks */
  delayMs: number;
  /** Random price noise as % of price (0.1 = 0.1% jitter) */
  noisePercent: number;
  /** Spread multiplier (1 = normal, 2 = double spread, 0.5 = half) */
  spreadMultiplier: number;
  /** Shift all prices by this % (positive = inflate, negative = deflate) */
  priceOffsetPercent: number;
  /** Minimum ms between ticks per symbol (throttle) */
  throttleMs: number;
  /** Symbols to completely hide from traders */
  blackoutSymbols: string[];
  /** Whether controls are active */
  enabled: boolean;
}

export interface SymbolOverride {
  symbol: string;
  delayMs?: number;
  noisePercent?: number;
  spreadMultiplier?: number;
  priceOffsetPercent?: number;
  throttleMs?: number;
  blackout?: boolean;
}

export const DEFAULT_FEED_CONTROLS: FeedControls = {
  delayMs: 0,
  noisePercent: 0,
  spreadMultiplier: 1,
  priceOffsetPercent: 0,
  throttleMs: 0,
  blackoutSymbols: [],
  enabled: false,
};
