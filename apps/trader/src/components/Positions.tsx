interface Props {
  data: any[];
}

export function Positions({ data }: Props) {
  const totalUnrealized = data.reduce((s, p) => s + (p.unrealized_pnl || 0), 0);
  const totalRealized = data.reduce((s, p) => s + (p.realized_pnl || 0), 0);

  return (
    <div className="panel">
      <h2>Positions</h2>
      {data.length === 0 ? (
        <p className="empty">No open positions</p>
      ) : (
        <>
          <table>
            <thead>
              <tr><th>Symbol</th><th>Qty</th><th>Avg Entry</th><th>Current</th><th>Unrealized</th><th>Realized</th></tr>
            </thead>
            <tbody>
              {data.map((pos: any) => (
                <tr key={pos.id}>
                  <td className="symbol">{pos.symbol}</td>
                  <td>{pos.quantity}</td>
                  <td>{Number(pos.avg_entry_price).toFixed(2)}</td>
                  <td>{Number(pos.current_price).toFixed(2)}</td>
                  <td className={pos.unrealized_pnl >= 0 ? 'profit' : 'loss'}>{pos.unrealized_pnl >= 0 ? '+' : ''}{Number(pos.unrealized_pnl).toFixed(2)}</td>
                  <td className={pos.realized_pnl >= 0 ? 'profit' : 'loss'}>{pos.realized_pnl >= 0 ? '+' : ''}{Number(pos.realized_pnl).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="totals">
            <span className={totalUnrealized >= 0 ? 'profit' : 'loss'}>Unrealized: {totalUnrealized >= 0 ? '+' : ''}{totalUnrealized.toFixed(2)}</span>
            <span className={totalRealized >= 0 ? 'profit' : 'loss'}>Realized: {totalRealized >= 0 ? '+' : ''}{totalRealized.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  );
}
