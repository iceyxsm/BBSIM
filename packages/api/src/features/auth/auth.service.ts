import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthPayload } from './auth.types.js';

export type { AuthPayload } from './auth.types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'qalgo-dev-secret-change-in-prod';

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'No token provided' });
    return;
  }

  try {
    const payload = verifyToken(header.slice(7));
    (req as any).auth = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

export function requireFirm(req: Request, res: Response, next: NextFunction) {
  const auth = (req as any).auth as AuthPayload;
  if (auth.role !== 'firm') {
    res.status(403).json({ success: false, error: 'Firm access required' });
    return;
  }
  next();
}
