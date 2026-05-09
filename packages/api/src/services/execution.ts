import { nanoid } from 'nanoid';
import { getDb } from '../db/init.js';
import { broadcast } from '../ws/index.js';

export function executeOrder(orderId: string, traderId: string, symbol: string, side: string, quantity: number) {
  const db = getDb();
  const market = db.prepare('SELECT * FROM market_data WHERE symbol = ?').get(symbol) as any;

  if (!market || market.last === 0) {
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run('REJECTED', Date.now(), orderId);
    return;
  }

  const execPrice = side === 'BUY' ? market.ask : market.bid;
  const now = Date.now();

  // Update order
  db.prepare('UPDATE orders SET status = ?, filled_quantity = ?, filled_price = ?, updated_at = ? WHERE id = ?')
    .run('FILLED', quantity, execPrice, now, orderId);

  // Update position
  const existingPos = db.prepare('SELECT * FROM positions WHERE trader_id = ? AND symbol = ?').get(traderId, symbol) as any;
  let pnl = 0;

  if (existingPos) {
    if (side === 'BUY') {
      const totalCost = existingPos.avg_entry_price * existingPos.quantity + execPrice * quantity;
      const newQty = existingPos.quantity + quantity;
      db.prepare('UPDATE positions SET quantity = ?, avg_entry_price = ?, current_price = ?, updated_at = ? WHERE id = ?')
        .run(newQty, totalCost / newQty, execPrice, now, existingPos.id);
    } else {
      // SELL — realize P&L
      pnl = +((execPrice - existingPos.avg_entry_price) * quantity).toFixed(2);
      const newQty = existingPos.quantity - quantity;

      if (newQty <= 0) {
        db.prepare('DELETE FROM positions WHERE id = ?').run(existingPos.id);
      } else {
        db.prepare('UPDATE positions SET quantity = ?, realized_pnl = ?, current_price = ?, updated_at = ? WHERE id = ?')
          .run(newQty, existingPos.realized_pnl + pnl, execPrice, now, existingPos.id);
      }
    }
  } else {
    const posId = nanoid();
    const qty = side === 'BUY' ? quantity : -quantity;
    db.prepare('INSERT INTO positions (id, trader_id, symbol, quantity, avg_entry_price, current_price, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(posId, traderId, symbol, qty, execPrice, execPrice, now);
  }

  // Record trade
  const tradeId = nanoid();
  db.prepare('INSERT INTO trades (id, order_id, trader_id, symbol, side, quantity, price, pnl, executed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(tradeId, orderId, traderId, symbol, side, quantity, execPrice, pnl, now);

  broadcast({ type: 'order:filled', payload: { orderId, traderId, symbol, side, quantity, price: execPrice, pnl }, timestamp: now });
  broadcast({ type: 'trade:executed', payload: { id: tradeId, orderId, traderId, symbol, side, quantity, price: execPrice, pnl, executedAt: now }, timestamp: now });
}
