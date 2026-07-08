import { X, RotateCcw } from 'lucide-react';
import { useSettingsContext } from '../../context/SettingsContext';
import { useWorkspaceContext } from '../../context/WorkspaceContext';
import { SettingsForm } from './SettingsForm';

export function SettingsPanel() {
  const { settings, updateSettings, resetSettings } = useSettingsContext();
  const { toggleSettingsPanel } = useWorkspaceContext();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      <div className="ml-auto w-full max-w-md bg-gray-900 flex flex-col h-screen shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-100">Settings</h2>
          <button
            onClick={toggleSettingsPanel}
            className="p-1 rounded hover:bg-gray-800 transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <SettingsForm settings={settings} onChange={updateSettings} />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={resetSettings}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors text-sm font-medium text-gray-300"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Click outside to close */}
      <div onClick={toggleSettingsPanel} className="flex-1" />
    </div>
  );
}
