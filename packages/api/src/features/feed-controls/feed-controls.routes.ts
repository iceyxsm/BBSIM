import { Router } from 'express';
import { authenticate, requireFirm } from '../auth/auth.service.js';
import {
  getControls,
  setControls,
  getSymbolOverrides,
  setSymbolOverride,
  removeSymbolOverride,
} from '../market/market.feed-filter.js';

export const feedControlsRouter = Router();
feedControlsRouter.use(authenticate);
feedControlsRouter.use(requireFirm);

// GET /api/feed-controls — get current settings
feedControlsRouter.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      controls: getControls(),
      overrides: getSymbolOverrides(),
    },
  });
});

// PATCH /api/feed-controls — update global settings
feedControlsRouter.patch('/', (req, res) => {
  const updated = setControls(req.body);
  res.json({ success: true, data: updated });
});

// POST /api/feed-controls/enable — enable manipulation
feedControlsRouter.post('/enable', (_req, res) => {
  const updated = setControls({ enabled: true });
  res.json({ success: true, data: updated });
});

// POST /api/feed-controls/disable — disable manipulation (pass-through)
feedControlsRouter.post('/disable', (_req, res) => {
  const updated = setControls({ enabled: false });
  res.json({ success: true, data: updated });
});

// GET /api/feed-controls/overrides — list per-symbol overrides
feedControlsRouter.get('/overrides', (_req, res) => {
  res.json({ success: true, data: getSymbolOverrides() });
});

// PUT /api/feed-controls/overrides/:symbol — set per-symbol override
feedControlsRouter.put('/overrides/:symbol', (req, res) => {
  const symbol = req.params.symbol;
  setSymbolOverride({ symbol, ...req.body });
  res.json({ success: true, data: { symbol, ...req.body } });
});

// DELETE /api/feed-controls/overrides/:symbol — remove per-symbol override
feedControlsRouter.delete('/overrides/:symbol', (req, res) => {
  removeSymbolOverride(req.params.symbol);
  res.json({ success: true });
});
