import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { WorkspaceSettings } from '../types/index';
import { useWorkspaceContext } from '../context/WorkspaceContext';

export function useLlamaServer(settings: WorkspaceSettings) {
  const [isRunning, setIsRunning] = useState(false);
  const [pid, setPid] = useState<number | null>(null);
  const { addLog } = useWorkspaceContext();

  const stopServer = useCallback(async () => {
    try {
      addLog('Stopping llama-server...', 'info');
      await invoke('stop_server');
      setIsRunning(false);
      setPid(null);
      addLog('llama-server stopped', 'success');
    } catch (error) {
      addLog(`Failed to stop server: ${error}`, 'error');
    }
  }, [addLog]);

  const startServer = useCallback(async () => {
    try {
      const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
      if (!isTauri) {
        addLog('Cannot start llama-server: You are running in Web Mode. Please launch the desktop app using "npm run tauri dev".', 'error');
        return;
      }

      if (isRunning) {
        await stopServer();
      }

      addLog(`Starting llama-server from ${settings.binaryPath}...`, 'info');
      
      const args = [
        '-m', settings.modelPath || '',
        '--port', (settings.serverPort || 11434).toString(),
        '--chat-template-file', settings.templatePath || '',
        '--jinja',
        ...(settings.serverArgs || '').split(' ').filter((a: string) => a.trim() !== '')
      ];

      addLog(`Command: ${settings.binaryPath} ${args.join(' ')}`, 'info');

      const serverPid = await invoke<number>('start_server', {
        binaryPath: settings.binaryPath,
        args
      });

      setPid(serverPid);
      setIsRunning(true);
      addLog(`llama-server started successfully (PID: ${serverPid})`, 'success');

    } catch (error) {
      addLog(`Failed to start llama-server: ${error}`, 'error');
      setIsRunning(false);
      setPid(null);
    }
  }, [isRunning, settings, stopServer, addLog]);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    
    const setupListener = async () => {
      unlisten = await listen<string>('server-log', (event) => {
        addLog(`[llama-server] ${event.payload}`, 'info');
      });
    };

    setupListener();

    if (settings.autoStartServer && !isRunning) {
      startServer();
    }
    
    return () => {
      if (unlisten) unlisten();
    };
  }, [addLog, settings.autoStartServer, isRunning, startServer]);

  return {
    isRunning,
    pid,
    port: settings.serverPort || 11434,
    startServer,
    stopServer
  };
}
