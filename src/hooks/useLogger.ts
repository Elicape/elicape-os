import { useState, useCallback } from 'react';

export interface LogEntry {
  id: string;
  type: 'info' | 'error' | 'success';
  message: string;
  timestamp: number;
}

export function useLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const log = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 11),
      message,
      type,
      timestamp: Date.now(),
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
    console.log(`[${type.toUpperCase()}] ${message}`);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { logs, log, clearLogs };
}
