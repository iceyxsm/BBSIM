import { WebSocketServer, WebSocket } from 'ws';
import type { WsMessage } from '@qalgo/shared';
import { verifyToken } from '../../features/auth/auth.service.js';

const clients = new Set<WebSocket>();

export function setupWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws, req) => {
    clients.add(ws);
    console.log(`[WS] Client connected (${clients.size} total)`);

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WS] Client disconnected (${clients.size} total)`);
    });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        // Handle auth or subscription messages from clients
        if (msg.type === 'auth') {
          try {
            const payload = verifyToken(msg.token);
            (ws as any).auth = payload;
          } catch {
            ws.send(JSON.stringify({ type: 'error', payload: 'Invalid token' }));
          }
        }
      } catch { /* skip */ }
    });
  });
}

export function broadcast(message: WsMessage) {
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}
