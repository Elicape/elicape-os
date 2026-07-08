import { open } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile, readDir, exists } from '@tauri-apps/plugin-fs';
import { FileNode } from '../../types/index';
import { IFileSystemAdapter } from './types';

export class TauriFileSystemAdapter implements IFileSystemAdapter {
  async openProject(): Promise<string | null> {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Open Project Folder',
    });

    if (Array.isArray(selected)) return selected[0];
    return selected;
  }

  async openFilePicker(filters?: { name: string; extensions: string[] }[]): Promise<string | null> {
    const selected = await open({
      directory: false,
      multiple: false,
      title: 'Select File',
      filters
    });
    if (Array.isArray(selected)) return selected[0];
    return selected;
  }

  async readDirectory(path: string): Promise<FileNode[]> {
    try {
      const entries = await readDir(path);
      const result: FileNode[] = [];

      for (const entry of entries) {
        const fullPath = `${path}/${entry.name}`.replace(/\/+/g, '/');
        result.push({
          id: fullPath,
          name: entry.name,
          path: fullPath,
          type: entry.isDirectory ? 'folder' : 'file',
          children: entry.isDirectory ? [] : undefined,
        });
      }

      return result;
    } catch (error) {
      console.error(`Tauri FS Error [readDirectory]: ${path}`, error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Permission denied or folder not found: ${path}. Details: ${message}`);
    }
  }

  async readFile(path: string): Promise<string> {
    try {
      const contents = await readFile(path);
      return new TextDecoder().decode(contents);
    } catch (error) {
      console.error(`Tauri FS Error [readFile]: ${path}`, error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read file: ${path}. Details: ${message}`);
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      await writeFile(path, data);
    } catch (error) {
      console.error(`Tauri FS Error [writeFile]: ${path}`, error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to save file: ${path}. Details: ${message}`);
    }
  }

  async exists(path: string): Promise<boolean> {
    return await exists(path);
  }

  async getFileTree(path: string): Promise<FileNode> {
    const isDir = await this.isDirectory(path);
    
    const node: FileNode = {
      id: path,
      name: path.split('/').pop() || 'root',
      path,
      type: isDir ? 'folder' : 'file',
    };

    if (isDir) {
      const children = await this.readDirectory(path);
      node.children = await Promise.all(
        children.map(child => this.getFileTree(child.path))
      );
    }

    return node;
  }

  private async isDirectory(path: string): Promise<boolean> {
    try {
      const entries = await readDir(path);
      return !!entries;
    } catch {
      return false;
    }
  }
}
