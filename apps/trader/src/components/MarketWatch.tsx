import type { MarketTick } from '@bbsim/shared';

interface Props {
  data: MarketTick[];
  onSelect: (symbol: string) => void;
  selected: string | null;
}

export function MarketWatch({ data, onSelect, selected }: Props) {
  return (
    <div className="panel">
      <h2>Market Watch</h2>
      <table>
        <thead>
          <tr><th>Symbol</th><th>Bid</th><th>Ask</th><th>Last</th><th>Vol</th></tr>
        </thead>
        <tbody>
          {data.map((item: any) => (
            <tr key={item.symbol} className={selected === item.symbol ? 'selected' : ''} onClick={() => onSelect(item.symbol)}>
              <td className="symbol">{item.symbol}</td>
              <td className="bid">{Number(item.bid).toFixed(2)}</td>
              <td className="ask">{Number(item.ask).toFixed(2)}</td>
              <td className="last">{Number(item.last).toFixed(2)}</td>
              <td className="volume">{Number(item.volume).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
