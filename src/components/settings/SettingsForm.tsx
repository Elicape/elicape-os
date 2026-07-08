import { WorkspaceSettings, WritePermissionMode } from '../../types/index';
import { useLlamaServerContext } from '../../context/LlamaServerContext';
import { Play, Square, FolderOpen, FileSearch, Code2 } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';

interface SettingsFormProps {
  settings: WorkspaceSettings;
  onChange: (updates: Partial<WorkspaceSettings>) => void;
}

const PERMISSION_MODES: { value: WritePermissionMode; label: string }[] = [
  { value: 'ask', label: 'Ask for each file' },
  { value: 'allow', label: 'Always allow' },
  { value: 'deny', label: 'Never allow' },
];

export function SettingsForm({ settings, onChange }: SettingsFormProps) {
  const { isRunning, startServer, stopServer } = useLlamaServerContext();

  return (
    <div className="space-y-6">
      {/* LLM Configuration */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">LLM Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              API Endpoint
            </label>
            <input
              type="text"
              value={settings.endpoint}
              onChange={(e) => onChange({ endpoint: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
              placeholder="http://localhost:11434/v1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Model Name
            </label>
            <input
              type="text"
              value={settings.modelName}
              onChange={(e) => onChange({ modelName: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
              placeholder="llama3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              System Prompt
            </label>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => onChange({ systemPrompt: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100 focus:border-blue-500 focus:outline-none resize-none"
              placeholder="You are a helpful coding assistant..."
            />
          </div>
        </div>
      </div>

      {/* Model Parameters */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Model Parameters</h3>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Temperature</label>
              <span className="text-xs font-mono text-blue-400 bg-gray-800 px-2 py-1 rounded">
                {settings.temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Top P</label>
              <span className="text-xs font-mono text-blue-400 bg-gray-800 px-2 py-1 rounded">
                {settings.topP.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.topP}
              onChange={(e) => onChange({ topP: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Max Tokens</label>
              <span className="text-xs font-mono text-blue-400 bg-gray-800 px-2 py-1 rounded">
                {settings.maxTokens}
              </span>
            </div>
            <input
              type="range"
              min="256"
              max="8192"
              step="256"
              value={settings.maxTokens}
              onChange={(e) => onChange({ maxTokens: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>

      {/* File Operations */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">File Operations</h3>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Write Permission Mode
          </label>
          <div className="space-y-2">
            {PERMISSION_MODES.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="writePermission"
                  value={value}
                  checked={settings.writePermissionMode === value}
                  onChange={(e) =>
                    onChange({
                      writePermissionMode: e.target.value as WritePermissionMode,
                    })
                  }
                  className="w-3 h-3 accent-blue-500"
                />
                <span className="text-sm text-gray-300">{label}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Controls whether the assistant can write to files (desktop integration required)
          </p>
        </div>
      </div>

      {/* Integrated Llama Server */}
      <div className="pt-4 border-t border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Integrated Llama Server</h3>

        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={isRunning ? stopServer : startServer}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                isRunning 
                  ? 'bg-red-600/20 text-red-400 border border-red-600/50 hover:bg-red-600/30' 
                  : 'bg-green-600/20 text-green-400 border border-green-600/50 hover:bg-green-600/30'
              }`}
            >
              {isRunning ? (
                <><Square className="w-4 h-4" /> Stop Server</>
              ) : (
                <><Play className="w-4 h-4" /> Start Server</>
              )}
            </button>
            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Binary Path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.binaryPath}
                onChange={(e) => onChange({ binaryPath: e.target.value })}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
                placeholder="llama-server"
              />
              <button
                onClick={async () => {
                  const selected = await open({ multiple: false, directory: false });
                  if (selected && typeof selected === 'string') onChange({ binaryPath: selected });
                }}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
                title="Select binary"
              >
                <FileSearch className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Model Path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.modelPath}
                onChange={(e) => onChange({ modelPath: e.target.value })}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
                placeholder="./models/..."
              />
              <button
                onClick={async () => {
                  const selected = await open({ 
                    multiple: false, 
                    directory: false,
                    filters: [{ name: 'GGUF Model', extensions: ['gguf'] }]
                  });
                  if (selected && typeof selected === 'string') onChange({ modelPath: selected });
                }}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
                title="Select model"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Chat Template (Jinja)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.templatePath}
                onChange={(e) => onChange({ templatePath: e.target.value })}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
                placeholder="./template.jinja"
              />
              <button
                onClick={async () => {
                  const selected = await open({ 
                    multiple: false, 
                    directory: false,
                    filters: [{ name: 'Jinja Template', extensions: ['jinja'] }]
                  });
                  if (selected && typeof selected === 'string') onChange({ templatePath: selected });
                }}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
                title="Select template"
              >
                <Code2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Port
              </label>
              <input
                type="number"
                value={settings.serverPort}
                onChange={(e) => onChange({ serverPort: parseInt(e.target.value) || 11434 })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer py-2">
                <input
                  type="checkbox"
                  checked={settings.autoStartServer}
                  onChange={(e) => onChange({ autoStartServer: e.target.checked })}
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="text-sm text-gray-300">Auto-start</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Additional Arguments
            </label>
            <textarea
              value={settings.serverArgs}
              onChange={(e) => onChange({ serverArgs: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100 focus:border-blue-500 focus:outline-none resize-none"
              placeholder="--n-gpu-layers 99 ..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
