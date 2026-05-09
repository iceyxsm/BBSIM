import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { API_PORT } from '@bbsim/shared';
import { initDb } from './db/init.js';
import { authRouter } from './routes/auth.js';
import { ordersRouter } from './routes/orders.js';
import { positionsRouter } from './routes/positions.js';
import { tradesRouter } from './routes/trades.js';
import { tradersRouter } from './routes/traders.js';
import { marketRouter } from './routes/market.js';
import { setupWebSocket } from './ws/index.js';
import { startMarketFeed } from './services/market-feed.js';

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

// WebSocket
const wss = new WebSocketServer({ server, path: '/ws' });
setupWebSocket(wss);

// Initialize
initDb();
startMarketFeed();

server.listen(API_PORT, () => {
  console.log(`[BBSIM API] Running on http://localhost:${API_PORT}`);
  console.log(`[BBSIM API] WebSocket on ws://localhost:${API_PORT}/ws`);
});
