import { open } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile, readDir, exists } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import { FileNode } from '../../types/index';
import { IFileSystemAdapter } from './types';

export class TauriFileSystemAdapter implements IFileSystemAdapter {
  private root: string = '';

  private async resolve(path: string): Promise<string> {
    if (!this.root) {
      try {
        this.root = await invoke('get_project_root');
      } catch {
        this.root = '';
      }
    }
    if (path.startsWith('/') || path.startsWith('~')) return path;
    if (!this.root) return path;
    return `${this.root}/${path}`.replace(/\/+/g, '/');
  }

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
    const resolved = await this.resolve(path);
    try {
      const entries = await readDir(resolved);
      const result: FileNode[] = [];

      for (const entry of entries) {
        const fullPath = `${resolved}/${entry.name}`.replace(/\/+/g, '/');
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
      console.error(`Tauri FS Error [readDirectory]: ${resolved}`, error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Permission denied or folder not found: ${resolved}. Details: ${message}`);
    }
  }

  async readFile(path: string): Promise<string> {
    const resolved = await this.resolve(path);
    try {
      const contents = await readFile(resolved);
      return new TextDecoder().decode(contents);
    } catch (error) {
      console.error(`Tauri FS Error [readFile]: ${resolved}`, error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read file: ${resolved}. Details: ${message}`);
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    const resolved = await this.resolve(path);
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      await writeFile(resolved, data);
    } catch (error) {
      console.error(`Tauri FS Error [writeFile]: ${resolved}`, error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to save file: ${resolved}. Details: ${message}`);
    }
  }

  async exists(path: string): Promise<boolean> {
    return await exists(await this.resolve(path));
  }

  async getFileTree(path: string): Promise<FileNode> {
    const resolved = await this.resolve(path);
    const isDir = await this.isDirectory(resolved);
    
    const node: FileNode = {
      id: resolved,
      name: resolved.split('/').pop() || 'root',
      path: resolved,
      type: isDir ? 'folder' : 'file',
    };

    if (isDir) {
      const children = await this.readDirectory(resolved);
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
