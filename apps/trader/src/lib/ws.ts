import type { WsMessage } from '@bbsim/shared';
import { getBaseUrl } from './api';

type WsHandler = (msg: WsMessage) => void;

let socket: WebSocket | null = null;
let handlers: WsHandler[] = [];

export function connectWs(token: string) {
  const baseUrl = getBaseUrl();
  let wsUrl: string;

  if (baseUrl) {
    // Remote server — construct WS URL from base
    const url = new URL(baseUrl);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    wsUrl = `${protocol}//${url.host}/ws`;
  } else {
    // Dev mode — use current host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsUrl = `${protocol}//${window.location.host}/ws`;
  }

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    socket?.send(JSON.stringify({ type: 'auth', token }));
  };

  socket.onmessage = (event) => {
    try {
      const msg: WsMessage = JSON.parse(event.data);
      handlers.forEach((h) => h(msg));
    } catch { /* skip */ }
  };

  socket.onclose = () => {
    setTimeout(() => connectWs(token), 3000);
  };
}

export function onWsMessage(handler: WsHandler) {
  handlers.push(handler);
  return () => { handlers = handlers.filter((h) => h !== handler); };
}

export function disconnectWs() {
  socket?.close();
  socket = null;
  handlers = [];
}
