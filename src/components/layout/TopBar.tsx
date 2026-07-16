import { Settings, Trash2, Code2, Terminal, GitBranch, Server, Zap } from 'lucide-react';
import { useSettingsContext } from '../../context/SettingsContext';
import { useWorkspaceContext } from '../../context/WorkspaceContext';
import { useLlamaServerContext } from '../../context/LlamaServerContext';
import { MenuBar } from './MenuBar';
import { invoke } from '@tauri-apps/api/core';

interface TopBarProps {
  onClearChat: () => void;
  onOpenProject: () => void;
  onSaveFile: () => void;
  onCloseFile: (path: string) => void;
  currentFilePath?: string;
  onSaveSession: (name: string) => Promise<boolean>;
  onLoadSession: (path: string) => Promise<boolean>;
  rootPath: string | null;
  onOpenConfigGraph?: () => void;
}

export function TopBar({ 
  onClearChat, 
  onOpenProject, 
  onSaveFile,
  onCloseFile,
  currentFilePath,
  onSaveSession,
  onLoadSession,
  rootPath,
  onOpenConfigGraph
}: TopBarProps) {
  const { settings, updateSettings } = useSettingsContext();
  const { toggleSettingsPanel } = useWorkspaceContext();
  const { isRunning, startServer, stopServer } = useLlamaServerContext();

  return (
    <div className="flex flex-col flex-shrink-0">
      <MenuBar 
        onSaveFile={onSaveFile}
        onOpenProject={onOpenProject}
        onCloseFile={onCloseFile}
        currentFilePath={currentFilePath}
        onSaveSession={onSaveSession}
        onLoadSession={onLoadSession}
        onClearChat={onClearChat}
      />
      
      <div className="flex items-center justify-between px-6 py-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Code2 className="w-5 h-5 text-blue-400" />
          <h1 className="text-sm font-bold text-gray-100 whitespace-nowrap">ANTIGRAVITY</h1>
          
          {rootPath && (
            <div className="hidden md:block ml-4 px-2 py-0.5 bg-gray-800 rounded text-[10px] text-gray-400 truncate max-w-[200px]" title={rootPath}>
              {rootPath.split('/').pop()}
            </div>
          )}

          <button
            onClick={isRunning ? stopServer : startServer}
            className={`flex items-center gap-2 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
              isRunning 
                ? 'bg-green-600/20 text-green-400 border border-green-600/40 hover:bg-green-600/30' 
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-750'
            }`}
            title={isRunning ? 'Server is running' : 'Start llama-server'}
          >
            <Server className={`w-3 h-3 ${isRunning ? 'animate-pulse' : ''}`} />
            <span>{isRunning ? 'Online' : 'Offline'}</span>
            {isRunning && <Zap className="w-2.5 h-2.5 text-yellow-500 fill-current" />}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 text-[10px] text-gray-400 border-l border-gray-700 pl-4">
            <span className="bg-gray-800 px-1.5 py-0.5 rounded text-blue-300 font-mono">{settings.modelName}</span>
            <span className="text-gray-600">•</span>
            <button
              onClick={() => {
                const next = settings.agentMode === 'plan' ? 'apply' : 'plan';
                updateSettings({ agentMode: next });
              }}
              className={`px-1.5 py-0.5 rounded font-mono cursor-pointer transition-colors ${
                settings.agentMode === 'plan'
                  ? 'bg-yellow-800/30 text-yellow-400 hover:bg-yellow-800/40'
                  : 'bg-green-800/30 text-green-400 hover:bg-green-800/40'
              }`}
              title={`Click to switch to ${settings.agentMode === 'plan' ? 'APPLY' : 'PLAN'} mode`}
            >
              {settings.agentMode.toUpperCase()} MODE
            </button>
          </div>

          <div className="flex items-center gap-1">
            {settings.agentMode === 'shell' && (
              <button
                onClick={() => (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__TAURI__ && invoke('launch_wezterm_cage')
)}
                className="p-1.5 rounded hover:bg-gray-800 transition-colors text-yellow-400 hover:text-yellow-300"
                title="Open Wezterm Console"
              >
                <Terminal className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClearChat}
              className="p-1.5 rounded hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-200"
              title="Clear chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {onOpenConfigGraph && (
              <button
                onClick={onOpenConfigGraph}
                className="p-1.5 rounded hover:bg-gray-800 transition-colors text-purple-400 hover:text-purple-300"
                title="Config Graph"
              >
                <GitBranch className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={toggleSettingsPanel}
              className="p-1.5 rounded hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-200"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
