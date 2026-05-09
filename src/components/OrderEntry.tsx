import { useState } from 'react';
import { useOrderExecution } from '../hooks/useOrderExecution';

interface OrderEntryProps {
  selectedSymbol: string | null;
}

export function OrderEntry({ selectedSymbol }: OrderEntryProps) {
  const { submitOrder } = useOrderExecution();
  const [quantity, setQuantity] = useState(100);
  const [price, setPrice] = useState(0);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');

  const handleSubmit = async (side: 'BUY' | 'SELL') => {
    if (!selectedSymbol) return;

    await submitOrder({
      symbol: selectedSymbol,
      side,
      quantity,
      price: orderType === 'MARKET' ? 0 : price,
      type: orderType,
    });
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
          <select value={orderType} onChange={(e) => setOrderType(e.target.value as 'MARKET' | 'LIMIT')}>
            <option value="MARKET">Market</option>
            <option value="LIMIT">Limit</option>
          </select>
        </div>
        <div className="field">
          <label>Quantity</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
        {orderType === 'LIMIT' && (
          <div className="field">
            <label>Price</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>
        )}
        <div className="order-buttons">
          <button className="btn-buy" onClick={() => handleSubmit('BUY')} disabled={!selectedSymbol}>
            BUY
          </button>
          <button className="btn-sell" onClick={() => handleSubmit('SELL')} disabled={!selectedSymbol}>
            SELL
          </button>
        </div>
      </div>
    </div>
  );
}
