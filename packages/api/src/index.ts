import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { API_PORT } from '@qalgo/shared';
import { initDb } from './shared/db/index.js';
import { authRouter } from './features/auth/auth.routes.js';
import { ordersRouter } from './features/orders/orders.routes.js';
import { positionsRouter } from './features/positions/positions.routes.js';
import { tradesRouter } from './features/trades/trades.routes.js';
import { tradersRouter } from './features/traders/traders.routes.js';
import { marketRouter } from './features/market/market.routes.js';
import { sessionsRouter } from './features/sessions/sessions.routes.js';
import { feedControlsRouter } from './features/feed-controls/feed-controls.routes.js';
import { setupWebSocket } from './shared/ws/index.js';
import { startMarketFeed } from './features/market/market.service.js';

const app = express();
const server = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/positions', positionsRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/traders', tradersRouter);
app.use('/api/market', marketRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/feed-controls', feedControlsRouter);

// WebSocket
const wss = new WebSocketServer({ server, path: '/ws' });
setupWebSocket(wss);

// Initialize
initDb();
startMarketFeed();

server.listen(API_PORT, '0.0.0.0', () => {
  console.log(`[QALGO API] Running on http://0.0.0.0:${API_PORT}`);
  console.log(`[QALGO API] WebSocket on ws://0.0.0.0:${API_PORT}/ws`);
  console.log(`[QALGO API] Traders can connect from the local network`);
});
