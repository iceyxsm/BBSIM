import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export function Positions() {
  const positions = useLiveQuery(() => db.positions.toArray());

  if (!positions) return <div className="panel">Loading positions...</div>;

  const totalUnrealized = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  const totalRealized = positions.reduce((sum, p) => sum + p.realizedPnl, 0);

  return (
    <div className="panel">
      <h2>Positions</h2>
      {positions.length === 0 ? (
        <p className="empty">No open positions</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Qty</th>
                <th>Avg Entry</th>
                <th>Current</th>
                <th>Unrealized P&L</th>
                <th>Realized P&L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr key={pos.id}>
                  <td className="symbol">{pos.symbol}</td>
                  <td>{pos.quantity}</td>
                  <td>{pos.avgEntryPrice.toFixed(2)}</td>
                  <td>{pos.currentPrice.toFixed(2)}</td>
                  <td className={pos.unrealizedPnl >= 0 ? 'profit' : 'loss'}>
                    {pos.unrealizedPnl >= 0 ? '+' : ''}{pos.unrealizedPnl.toFixed(2)}
                  </td>
                  <td className={pos.realizedPnl >= 0 ? 'profit' : 'loss'}>
                    {pos.realizedPnl >= 0 ? '+' : ''}{pos.realizedPnl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="totals">
            <span className={totalUnrealized >= 0 ? 'profit' : 'loss'}>
              Unrealized: {totalUnrealized >= 0 ? '+' : ''}{totalUnrealized.toFixed(2)}
            </span>
            <span className={totalRealized >= 0 ? 'profit' : 'loss'}>
              Realized: {totalRealized >= 0 ? '+' : ''}{totalRealized.toFixed(2)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
