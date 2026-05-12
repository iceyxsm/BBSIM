import { Router } from 'express';
import { getDb } from '../../shared/db/index.js';
import { authenticate, requireFirm } from '../auth/auth.service.js';

export const tradersRouter = Router();
tradersRouter.use(authenticate);
tradersRouter.use(requireFirm);

// GET /api/traders (firm only)
tradersRouter.get('/', (_req, res) => {
  const db = getDb();
  const traders = db.prepare(`
    SELECT id, name, email, role, max_position_size, max_daily_loss, is_active, created_at
    FROM traders ORDER BY created_at DESC
  `).all();

  res.json({ success: true, data: traders });
});

// GET /api/traders/:id/stats (firm only)
tradersRouter.get('/:id/stats', (req, res) => {
  const db = getDb();
  const traderId = req.params.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_trades,
      COALESCE(SUM(pnl), 0) as total_pnl,
      COALESCE(SUM(CASE WHEN executed_at >= ? THEN pnl ELSE 0 END), 0) as daily_pnl,
      COALESCE(SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END), 0) as winning_trades
    FROM trades WHERE trader_id = ?
  `).get(todayTs, traderId) as Record<string, unknown>;

  const positions = db.prepare('SELECT COUNT(*) as count FROM positions WHERE trader_id = ?').get(traderId) as any;

  res.json({ success: true, data: { ...(stats as object), openPositions: positions.count } });
});

// PATCH /api/traders/:id (firm only — update limits, disable)
tradersRouter.patch('/:id', (req, res) => {
  const db = getDb();
  const { maxPositionSize, maxDailyLoss, isActive } = req.body;

  const updates: string[] = [];
  const values: any[] = [];

  if (maxPositionSize !== undefined) { updates.push('max_position_size = ?'); values.push(maxPositionSize); }
  if (maxDailyLoss !== undefined) { updates.push('max_daily_loss = ?'); values.push(maxDailyLoss); }
  if (isActive !== undefined) { updates.push('is_active = ?'); values.push(isActive ? 1 : 0); }

  if (updates.length === 0) {
    res.status(400).json({ success: false, error: 'No fields to update' });
    return;
  }

  values.push(req.params.id);
  db.prepare(`UPDATE traders SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  res.json({ success: true, data: { id: req.params.id } });
});
