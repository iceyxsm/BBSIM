# BBSIM — Brokers Book Simulator

A real-time trading simulator with a local-first architecture. Simulates market data, order execution, position tracking, and P&L calculation — all running in the browser with zero backend.

## Tech Stack

- **React + TypeScript** — UI with Vite
- **Dexie.js (IndexedDB)** — Fast local database, no server needed
- **Live market simulation** — Random walk price engine with configurable volatility

## Features

- Real-time market watch with bid/ask/last/volume
- Market & limit order entry
- Instant order execution engine
- Position tracking with unrealized/realized P&L
- Full trade history
- All data persists locally in IndexedDB

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 — click a symbol in Market Watch, then use the order entry panel to trade.

## Project Structure

```
src/
├── db/              # Dexie database schema & types
├── components/      # UI panels (MarketWatch, OrderEntry, Positions, etc.)
├── hooks/           # Market simulator & order execution logic
├── App.tsx          # Main layout
└── main.tsx         # Entry point
```

## How It Works

1. **Market Simulator** ticks every 800ms, applying random walk to all symbols
2. **Order Entry** lets you place BUY/SELL market or limit orders
3. **Execution Engine** fills market orders instantly at bid/ask
4. **Positions** update in real-time with unrealized P&L as prices move
5. **Trade History** records every execution with realized P&L on sells
