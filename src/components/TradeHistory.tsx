import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export function TradeHistory() {
  const trades = useLiveQuery(() => db.trades.orderBy('executedAt').reverse().toArray());

  if (!trades) return <div className="panel">Loading trades...</div>;

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString();

  return (
    <div className="panel">
      <h2>Trade History</h2>
      {trades.length === 0 ? (
        <p className="empty">No trades executed</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Symbol</th>
              <th>Side</th>
              <th>Qty</th>
              <th>Price</th>
              <th>P&L</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id}>
                <td>{formatTime(trade.executedAt)}</td>
                <td className="symbol">{trade.symbol}</td>
                <td className={trade.side === 'BUY' ? 'buy-side' : 'sell-side'}>{trade.side}</td>
                <td>{trade.quantity}</td>
                <td>{trade.price.toFixed(2)}</td>
                <td className={trade.pnl >= 0 ? 'profit' : 'loss'}>
                  {trade.pnl !== 0 ? (trade.pnl >= 0 ? '+' : '') + trade.pnl.toFixed(2) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
