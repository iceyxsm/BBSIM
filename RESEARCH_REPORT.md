# BBSIM External Tools Research Report

## Summary Matrix

| Repo | Type | Stack | BBSIM Fit | Priority | Status |
|------|------|-------|-----------|----------|--------|
| **binance_historical_data** | Historical data downloader | Python | ⭐⭐⭐⭐⭐ | HIGH | Inactive (Sept 2024) |
| **QuantDinger** | Full quant platform | Python/Vue/Docker | ⭐⭐⭐⭐ | HIGH | Active |
| **AllTick API** | Commercial data service | REST/WebSocket | ⭐⭐⭐⭐ | MEDIUM | Active (commercial) |
| **cryptoviz** | Orderbook DOM visualization | React/Canvas | ⭐⭐⭐ | MEDIUM | Abandoned (~2017) |
| **cryptoQuotes** | OHLC data fetcher | R | ⭐⭐⭐ | LOW | Active (CRAN) |
| **crypto-hft-data** | HFT data collector | Python/CSV | ⭐⭐ | LOW | Abandoned (2020) |
| **CryptoVerse** | Crypto tracker web app | Node/EJS/jQuery | ⭐ | SKIP | Abandoned (2023) |

---

## 1. binance_historical_data — ⭐ HIGH PRIORITY

**What:** Python package that bulk-downloads historical klines/trades from Binance's public data servers. No API key needed. All pairs back to 2017, 1-minute granularity.

**Why it matters for BBSIM:** This is the missing piece for your replay trading feature. Instead of only replaying previously-recorded live sessions, you can replay **years of real market data** at any speed.

**Integration plan:**
```
bridge/historical_replay.py (new)
├── Uses binance_historical_data to dump CSVs
├── Reads CSV files → converts to BBSIM tick format
├── Streams over WebSocket at configurable speed (1x–100x)
└── Exposes to API: POST /api/sessions/historical
```

**Action items:**
1. Add `binance_historical_data` to `bridge/requirements.txt`
2. Create `bridge/dump_data.py` — one-time script to download historical data
3. Create `bridge/historical_replay.py` — streams CSVs as ticks to BBSIM API
4. Add API routes: `GET /api/historical/tickers`, `POST /api/sessions/historical`
5. Store dumps in `data/historical/` (gitignored)

**Data format:** CSV with columns: Open time, Open, High, Low, Close, Volume, Close time, Quote asset volume, Number of trades, Taker buy base/quote volume

**Effort:** ~2-3 hours to integrate

---

## 2. QuantDinger — ⭐ HIGH PRIORITY

**What:** Self-hosted AI quant trading platform with backtesting, strategy development, 10+ exchange support, and an Agent Gateway API. Docker Compose deployment.

**Why it matters for BBSIM:** Adds proper backtesting with metrics (Sharpe, drawdown, equity curves), AI-assisted strategy generation, and massively expands exchange coverage. The Agent Gateway API makes it plug-and-play.

**Integration plan:**
```
QuantDinger (Docker sidecar)
├── Agent Gateway: http://localhost:8888/api/agent/v1
├── BBSIM API proxies requests to QuantDinger
├── Backtesting: POST /api/agent/v1/backtest
├── Market data: GET /api/agent/v1/market/candles
└── AI analysis: POST /api/agent/v1/research
```

**What BBSIM gains:**
- Proper backtesting engine (run strategies against historical data)
- AI market research tab for traders
- 10+ additional exchanges via CCXT
- Indicator computation (SMA, RSI, MACD) server-side
- Strategy-level risk management

**Action items:**
1. Add `docker-compose.quantdinger.yml` to BBSIM root
2. Create `packages/api/src/services/quantdinger.ts` — proxy service
3. Add routes: `POST /api/backtest`, `GET /api/indicators/:symbol`, `POST /api/ai/analyze`
4. Add "Research" and "Backtest" tabs to firm/trader dashboards

**Auth:** Bearer token (`qd_agent_xxxxxxxx`) with scoped permissions

**Effort:** ~1 day for basic integration, ongoing for full feature parity

---

## 3. AllTick API — ⭐ MEDIUM PRIORITY

**What:** Commercial real-time market data service covering forex, crypto, stocks, and commodities via WebSocket + REST. Free tier available (10 symbols, 1 WS connection).

**Why it matters for BBSIM:** Only way to get **stocks + forex + commodities** alongside crypto in one feed. Enables multi-asset simulation.

**Integration plan:**
```
packages/api/src/services/alltick-feed.ts (new provider)
├── WSS connection to quote.alltick.co
├── Heartbeat every 10s
├── Subscribe to symbols via cmd_id 22004
├── Receive ticks (cmd_id 22998) + orderbook (cmd_id 22999)
└── Normalize to BBSIM MarketTick format
```

**WebSocket subscribe format:**
```json
{ "cmd_id": 22004, "seq_id": 123, "data": { "symbol_list": [{ "code": "AAPL.US" }, { "code": "BTCUSDT" }] } }
```

**Tick push format:**
```json
{ "cmd_id": 22998, "data": { "code": "AAPL.US", "price": "185.50", "volume": "300", "tick_time": "1605509068" } }
```

**Limitations:**
- Free tier: 10 fixed demo symbols only
- Paid: starts ~$99/mo for 100 symbols
- Forex depth is price-only (no volume)
- Must resend full symbol list on each subscribe

**Action items:**
1. Register free account at alltick.co for token
2. Add `alltick` to `ExchangeId` type in shared package
3. Create `packages/api/src/services/alltick-feed.ts`
4. Add to market-feed.ts switch statement
5. Handle heartbeat (10s interval) and reconnection

**Effort:** ~3-4 hours

---

## 4. cryptoviz — ⭐ MEDIUM PRIORITY (Reference Only)

**What:** Real-time orderbook depth visualization using Canvas2D. Shows volume bands at price levels evolving over time, with trade execution indicators.

**Why it matters for BBSIM:** The visualization concept is exactly what traders need to see market microstructure. The code itself is too outdated to use, but the algorithms and rendering approach are gold.

**What to steal (concepts, not code):**
- Dual-canvas architecture (volume bands + trade lines)
- Incremental right-append rendering (only draw new data)
- Replay-from-history (re-render entire stored event history)
- Callback-based data model: `{price, newAmount, isBid}` modifications

**Integration plan:**
1. Build a new `<DepthVisualizer />` React component in TypeScript
2. Use raw Canvas2D (no PaperJS dependency needed)
3. Feed it from BBSIM's WebSocket `market:tick` events
4. Add L2 orderbook data to the API (extend cryptofeed bridge with `L2_BOOK` channel)
5. Works in both live and replay modes

**Action items:**
1. Add `L2_BOOK` channel to `bridge/server.py` cryptofeed subscriptions
2. Add `orderbook:update` WebSocket message type to shared types
3. Build `apps/trader/src/components/DepthVisualizer.tsx` — Canvas-based DOM viz
4. Add `GET /api/market/orderbook/:symbol` endpoint

**Effort:** ~1-2 days for a basic implementation

---

## 5. cryptoQuotes — ⭐ LOW PRIORITY (Reference Only)

**What:** R package for fetching OHLC-V data from 9 exchanges. No API keys needed.

**Why it matters for BBSIM:** Not directly usable (R ecosystem), but documents the exact public REST endpoints for 9 exchanges. Use as a reference to build native TypeScript data fetchers.

**Useful endpoint mappings discovered:**
| Exchange | Candle Endpoint |
|----------|----------------|
| Binance | `https://api.binance.com/api/v3/klines` |
| Kraken | `https://api.kraken.com/0/public/OHLC` |
| Bybit | `https://api.bybit.com/v5/market/kline` |
| Coinbase | `https://api.exchange.coinbase.com/products/{id}/candles` |
| KuCoin | `https://api.kucoin.com/api/v1/market/candles` |

**Sentiment data endpoints (Binance Futures):**
- Long-Short Ratio: `/futures/data/globalLongShortAccountRatio`
- Open Interest: `/futures/data/openInterestHist`
- Funding Rate: `/fapi/v1/fundingRate`

**Action:** No integration needed. Bookmark these endpoints for when you build BBSIM's charting/indicator features natively in TypeScript.

---

## 6. crypto-hft-data — ⭐ LOW PRIORITY

**What:** Python HFT data collector that saves orderbook/trades/liquidations to CSV from 7 exchanges.

**Why it matters for BBSIM:** Largely redundant — your cryptofeed bridge already does this better. However, the **L2 orderbook** and **liquidation** collection patterns are worth noting.

**What to take from it:**
- Add `L2_BOOK` to cryptofeed bridge (already supported by cryptofeed)
- Add `LIQUIDATIONS` channel for margin simulation
- Add CSV recording to the bridge for offline replay datasets

**These are ~50 lines of code in your existing `bridge/server.py`:**
```python
# Add to cryptofeed subscription:
channels=[TICKER, TRADES, L2_BOOK, LIQUIDATIONS]

# Add file recording callback:
async def record_to_csv(data, receipt_timestamp):
    # Write to data/recordings/{exchange}/{symbol}_{date}.csv
```

**Action:** Skip the repo. Add L2_BOOK + LIQUIDATIONS to your existing bridge instead.

---

## 7. CryptoVerse — ⭐ SKIP

**What:** Abandoned crypto tracker web app (Node/EJS/jQuery). Last commit Feb 2023. No API, no reusable code, incompatible stack.

**Value for BBSIM:** Near zero. The only takeaway is that CoinGecko's free API works for basic price data, which you already know.

**Action:** Skip entirely.

---

## Recommended Integration Roadmap

### Phase 1 (This Week)
1. **binance_historical_data** — Add historical replay capability
2. **L2 orderbook + liquidations** — Extend cryptofeed bridge (from crypto-hft-data concepts)

### Phase 2 (Next Week)
3. **AllTick API** — Add multi-asset support (stocks/forex/commodities)
4. **Depth Visualizer** — Build Canvas-based DOM visualization (from cryptoviz concepts)

### Phase 3 (Later)
5. **QuantDinger** — Deploy as Docker sidecar for backtesting + AI research
6. **Native TypeScript data fetchers** — Use cryptoQuotes endpoint mappings to build direct exchange API calls

---

## Architecture After Integration

```
BBSIM/
├── apps/
│   ├── firm/          # Firm dashboard + risk + feed controls
│   └── trader/        # Trader client + depth viz + research tab
├── packages/
│   ├── api/           # Express API (REST + WS)
│   │   └── services/
│   │       ├── market-feed.ts      # Simulated + Binance WS
│   │       ├── alltick-feed.ts     # AllTick multi-asset (NEW)
│   │       ├── quantdinger.ts      # QuantDinger proxy (NEW)
│   │       ├── historical.ts       # Historical replay from CSVs (NEW)
│   │       └── feed-filter.ts      # Firm manipulation layer
│   └── shared/
├── bridge/
│   ├── server.py                   # Cryptofeed live bridge
│   ├── dump_data.py                # Historical data downloader (NEW)
│   └── historical_replay.py        # CSV → WebSocket replay (NEW)
├── data/
│   └── historical/                 # Downloaded Binance CSVs (gitignored)
└── docker-compose.quantdinger.yml  # QuantDinger sidecar (NEW)
```
