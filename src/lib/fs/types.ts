import { FileNode } from '../../types/index';

export interface IFileSystemAdapter {
  readDirectory(path: string): Promise<FileNode[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  getFileTree(path: string): Promise<FileNode>;
  openFilePicker?(filters?: { name: string; extensions: string[] }[]): Promise<string | null>;
  watchFile?(path: string, callback: (content: string) => void): () => void;
}
