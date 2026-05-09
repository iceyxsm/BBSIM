import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export function OrderBook() {
  const orders = useLiveQuery(() => db.orders.orderBy('createdAt').reverse().toArray());

  if (!orders) return <div className="panel">Loading orders...</div>;

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString();

  return (
    <div className="panel">
      <h2>Order Book</h2>
      {orders.length === 0 ? (
        <p className="empty">No orders placed</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Symbol</th>
              <th>Side</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className={`order-${order.status.toLowerCase()}`}>
                <td>{formatTime(order.createdAt)}</td>
                <td className="symbol">{order.symbol}</td>
                <td className={order.side === 'BUY' ? 'buy-side' : 'sell-side'}>{order.side}</td>
                <td>{order.type}</td>
                <td>{order.quantity}</td>
                <td>{order.filledPrice > 0 ? order.filledPrice.toFixed(2) : '—'}</td>
                <td className={`status-${order.status.toLowerCase()}`}>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
