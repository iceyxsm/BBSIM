# BBSIM — Brokers Book Simulator

A full-stack trading simulator with firm-side risk management and trader-side execution. Supports live market data from multiple exchanges via direct WebSocket or Python cryptofeed bridge.

## Architecture

```
BBSIM/
├── apps/
│   ├── firm/              # Firm admin dashboard (React + TS)
│   │   └── src/           # Risk overview, trader management, all positions/orders
│   └── trader/            # Trader client (React + TS)
│       └── src/           # Market watch, order entry, positions, trade history
├── packages/
│   ├── api/               # REST + WebSocket API server (Express + SQLite)
│   │   └── src/
│   │       ├── routes/    # auth, orders, positions, trades, traders, market
│   │       ├── services/  # execution engine, market feed
│   │       ├── ws/        # WebSocket broadcast
│   │       ├── middleware/# JWT auth
│   │       └── db/        # SQLite schema + init
│   └── shared/            # Shared types, constants
│       └── src/types/     # Order, Position, Trade, Trader, Market, API types
├── bridge/                # Python cryptofeed bridge server
└── package.json           # npm workspaces root
```

## Tech Stack

- **API**: Express + TypeScript + better-sqlite3 (fast local DB, WAL mode)
- **Firm Dashboard**: Vite + React + TypeScript (port 5173)
- **Trader Client**: Vite + React + TypeScript (port 5174)
- **Shared Types**: TypeScript package consumed by all
- **Market Feed**: Simulated / Binance / Coinbase / Bybit / Cryptofeed Bridge
- **Real-time**: WebSocket for live market ticks + order/trade events

## Getting Started

```bash
# Install all dependencies
npm install

# Seed the database (creates admin + sample trader)
npm run seed -w @bbsim/api

# Start the API server
npm run dev:api

# Start the firm dashboard (separate terminal)
npm run dev:firm

# Start the trader client (separate terminal)
npm run dev:trader
```

## Default Credentials

| Role   | Email             | Password   |
|--------|-------------------|------------|
| Firm   | admin@bbsim.io    | admin123   |
| Trader | trader@bbsim.io   | trader123  |

## API Endpoints

| Method | Path                       | Auth     | Description                    |
|--------|----------------------------|----------|--------------------------------|
| POST   | /api/auth/login            | —        | Login, get JWT                 |
| POST   | /api/auth/register         | Firm     | Create new trader              |
| GET    | /api/auth/me               | Any      | Get current user               |
| GET    | /api/orders                | Any      | List orders (firm sees all)    |
| POST   | /api/orders                | Trader   | Place new order                |
| DELETE  | /api/orders/:id            | Any      | Cancel order                   |
| GET    | /api/positions             | Any      | List positions                 |
| GET    | /api/positions/summary     | Any      | P&L summary                    |
| GET    | /api/trades                | Any      | Trade history                  |
| GET    | /api/trades/stats          | Any      | Win rate, daily P&L            |
| GET    | /api/traders               | Firm     | List all traders               |
| PATCH  | /api/traders/:id           | Firm     | Update limits, disable trader  |
| GET    | /api/market                | —        | Current market data            |
| POST   | /api/market/exchange       | —        | Switch exchange feed           |
| GET    | /api/sessions              | Any      | List recorded sessions         |
| GET    | /api/sessions/status       | Any      | Recording/replay state         |
| POST   | /api/sessions/record       | Any      | Start recording (name required)|
| POST   | /api/sessions/stop         | Any      | Stop recording                 |
| POST   | /api/sessions/:id/replay   | Any      | Replay session (speed, offset) |
| POST   | /api/sessions/replay/stop  | Any      | Stop replay                    |
| POST   | /api/sessions/replay/speed | Any      | Change replay speed live       |
| DELETE  | /api/sessions/:id          | Any      | Delete a session               |
| WS     | /ws                        | Token    | Real-time events               |

## Exchange Feeds

Switch via the firm dashboard or `POST /api/market/exchange`:

- **simulated** — Random walk, no external deps
- **binance** — Live Binance WebSocket (server-side)
- **coinbase** — Live Coinbase WebSocket
- **bybit** — Live Bybit WebSocket
- **cryptofeed** — Python bridge for 40+ exchanges

## Replay Trading

Record any live session and replay it later at any speed to practice or backtest:

```bash
# Start recording (while live feed is running)
curl -X POST http://localhost:3001/api/sessions/record \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Morning Session"}'

# Stop recording
curl -X POST http://localhost:3001/api/sessions/stop \
  -H "Authorization: Bearer $TOKEN"

# Replay at 5x speed
curl -X POST http://localhost:3001/api/sessions/SESSION_ID/replay \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"speed": 5}'

# Change speed mid-replay
curl -X POST http://localhost:3001/api/sessions/replay/speed \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"speed": 10}'
```

Orders placed during replay execute against the replayed prices — same as live.

### Cryptofeed Bridge

```bash
cd bridge
pip install -r requirements.txt
python server.py --exchange kraken
```

## Plug & Play

The API is designed to be consumed by any client. Use the REST endpoints + WebSocket to build custom UIs, bots, or integrations. JWT auth keeps it secure.
