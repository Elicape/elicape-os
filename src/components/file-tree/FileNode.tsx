import React, { useState } from 'react';
import { ChevronRight, File, Folder } from 'lucide-react';
import { FileNode as FileNodeType } from '../../types/index';

interface FileNodeProps {
  node: FileNodeType;
  isSelected: boolean;
  onSelect: (path: string) => void;
  onToggle?: (path: string) => void;
  level?: number;
}

export function FileNode({ node, isSelected, onSelect, onToggle, level = 0 }: FileNodeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    onToggle?.(node.path);
  };

  const handleSelect = () => {
    if (node.type === 'file') {
      onSelect(node.path);
    } else {
      handleToggle(new MouseEvent('click') as any);
    }
  };

  const hasChildren = node.children && node.children.length > 0;
  const isFolder = node.type === 'folder';

  return (
    <div>
      <div
        onClick={handleSelect}
        className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-gray-800 transition-colors group ${
          isSelected ? 'bg-gray-800' : ''
        }`}
        style={{ paddingLeft: `${(level + 1) * 12}px` }}
      >
        {isFolder && (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 p-0.5 hover:bg-gray-700 rounded"
          >
            <ChevronRight
              className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
                isOpen ? 'rotate-90' : ''
              }`}
            />
          </button>
        )}

        {!isFolder && <div className="w-3.5" />}

        {isFolder ? (
          <Folder className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        ) : (
          <File className="w-4 h-4 text-blue-400 flex-shrink-0" />
        )}

        <span className="text-sm text-gray-200 truncate">{node.name}</span>
      </div>

      {isFolder && isOpen && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <FileNode
              key={child.id}
              node={child}
              isSelected={isSelected && child.path === node.path}
              onSelect={onSelect}
              onToggle={onToggle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
