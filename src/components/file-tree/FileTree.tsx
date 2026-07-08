import { RefreshCw } from 'lucide-react';
import { FileNode as FileNodeType } from '../../types/index';
import { PanelHeader } from '../layout/PanelHeader';
import { FileNode } from './FileNode';

interface FileTreeProps {
  tree: FileNodeType | null;
  currentFile?: string;
  onFileSelect: (path: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function FileTree({
  tree,
  currentFile,
  onFileSelect,
  isLoading,
  onRefresh,
}: FileTreeProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PanelHeader
        title="Files"
        actions={
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1 rounded hover:bg-gray-800 transition-colors disabled:opacity-50 text-gray-400"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="flex-1 overflow-auto">
        {tree ? (
          <FileNode
            node={tree}
            isSelected={currentFile === tree.path}
            onSelect={onFileSelect}
            level={-1}
          />
        ) : (
          <div className="p-4 text-gray-500 text-sm">
            {isLoading ? 'Loading...' : 'No files loaded'}
          </div>
        )}
      </div>
    </div>
  );
}
