import { FileNode } from '../../types/index';
import { IFileSystemAdapter } from './types';

interface MemoryFileEntry {
  type: 'file' | 'folder';
  content?: string;
  children?: Record<string, MemoryFileEntry>;
}

export class MemoryFileSystemAdapter implements IFileSystemAdapter {
  private tree: Record<string, MemoryFileEntry>;

  constructor() {
    this.tree = {
      'README.md': {
        type: 'file',
        content: '# Project Root\n\nWelcome to your local AI coding workspace.',
      },
      'src': {
        type: 'folder',
        children: {
          'App.tsx': {
            type: 'file',
            content: 'import React from "react";\n\nexport function App() {\n  return <div>Local AI Workspace</div>;\n}',
          },
          'main.ts': {
            type: 'file',
            content: '// Entry point\nconsole.log("Starting application...");',
          },
        },
      },
      'config': {
        type: 'folder',
        children: {
          'settings.json': {
            type: 'file',
            content: JSON.stringify({ theme: 'dark', language: 'en' }, null, 2),
          },
        },
      },
    };
  }

  async readDirectory(path: string): Promise<FileNode[]> {
    const entry = this.getEntry(path);
    if (!entry || entry.type === 'file') {
      return [];
    }

    const result: FileNode[] = [];
    const children = entry.children || {};

    Object.entries(children).forEach(([name, childEntry]) => {
      result.push({
        id: `${path}/${name}`.replace(/\/+/g, '/'),
        name,
        path: `${path}/${name}`.replace(/\/+/g, '/'),
        type: childEntry.type,
        children: childEntry.type === 'folder' ? [] : undefined,
      });
    });

    return result;
  }

  async readFile(path: string): Promise<string> {
    const entry = this.getEntry(path);
    if (!entry || entry.type === 'folder') {
      throw new Error(`Path is not a file: ${path}`);
    }
    return entry.content || '';
  }

  async writeFile(path: string, content: string): Promise<void> {
    const parts = path.split('/').filter(Boolean);
    const fileName = parts.pop();

    if (!fileName) {
      throw new Error('Invalid file path');
    }

    let current = this.tree;
    for (const part of parts) {
      if (!current[part]) {
        current[part] = { type: 'folder', children: {} };
      }
      const entry = current[part];
      if (entry.type === 'file') {
        throw new Error(`Cannot write through file: ${part}`);
      }
      if (!entry.children) {
        entry.children = {};
      }
      current = entry.children;
    }

    current[fileName] = { type: 'file', content };
  }

  async exists(path: string): Promise<boolean> {
    try {
      this.getEntry(path);
      return true;
    } catch {
      return false;
    }
  }

  async getFileTree(path: string): Promise<FileNode> {
    const entry = this.getEntry(path);
    if (!entry) {
      throw new Error(`Path not found: ${path}`);
    }

    const node: FileNode = {
      id: path,
      name: path.split('/').pop() || 'root',
      path,
      type: entry.type,
    };

    if (entry.type === 'folder' && entry.children) {
      node.children = await Promise.all(
        Object.entries(entry.children).map(([name]) =>
          this.getFileTree(`${path}/${name}`.replace(/\/+/g, '/'))
        )
      );
    }

    return node;
  }

  private getEntry(path: string): MemoryFileEntry | null {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) {
      return { type: 'folder', children: this.tree };
    }

    let current: MemoryFileEntry | undefined = { type: 'folder', children: this.tree };

    for (const part of parts) {
      if (!current || current.type === 'file') {
        return null;
      }
      current = current.children?.[part];
    }

    return current || null;
  }
}
