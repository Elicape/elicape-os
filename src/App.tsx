import { useState, useEffect, useCallback, useRef } from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { WorkspaceProvider, useWorkspaceContext } from './context/WorkspaceContext';
import { LlamaServerProvider } from './context/LlamaServerContext';
import { Workspace } from './components/layout/Workspace';
import { Hud } from './components/layout/Hud';
import { RepoPicker } from './components/RepoPicker';
import { ConfigGraph } from './components/ConfigGraph';
import { runIntegrityChecks, IntegrityReport } from './lib/integrity';
import { getActiveRepo } from './lib/repo/activeRepo';
import { useLlamaServerContext } from './context/LlamaServerContext';

function AppShell() {
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isStartingLlama, setIsStartingLlama] = useState(false);
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [showConfigGraph, setShowConfigGraph] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const { setRootPath, addLog } = useWorkspaceContext();
  const { checkLlamaServer, startManagedServer } = useLlamaServerContext();
  const startingRef = useRef(false);

  const runChecks = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await runIntegrityChecks();
      setReport(result);
      addLog(`Integrity checks: ${result.allOk ? 'ALL OK' : `${result.failedCritical.length} critical failures`}`, result.allOk ? 'success' : 'error');
    } catch (err) {
      setReport({
        allOk: false,
        checks: [{ id: 'runtime_error', passed: false, message: `Error: ${err}`, on_fail: 'abort' }],
        failedCritical: [{ id: 'runtime_error', passed: false, message: `Error: ${err}`, on_fail: 'abort' }],
        hasDegraded: false,
      });
    }
    setIsChecking(false);
  }, [addLog]);

  const tryStartLlama = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    setIsStartingLlama(true);
    try {
      const result = await startManagedServer();
      addLog(`llama-server: ${result}`, 'success');
      // Wait for health with polling
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const healthy = await checkLlamaServer();
        if (healthy) {
          addLog('llama-server healthy on :8080', 'success');
          setIsStartingLlama(false);
          startingRef.current = false;
          await runChecks();
          return;
        }
      }
      addLog('llama-server did not become healthy after 30s', 'error');
      setIsStartingLlama(false);
      startingRef.current = false;
      await runChecks();
    } catch (err) {
      addLog(`Failed to start llama-server: ${err}`, 'error');
      setIsStartingLlama(false);
      startingRef.current = false;
      await runChecks();
    }
  }, [startManagedServer, checkLlamaServer, addLog, runChecks]);

  useEffect(() => {
    const init = async () => {
      await runChecks();
      // If health check failed and we're in Tauri, auto-start
      const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
      if (isTauri) {
        const healthy = await checkLlamaServer();
        if (!healthy) {
          tryStartLlama();
        }
      }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load existing repo via unified getActiveRepo (bypasses plugin-fs scope)
  useEffect(() => {
    const loadRepo = async () => {
      const repoPath = await getActiveRepo();
      if (repoPath) {
        setRootPath(repoPath);
      }
    };
    loadRepo();

    // Listen for repo-changed events from Rust save_active_repo
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
    let unlisten: (() => void) | undefined;
    if (isTauri) {
      (async () => {
        const { listen } = await import('@tauri-apps/api/event');
        unlisten = await listen<string>('repo-changed', (event) => {
          setRootPath(event.payload);
          runChecks();
        });
      })();
    }
    return () => { unlisten?.(); };
  }, [setRootPath, runChecks]);

  const handleOpenRepo = () => setShowRepoPicker(true);
  const handleRepoSelected = async (path: string) => {
    setRootPath(path);
    setShowRepoPicker(false);
    await runChecks();
  };
  const handleEnterApp = () => setAppReady(true);
  const handleOpenSettings = () => setShowConfigGraph(true);
  const handleOpenTerminal = () => {
    addLog('Terminal: usar LaunchWezterm', 'info');
  };
  const handleRetryStart = () => {
    tryStartLlama();
  };

  if (isStartingLlama) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4" />
        <p className="text-lg text-gray-400">Iniciando motor local...</p>
        <p className="text-sm text-gray-500 mt-2">Esperando a que el servidor LLM responda en :8080</p>
        <button
          onClick={handleRetryStart}
          className="mt-6 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (showConfigGraph) {
    return (
      <ConfigGraph
        onClose={() => {
          setShowConfigGraph(false);
          runChecks();
        }}
      />
    );
  }

  if (showRepoPicker) {
    return <RepoPicker onRepoSelected={handleRepoSelected} />;
  }

  if (!appReady) {
    return (
      <Hud
        report={report}
        isChecking={isChecking}
        onOpenRepo={handleOpenRepo}
        onRetry={runChecks}
        onOpenSettings={handleOpenSettings}
        onEnterApp={handleEnterApp}
        onOpenTerminal={handleOpenTerminal}
        onRetryStart={handleRetryStart}
      />
    );
  }

  return <Workspace onOpenConfigGraph={() => setShowConfigGraph(true)} />;
}

function App() {
  return (
    <SettingsProvider>
      <WorkspaceProvider>
        <LlamaServerProvider>
          <AppShell />
        </LlamaServerProvider>
      </WorkspaceProvider>
    </SettingsProvider>
  );
}

export default App;
