# BBSIM — Brokers Book Simulator

A full-stack trading simulator with firm-side risk management and trader-side execution. Native desktop apps powered by Zig + zero-native with React frontends. Supports live market data from multiple exchanges via direct WebSocket or Python cryptofeed bridge.

## Architecture

```
BBSIM/
├── apps/
│   ├── firm/              # Firm admin dashboard (Zig native + React + TS)
│   │   ├── src/           # Zig native shell + React components
│   │   └── build.zig      # Zig build with zero-native
│   └── trader/            # Trader client (Zig native + React + TS)
│       ├── src/           # Zig native shell + React components
│       └── build.zig      # Zig build with zero-native
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
├── scripts/
│   ├── windows/           # PowerShell launch scripts
│   └── linux/             # Bash launch scripts
└── package.json           # pnpm workspaces root
```

## Tech Stack

- **Native Shell**: Zig 0.16 + zero-native (WebView2 on Windows, WebKit on Linux/macOS)
- **API**: Express + TypeScript + better-sqlite3 (fast local DB, WAL mode)
- **Firm Dashboard**: Vite + React + TypeScript (port 5173)
- **Trader Client**: Vite + React + TypeScript (port 5174)
- **Shared Types**: TypeScript package consumed by all
- **Market Feed**: Simulated / Binance / Coinbase / Bybit / Cryptofeed Bridge
- **Real-time**: WebSocket for live market ticks + order/trade events

## Prerequisites

- [Zig 0.16.0](https://ziglang.org/download/) — add to PATH
- [Node.js 18+](https://nodejs.org/)
- [pnpm](https://pnpm.io/) — `npm install -g pnpm`
- [zero-native](https://www.npmjs.com/package/zero-native) — `npm install -g zero-native`

## Quick Start

```bash
# Clone and install
git clone <repo-url> && cd BBSIM
pnpm install

# Seed the database (creates admin + sample trader)
pnpm seed
```

---

## Running the Desktop Apps

### Windows

```powershell
# Broker (Firm) side — starts API + Vite + native window
.\scripts\windows\dev-firm.ps1

# Trader (User) side — starts API + Vite + native window
.\scripts\windows\dev-trader.ps1

# Everything at once — both apps + API
.\scripts\windows\dev-all.ps1
```

Or via pnpm:

```powershell
pnpm firm
pnpm trader
pnpm all
```

### Linux / macOS

```bash
# Make scripts executable (first time only)
chmod +x scripts/linux/*.sh

# Broker (Firm) side
./scripts/linux/dev-firm.sh

# Trader (User) side
./scripts/linux/dev-trader.sh

# Everything at once
./scripts/linux/dev-all.sh
```

---

## Manual Start (step by step)

If you prefer running each piece separately:

```bash
# Terminal 1 — API server (port 3001)
pnpm dev:api

# Terminal 2 — Firm frontend (port 5173)
pnpm dev:firm

# Terminal 3 — Firm native shell
cd apps/firm && zig build dev

# Terminal 4 — Trader frontend (port 5174)
pnpm dev:trader

# Terminal 5 — Trader native shell
cd apps/trader && zig build dev
```

---

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
