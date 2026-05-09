import { useState } from 'react';
import { api } from '../lib/api';

interface Props {
  selectedSymbol: string | null;
  token: string;
  onOrderPlaced: () => void;
}

export function OrderEntry({ selectedSymbol, token, onOrderPlaced }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [price, setPrice] = useState(0);

  const handleSubmit = async (side: 'BUY' | 'SELL') => {
    if (!selectedSymbol) return;
    await api.post('/api/orders', {
      symbol: selectedSymbol,
      side,
      type: orderType,
      quantity,
      price: orderType === 'LIMIT' ? price : undefined,
    }, token);
    onOrderPlaced();
  };

  return (
    <div className="panel order-entry">
      <h2>Order Entry</h2>
      <div className="order-form">
        <div className="field">
          <label>Symbol</label>
          <input type="text" value={selectedSymbol || '—'} readOnly />
        </div>
        <div className="field">
          <label>Type</label>
          <select value={orderType} onChange={(e) => setOrderType(e.target.value as any)}>
            <option value="MARKET">Market</option>
            <option value="LIMIT">Limit</option>
          </select>
        </div>
        <div className="field">
          <label>Quantity</label>
          <input type="number" min={0.001} step="any" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        </div>
        {orderType === 'LIMIT' && (
          <div className="field">
            <label>Price</label>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </div>
        )}
        <div className="order-buttons">
          <button className="btn-buy" onClick={() => handleSubmit('BUY')} disabled={!selectedSymbol}>BUY</button>
          <button className="btn-sell" onClick={() => handleSubmit('SELL')} disabled={!selectedSymbol}>SELL</button>
        </div>
      </div>
    </div>
  );
}
