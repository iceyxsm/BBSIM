import { EXCHANGES } from '../providers';
import { useExchange } from '../context/ExchangeContext';

export function ExchangeSelector() {
  const { exchange, setExchange } = useExchange();

  return (
    <div className="exchange-selector">
      <label htmlFor="exchange-select">Exchange</label>
      <select
        id="exchange-select"
        value={exchange}
        onChange={(e) => setExchange(e.target.value as typeof exchange)}
      >
        {EXCHANGES.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}{ex.requiresBridge ? ' ⚡' : ''}
          </option>
        ))}
      </select>
      <span className="exchange-desc">
        {EXCHANGES.find((e) => e.id === exchange)?.description}
      </span>
    </div>
  );
}
