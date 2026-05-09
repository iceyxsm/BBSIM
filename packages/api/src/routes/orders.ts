import { Router } from 'express';
import { nanoid } from 'nanoid';
import { getDb } from '../db/init.js';
import { authenticate } from '../middleware/auth.js';
import { executeOrder } from '../services/execution.js';
import { broadcast } from '../ws/index.js';
import type { AuthPayload } from '../middleware/auth.js';

export const ordersRouter = Router();
ordersRouter.use(authenticate);

// GET /api/orders
ordersRouter.get('/', (req, res) => {
  const auth = (req as any).auth as AuthPayload;
  const db = getDb();

  let orders;
  if (auth.role === 'firm') {
    orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200').all();
  } else {
    orders = db.prepare('SELECT * FROM orders WHERE trader_id = ? ORDER BY created_at DESC LIMIT 100').all(auth.traderId);
  }

  res.json({ success: true, data: orders });
});

// POST /api/orders
ordersRouter.post('/', (req, res) => {
  const auth = (req as any).auth as AuthPayload;
  const { symbol, side, type, quantity, price = 0 } = req.body;

  if (!symbol || !side || !type || !quantity) {
    res.status(400).json({ success: false, error: 'symbol, side, type, quantity required' });
    return;
  }

  const db = getDb();
  const id = nanoid();
  const now = Date.now();

  db.prepare(`
    INSERT INTO orders (id, trader_id, symbol, side, type, quantity, price, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
  `).run(id, auth.traderId, symbol, side, type, quantity, price, now, now);

  const order = { id, traderId: auth.traderId, symbol, side, type, quantity, price, filledQuantity: 0, filledPrice: 0, status: 'PENDING', createdAt: now, updatedAt: now };

  broadcast({ type: 'order:created', payload: order, timestamp: now });

  // Execute market orders immediately
  if (type === 'MARKET') {
    executeOrder(id, auth.traderId, symbol, side, quantity);
  }

  res.json({ success: true, data: order });
});

// DELETE /api/orders/:id
ordersRouter.delete('/:id', (req, res) => {
  const auth = (req as any).auth as AuthPayload;
  const db = getDb();
  const now = Date.now();

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  if (auth.role !== 'firm' && order.trader_id !== auth.traderId) {
    res.status(403).json({ success: false, error: 'Not your order' });
    return;
  }

  if (order.status !== 'PENDING' && order.status !== 'OPEN') {
    res.status(400).json({ success: false, error: 'Cannot cancel this order' });
    return;
  }

  db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run('CANCELLED', now, req.params.id);

  broadcast({ type: 'order:cancelled', payload: { id: req.params.id }, timestamp: now });
  res.json({ success: true, data: { id: req.params.id, status: 'CANCELLED' } });
});
