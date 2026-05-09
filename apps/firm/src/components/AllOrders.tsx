interface Props {
  orders: any[];
}

export function AllOrders({ orders }: Props) {
  return (
    <div className="panel">
      <h2>All Orders</h2>
      {orders.length === 0 ? (
        <p className="empty">No orders</p>
      ) : (
        <table>
          <thead>
            <tr><th>Time</th><th>Trader</th><th>Symbol</th><th>Side</th><th>Qty</th><th>Status</th></tr>
          </thead>
          <tbody>
            {orders.slice(0, 50).map((order: any) => (
              <tr key={order.id}>
                <td>{new Date(order.created_at).toLocaleTimeString()}</td>
                <td>{order.trader_id.slice(0, 8)}</td>
                <td className="symbol">{order.symbol}</td>
                <td className={order.side === 'BUY' ? 'buy-side' : 'sell-side'}>{order.side}</td>
                <td>{order.quantity}</td>
                <td className={`status-${order.status.toLowerCase()}`}>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
