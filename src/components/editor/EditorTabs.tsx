import React from 'react';
import { X } from 'lucide-react';
import { OpenFile } from '../../types/index';

interface EditorTabsProps {
  openFiles: OpenFile[];
  currentFile: OpenFile | null;
  onSelectFile: (path: string) => void;
  onCloseFile: (path: string) => void;
}

export function EditorTabs({ openFiles, currentFile, onSelectFile, onCloseFile }: EditorTabsProps) {
  if (openFiles.length === 0) return null;

  return (
    <div className="flex bg-gray-900 border-b border-gray-700 overflow-x-auto scrollbar-hide h-9 items-center">
      {openFiles.map((file) => {
        const isActive = currentFile?.path === file.path;
        const fileName = file.path.split('/').pop() || file.path;

        return (
          <div
            key={file.path}
            className={`flex items-center gap-2 px-3 h-full cursor-default border-r border-gray-700 min-w-[120px] max-w-[200px] transition-colors ${
              isActive ? 'bg-gray-950 text-blue-400 border-t-2 border-t-blue-500' : 'bg-gray-900 text-gray-400 hover:bg-gray-850'
            }`}
            onClick={() => onSelectFile(file.path)}
          >
            <span className="flex-1 text-xs truncate py-2" title={file.path}>
              {fileName}
              {file.hasUnsavedChanges && (
                <span className="ml-2 inline-block w-1.5 h-1.5 bg-blue-500 rounded-full" />
              )}
            </span>
            <button
              className="p-1 rounded-sm hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onCloseFile(file.path);
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
