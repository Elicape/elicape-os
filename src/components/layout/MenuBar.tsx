import React, { useState } from 'react';
import { useSettingsContext } from '../../context/SettingsContext';
import { useWorkspaceContext } from '../../context/WorkspaceContext';
import { getFileSystemAdapter } from '../../lib/fs';

interface MenuBarProps {
  onSaveFile: () => void;
  onOpenProject: () => void;
  onCloseFile: (path: string) => void;
  currentFilePath?: string;
  onSaveSession: (name: string) => Promise<boolean>;
  onLoadSession: (path: string) => Promise<boolean>;
  onClearChat: () => void;
}

export function MenuBar({
  onSaveFile,
  onOpenProject,
  onCloseFile,
  currentFilePath,
  onSaveSession,
  onLoadSession,
  onClearChat
}: MenuBarProps) {
  const { settings, updateSettings } = useSettingsContext();
  const { toggleAboutDialog } = useWorkspaceContext();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menus = [
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'Save', shortcut: 'Ctrl+S', action: onSaveFile, disabled: !currentFilePath },
        { label: 'Open Project', action: onOpenProject },
        { label: 'Close File', action: () => currentFilePath && onCloseFile(currentFilePath), disabled: !currentFilePath },
        { type: 'separator' },
        { 
          label: `Autosave: ${settings.autosaveEnabled ? 'ON' : 'OFF'}`, 
          action: () => updateSettings({ autosaveEnabled: !settings.autosaveEnabled }) 
        },
      ]
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { 
          label: `Theme: ${settings.theme}`, 
          action: () => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' }) 
        },
        { 
          label: 'Font: Sans', 
          action: () => updateSettings({ fontFamily: 'Inter, system-ui, sans-serif' }) 
        },
        { 
          label: 'Font: Mono', 
          action: () => updateSettings({ fontFamily: "'Fira Code', monospace" }) 
        },
      ]
    },
    {
      id: 'chat',
      label: 'Chat',
      items: [
        { 
          label: 'Save Session', 
          action: async () => {
            const name = window.prompt('Enter session name:');
            if (name) await onSaveSession(name);
          } 
        },
        { 
          label: 'Load Session', 
          action: async () => {
            const adapter = getFileSystemAdapter();
            if (adapter.openFilePicker) {
              const path = await adapter.openFilePicker([{ name: 'JSON', extensions: ['json'] }]);
              if (path) await onLoadSession(path);
            }
          } 
        },
        { label: 'Clear History', action: onClearChat },
        { type: 'separator' },
        { label: 'About ELICAPE OS', action: toggleAboutDialog },
        { 
          label: `Agent Mode: ${settings.agentMode.toUpperCase()}`, 
          action: () => {
            const modes: Array<'plan' | 'apply' | 'shell'> = ['plan', 'apply', 'shell'];
            const idx = modes.indexOf(settings.agentMode);
            updateSettings({ agentMode: modes[(idx + 1) % modes.length] });
          }
        },
      ]
    }
  ];

  return (
    <div className="flex bg-gray-900 border-b border-gray-700 px-2 select-none h-8 items-center text-xs">
      {menus.map((menu) => (
        <div 
          key={menu.id} 
          className="relative group"
          onMouseEnter={() => activeMenu && setActiveMenu(menu.id)}
        >
          <div 
            className={`px-3 py-1 rounded cursor-default hover:bg-gray-700 ${activeMenu === menu.id ? 'bg-gray-700' : ''}`}
            onClick={() => setActiveMenu(activeMenu === menu.id ? null : menu.id)}
          >
            {menu.label}
          </div>
          
          {activeMenu === menu.id && (
            <div className="absolute left-0 top-full mt-0 w-48 bg-gray-800 border border-gray-700 shadow-xl z-50 rounded-b-md overflow-hidden py-1">
              {menu.items.map((item, idx) => (
                item.type === 'separator' ? (
                  <div key={idx} className="h-px bg-gray-700 my-1" />
                ) : (
                  <button
                    key={idx}
                    disabled={item.disabled}
                    className={`w-full text-left px-4 py-1.5 flex justify-between items-center hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-transparent ${item.disabled ? 'cursor-not-allowed' : 'cursor-default'}`}
                    onClick={() => {
                      item.action?.();
                      setActiveMenu(null);
                    }}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && <span className="text-gray-500 text-[10px]">{item.shortcut}</span>}
                  </button>
                )
              ))}
            </div>
          )}
        </div>
      ))}
      
      {/* Backdrop to close menus */}
      {activeMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}
