interface Props {
  data: any[];
}

export function TradeHistory({ data }: Props) {
  return (
    <div className="panel">
      <h2>Trade History</h2>
      {data.length === 0 ? (
        <p className="empty">No trades</p>
      ) : (
        <table>
          <thead>
            <tr><th>Time</th><th>Symbol</th><th>Side</th><th>Qty</th><th>Price</th><th>P&L</th></tr>
          </thead>
          <tbody>
            {data.map((trade: any) => (
              <tr key={trade.id}>
                <td>{new Date(trade.executed_at).toLocaleTimeString()}</td>
                <td className="symbol">{trade.symbol}</td>
                <td className={trade.side === 'BUY' ? 'buy-side' : 'sell-side'}>{trade.side}</td>
                <td>{trade.quantity}</td>
                <td>{Number(trade.price).toFixed(2)}</td>
                <td className={trade.pnl >= 0 ? 'profit' : 'loss'}>
                  {trade.pnl !== 0 ? (trade.pnl >= 0 ? '+' : '') + Number(trade.pnl).toFixed(2) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
