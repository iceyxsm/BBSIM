import { useState } from 'react';
import { MarketWatch } from './components/MarketWatch';
import { OrderEntry } from './components/OrderEntry';
import { OrderBook } from './components/OrderBook';
import { Positions } from './components/Positions';
import { TradeHistory } from './components/TradeHistory';
import { ExchangeSelector } from './components/ExchangeSelector';
import { useMarketSimulator } from './hooks/useMarketSimulator';
import { useExchange } from './context/ExchangeContext';
import './App.css';

function AppContent() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const { exchange } = useExchange();

  // Start market feed based on selected exchange
  useMarketSimulator(exchange);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>BBSIM</h1>
          <span className="subtitle">Brokers Book Simulator</span>
        </div>
        <ExchangeSelector />
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

function App() {
  return <AppContent />;
}

export default App;
