import { Router } from 'express';
import { getDb } from '../../shared/db/index.js';
import { getActiveExchange, setActiveExchange } from './market.service.js';

export const marketRouter = Router();

// GET /api/market — public, no auth needed
marketRouter.get('/', (_req, res) => {
  const db = getDb();
  const data = db.prepare('SELECT * FROM market_data ORDER BY symbol').all();
  res.json({ success: true, data });
});

// GET /api/market/exchange
marketRouter.get('/exchange', (_req, res) => {
  res.json({ success: true, data: { exchange: getActiveExchange() } });
});

// POST /api/market/exchange
marketRouter.post('/exchange', (req, res) => {
  const { exchange } = req.body;
  if (!exchange) {
    res.status(400).json({ success: false, error: 'exchange required' });
    return;
  }
  setActiveExchange(exchange);
  res.json({ success: true, data: { exchange } });
});
