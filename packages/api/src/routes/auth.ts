import { Router } from 'express';
import { nanoid } from 'nanoid';
import { getDb } from '../db/init.js';
import { signToken, authenticate } from '../middleware/auth.js';
import type { AuthPayload } from '../middleware/auth.js';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password required' });
    return;
  }

  const db = getDb();
  const trader = db.prepare('SELECT * FROM traders WHERE email = ?').get(email) as any;

  if (!trader || trader.password_hash !== password) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  if (!trader.is_active) {
    res.status(403).json({ success: false, error: 'Account disabled' });
    return;
  }

  const token = signToken({ traderId: trader.id, role: trader.role });
  res.json({
    success: true,
    data: {
      token,
      trader: {
        id: trader.id,
        name: trader.name,
        email: trader.email,
        role: trader.role,
        maxPositionSize: trader.max_position_size,
        maxDailyLoss: trader.max_daily_loss,
        isActive: !!trader.is_active,
        createdAt: trader.created_at,
      },
    },
  });
});

// POST /api/auth/register (firm only can create traders)
authRouter.post('/register', authenticate, (req, res) => {
  const auth = (req as any).auth as AuthPayload;
  if (auth.role !== 'firm') {
    res.status(403).json({ success: false, error: 'Only firm can register traders' });
    return;
  }

  const { name, email, password, role = 'trader', maxPositionSize = 100000, maxDailyLoss = 5000 } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ success: false, error: 'Name, email, and password required' });
    return;
  }

  const db = getDb();
  const id = nanoid();
  const now = Date.now();

  try {
    db.prepare(`
      INSERT INTO traders (id, name, email, password_hash, role, max_position_size, max_daily_loss, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, email, password, role, maxPositionSize, maxDailyLoss, now);

    res.json({
      success: true,
      data: { id, name, email, role, maxPositionSize, maxDailyLoss, isActive: true, createdAt: now },
    });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      res.status(409).json({ success: false, error: 'Email already exists' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create trader' });
    }
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticate, (req, res) => {
  const auth = (req as any).auth as AuthPayload;
  const db = getDb();
  const trader = db.prepare('SELECT * FROM traders WHERE id = ?').get(auth.traderId) as any;

  if (!trader) {
    res.status(404).json({ success: false, error: 'Trader not found' });
    return;
  }

  res.json({
    success: true,
    data: {
      id: trader.id,
      name: trader.name,
      email: trader.email,
      role: trader.role,
      maxPositionSize: trader.max_position_size,
      maxDailyLoss: trader.max_daily_loss,
      isActive: !!trader.is_active,
      createdAt: trader.created_at,
    },
  });
});
