interface Props {
  positions: any[];
}

export function AllPositions({ positions }: Props) {
  return (
    <div className="panel">
      <h2>All Positions</h2>
      {positions.length === 0 ? (
        <p className="empty">No open positions</p>
      ) : (
        <table>
          <thead>
            <tr><th>Trader</th><th>Symbol</th><th>Qty</th><th>Entry</th><th>Current</th><th>Unrealized</th></tr>
          </thead>
          <tbody>
            {positions.map((pos: any) => (
              <tr key={pos.id}>
                <td>{pos.trader_id.slice(0, 8)}</td>
                <td className="symbol">{pos.symbol}</td>
                <td>{pos.quantity}</td>
                <td>{Number(pos.avg_entry_price).toFixed(2)}</td>
                <td>{Number(pos.current_price).toFixed(2)}</td>
                <td className={pos.unrealized_pnl >= 0 ? 'profit' : 'loss'}>
                  {pos.unrealized_pnl >= 0 ? '+' : ''}{Number(pos.unrealized_pnl).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
