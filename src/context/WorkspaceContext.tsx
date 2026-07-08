import React, { createContext, useContext, useState, useCallback } from 'react';
import { LogEntry } from '../hooks/useLogger';

interface WorkspaceContextType {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  settingsPanelOpen: boolean;
  aboutDialogOpen: boolean;
  rootPath: string | null;
  logs: LogEntry[];
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleSettingsPanel: () => void;
  toggleAboutDialog: () => void;
  setRootPath: (path: string | null) => void;
  addLog: (message: string, type?: LogEntry['type']) => void;
  clearLogs: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const toggleLeftPanel = useCallback(() => setLeftPanelOpen((prev) => !prev), []);
  const toggleRightPanel = useCallback(() => setRightPanelOpen((prev) => !prev), []);
  const toggleSettingsPanel = useCallback(() => setSettingsPanelOpen((prev) => !prev), []);
  const toggleAboutDialog = useCallback(() => setAboutDialogOpen((prev) => !prev), []);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 11),
      message,
      type,
      timestamp: Date.now(),
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return (
    <WorkspaceContext.Provider
      value={{
        leftPanelOpen,
        rightPanelOpen,
        settingsPanelOpen,
        aboutDialogOpen,
        rootPath,
        logs,
        toggleLeftPanel,
        toggleRightPanel,
        toggleSettingsPanel,
        toggleAboutDialog,
        setRootPath,
        addLog,
        clearLogs,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspaceContext must be used within WorkspaceProvider');
  }
  return context;
}
