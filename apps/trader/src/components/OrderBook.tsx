import { api } from '../lib/api';

interface Props {
  data: any[];
  token: string;
  onCancel: () => void;
}

export function OrderBook({ data, token, onCancel }: Props) {
  const handleCancel = async (id: string) => {
    await api.delete(`/api/orders/${id}`, token);
    onCancel();
  };

  return (
    <div className="panel">
      <h2>Orders</h2>
      {data.length === 0 ? (
        <p className="empty">No orders</p>
      ) : (
        <table>
          <thead>
            <tr><th>Time</th><th>Symbol</th><th>Side</th><th>Type</th><th>Qty</th><th>Price</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {data.map((order: any) => (
              <tr key={order.id}>
                <td>{new Date(order.created_at).toLocaleTimeString()}</td>
                <td className="symbol">{order.symbol}</td>
                <td className={order.side === 'BUY' ? 'buy-side' : 'sell-side'}>{order.side}</td>
                <td>{order.type}</td>
                <td>{order.quantity}</td>
                <td>{order.filled_price > 0 ? Number(order.filled_price).toFixed(2) : '—'}</td>
                <td className={`status-${order.status.toLowerCase()}`}>{order.status}</td>
                <td>
                  {(order.status === 'PENDING' || order.status === 'OPEN') && (
                    <button className="btn-cancel" onClick={() => handleCancel(order.id)}>✕</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
