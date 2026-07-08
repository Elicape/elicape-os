import { TauriFileSystemAdapter } from './tauriFs';
import { WebFileSystemAdapter } from './webFs';
import { IFileSystemAdapter } from './types';

let adapter: IFileSystemAdapter | null = null;

export function getFileSystemAdapter(): IFileSystemAdapter {
  if (!adapter) {
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
    if (isTauri) {
      adapter = new TauriFileSystemAdapter();
    } else {
      console.warn('Tauri not detected, falling back to WebFileSystemAdapter');
      adapter = new WebFileSystemAdapter();
    }
  }
  return adapter;
}

export type { IFileSystemAdapter };
export { TauriFileSystemAdapter };
