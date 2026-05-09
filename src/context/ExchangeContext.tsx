import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ExchangeId } from '../providers';

interface ExchangeContextValue {
  exchange: ExchangeId;
  setExchange: (id: ExchangeId) => void;
}

const ExchangeContext = createContext<ExchangeContextValue>({
  exchange: 'simulated',
  setExchange: () => {},
});

export function ExchangeProvider({ children }: { children: ReactNode }) {
  const [exchange, setExchangeState] = useState<ExchangeId>('simulated');

  const setExchange = useCallback((id: ExchangeId) => {
    setExchangeState(id);
  }, []);

  return (
    <ExchangeContext.Provider value={{ exchange, setExchange }}>
      {children}
    </ExchangeContext.Provider>
  );
}

export function useExchange() {
  return useContext(ExchangeContext);
}
