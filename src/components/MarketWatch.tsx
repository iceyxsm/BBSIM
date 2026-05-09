import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

interface MarketWatchProps {
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string | null;
}

export function MarketWatch({ onSelectSymbol, selectedSymbol }: MarketWatchProps) {
  const marketData = useLiveQuery(() => db.marketData.toArray());

  if (!marketData) return <div className="panel">Loading market data...</div>;

  return (
    <div className="panel">
      <h2>Market Watch</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Bid</th>
            <th>Ask</th>
            <th>Last</th>
            <th>Volume</th>
          </tr>
        </thead>
        <tbody>
          {marketData.map((item) => (
            <tr
              key={item.symbol}
              className={selectedSymbol === item.symbol ? 'selected' : ''}
              onClick={() => onSelectSymbol(item.symbol)}
            >
              <td className="symbol">{item.symbol}</td>
              <td className="bid">{item.bid.toFixed(2)}</td>
              <td className="ask">{item.ask.toFixed(2)}</td>
              <td className="last">{item.last.toFixed(2)}</td>
              <td className="volume">{item.volume.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
