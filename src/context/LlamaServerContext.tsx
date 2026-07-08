import { createContext, useContext, ReactNode } from 'react';
import { useSettingsContext } from './SettingsContext';
import { useLlamaServer } from '../hooks/useLlamaServer';

interface LlamaServerContextType {
  isRunning: boolean;
  pid: number | null;
  port: number | null;
  startServer: () => Promise<void>;
  stopServer: () => Promise<void>;
}

const LlamaServerContext = createContext<LlamaServerContextType | undefined>(undefined);

export function LlamaServerProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettingsContext();
  const server = useLlamaServer(settings);

  return (
    <LlamaServerContext.Provider value={server}>
      {children}
    </LlamaServerContext.Provider>
  );
}

export function useLlamaServerContext() {
  const context = useContext(LlamaServerContext);
  if (context === undefined) {
    throw new Error('useLlamaServerContext must be used within a LlamaServerProvider');
  }
  return context;
}
