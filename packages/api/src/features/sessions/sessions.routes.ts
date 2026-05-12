import { Router } from 'express';
import { getDb } from '../../shared/db/index.js';
import { authenticate } from '../auth/auth.service.js';
import { startRecording, stopRecording, isRecording, getActiveSessionId } from './sessions.recorder.js';
import { startReplay, stopReplay, setReplaySpeed, getReplayState } from './sessions.replay.js';
import { getActiveExchange } from '../market/market.service.js';

export const sessionsRouter = Router();
sessionsRouter.use(authenticate);

// GET /api/sessions — list all sessions
sessionsRouter.get('/', (_req, res) => {
  const db = getDb();
  const sessions = db.prepare('SELECT * FROM sessions ORDER BY started_at DESC').all();
  res.json({ success: true, data: sessions });
});

// GET /api/sessions/status — current recording/replay state
sessionsRouter.get('/status', (_req, res) => {
  const replay = getReplayState();
  res.json({
    success: true,
    data: {
      isRecording: isRecording(),
      activeSessionId: getActiveSessionId(),
      ...replay,
    },
  });
});

// POST /api/sessions/record — start recording
sessionsRouter.post('/record', (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ success: false, error: 'Session name required' });
    return;
  }

  const exchange = getActiveExchange();
  const sessionId = startRecording(name, exchange);
  res.json({ success: true, data: { sessionId, name, exchange } });
});

// POST /api/sessions/stop — stop recording
sessionsRouter.post('/stop', (_req, res) => {
  const sessionId = stopRecording();
  if (!sessionId) {
    res.status(400).json({ success: false, error: 'No active recording' });
    return;
  }
  res.json({ success: true, data: { sessionId } });
});

// POST /api/sessions/:id/replay — start replay
sessionsRouter.post('/:id/replay', (req, res) => {
  const { speed = 1, startOffsetMs = 0 } = req.body;

  const success = startReplay({
    sessionId: req.params.id,
    speed,
    startOffsetMs,
  });

  if (!success) {
    res.status(400).json({ success: false, error: 'Cannot replay this session' });
    return;
  }

  res.json({ success: true, data: { sessionId: req.params.id, speed } });
});

// POST /api/sessions/replay/stop — stop replay
sessionsRouter.post('/replay/stop', (_req, res) => {
  stopReplay();
  res.json({ success: true });
});

// POST /api/sessions/replay/speed — change replay speed
sessionsRouter.post('/replay/speed', (req, res) => {
  const { speed } = req.body;
  if (!speed || speed <= 0) {
    res.status(400).json({ success: false, error: 'Valid speed required (> 0)' });
    return;
  }
  setReplaySpeed(speed);
  res.json({ success: true, data: { speed } });
});

// DELETE /api/sessions/:id — delete a session
sessionsRouter.delete('/:id', (req, res) => {
  const db = getDb();
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id) as any;

  if (!session) {
    res.status(404).json({ success: false, error: 'Session not found' });
    return;
  }

  if (session.status === 'recording' || session.status === 'replaying') {
    res.status(400).json({ success: false, error: 'Cannot delete active session' });
    return;
  }

  db.prepare('DELETE FROM session_ticks WHERE session_id = ?').run(req.params.id);
  db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);

  res.json({ success: true });
});
