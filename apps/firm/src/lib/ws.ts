import type { WsMessage } from '@qalgo/shared';

type WsHandler = (msg: WsMessage) => void;

let socket: WebSocket | null = null;
let handlers: WsHandler[] = [];

export function connectWs(token: string) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

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
