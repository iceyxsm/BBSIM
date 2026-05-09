import { Router } from 'express';
import { getDb } from '../db/init.js';
import { authenticate } from '../middleware/auth.js';
import type { AuthPayload } from '../middleware/auth.js';

export const positionsRouter = Router();
positionsRouter.use(authenticate);

// GET /api/positions
positionsRouter.get('/', (req, res) => {
  const auth = (req as any).auth as AuthPayload;
  const db = getDb();

  let positions;
  if (auth.role === 'firm') {
    positions = db.prepare('SELECT * FROM positions ORDER BY unrealized_pnl DESC').all();
  } else {
    positions = db.prepare('SELECT * FROM positions WHERE trader_id = ?').all(auth.traderId);
  }

  res.json({ success: true, data: positions });
});

// GET /api/positions/summary
positionsRouter.get('/summary', (req, res) => {
  const auth = (req as any).auth as AuthPayload;
  const db = getDb();

  let result;
  if (auth.role === 'firm') {
    result = db.prepare(`
      SELECT 
        COUNT(*) as total_positions,
        COALESCE(SUM(unrealized_pnl), 0) as total_unrealized,
        COALESCE(SUM(realized_pnl), 0) as total_realized,
        COALESCE(SUM(quantity * current_price), 0) as total_exposure
      FROM positions
    `).get();
  } else {
    result = db.prepare(`
      SELECT 
        COUNT(*) as total_positions,
        COALESCE(SUM(unrealized_pnl), 0) as total_unrealized,
        COALESCE(SUM(realized_pnl), 0) as total_realized,
        COALESCE(SUM(quantity * current_price), 0) as total_exposure
      FROM positions WHERE trader_id = ?
    `).get(auth.traderId);
  }

  res.json({ success: true, data: result });
});
