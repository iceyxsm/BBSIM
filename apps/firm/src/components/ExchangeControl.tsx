import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { EXCHANGES } from '@qalgo/shared';

interface Props {
  token: string;
}

export function ExchangeControl({ token }: Props) {
  const [exchange, setExchange] = useState('simulated');

  useEffect(() => {
    api.get('/api/market/exchange', token).then((res) => {
      if (res.success) setExchange(res.data.exchange);
    });
  }, [token]);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newExchange = e.target.value;
    setExchange(newExchange);
    await api.post('/api/market/exchange', { exchange: newExchange }, token);
  };

  return (
    <div className="exchange-control">
      <label>Feed:</label>
      <select value={exchange} onChange={handleChange}>
        {EXCHANGES.map((ex) => (
          <option key={ex.id} value={ex.id}>{ex.name}</option>
        ))}
      </select>
    </div>
  );
}
