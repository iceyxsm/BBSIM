export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// WebSocket message types
export type WsMessageType =
  | 'market:tick'
  | 'order:created'
  | 'order:updated'
  | 'order:filled'
  | 'order:cancelled'
  | 'position:updated'
  | 'trade:executed'
  | 'alert:risk';

export interface WsMessage<T = unknown> {
  type: WsMessageType;
  payload: T;
  timestamp: number;
}
