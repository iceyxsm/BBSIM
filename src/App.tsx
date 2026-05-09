import { useState } from 'react';
import { MarketWatch } from './components/MarketWatch';
import { OrderEntry } from './components/OrderEntry';
import { OrderBook } from './components/OrderBook';
import { Positions } from './components/Positions';
import { TradeHistory } from './components/TradeHistory';
import { useMarketSimulator } from './hooks/useMarketSimulator';
import './App.css';

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // Start market simulation (ticks every 800ms)
  useMarketSimulator(800);

  return (
    <div className="app">
      <header className="app-header">
        <h1>BBSIM</h1>
        <span className="subtitle">Brokers Book Simulator</span>
      </header>
      <main className="app-grid">
        <div className="col-left">
          <MarketWatch onSelectSymbol={setSelectedSymbol} selectedSymbol={selectedSymbol} />
          <OrderEntry selectedSymbol={selectedSymbol} />
        </div>
        <div className="col-right">
          <Positions />
          <OrderBook />
          <TradeHistory />
        </div>
      </main>
    </div>
  );
}

export default App;
