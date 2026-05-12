import { Router } from 'express';
import { getDb } from '../../shared/db/index.js';
import { authenticate } from '../auth/auth.service.js';
import type { AuthPayload } from '../auth/auth.service.js';

export const tradesRouter = Router();
tradesRouter.use(authenticate);

// GET /api/trades
tradesRouter.get('/', (req, res) => {
  const auth = (req as any).auth as AuthPayload;
  const db = getDb();
  const limit = Math.min(Number(req.query.limit) || 50, 500);

  let trades;
  if (auth.role === 'firm') {
    trades = db.prepare('SELECT * FROM trades ORDER BY executed_at DESC LIMIT ?').all(limit);
  } else {
    trades = db.prepare('SELECT * FROM trades WHERE trader_id = ? ORDER BY executed_at DESC LIMIT ?').all(auth.traderId, limit);
  }

  res.json({ success: true, data: trades });
});

// GET /api/trades/stats
tradesRouter.get('/stats', (req, res) => {
  const auth = (req as any).auth as AuthPayload;
  const db = getDb();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  let stats;
  if (auth.role === 'firm') {
    stats = db.prepare(`
      SELECT 
        COUNT(*) as total_trades,
        COALESCE(SUM(pnl), 0) as total_pnl,
        COALESCE(SUM(CASE WHEN executed_at >= ? THEN pnl ELSE 0 END), 0) as daily_pnl,
        COALESCE(SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END), 0) as winning_trades,
        COALESCE(SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END), 0) as losing_trades
      FROM trades
    `).get(todayTs);
  } else {
    stats = db.prepare(`
      SELECT 
        COUNT(*) as total_trades,
        COALESCE(SUM(pnl), 0) as total_pnl,
        COALESCE(SUM(CASE WHEN executed_at >= ? THEN pnl ELSE 0 END), 0) as daily_pnl,
        COALESCE(SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END), 0) as winning_trades,
        COALESCE(SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END), 0) as losing_trades
      FROM trades WHERE trader_id = ?
    `).get(todayTs, auth.traderId);
  }

  res.json({ success: true, data: stats });
});
