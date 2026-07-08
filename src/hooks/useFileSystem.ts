import { useState, useCallback, useEffect } from 'react';
import { FileNode, OpenFile } from '../types/index';
import { getFileSystemAdapter, TauriFileSystemAdapter } from '../lib/fs';
import { useWorkspaceContext } from '../context/WorkspaceContext';

export function useFileSystem() {
  const { rootPath, setRootPath, addLog } = useWorkspaceContext();
  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [currentFile, setCurrentFile] = useState<OpenFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDirectory = useCallback(async (path: string) => {
    if (!path) return;
    setIsLoading(true);
    setError(null);
    try {
      const adapter = getFileSystemAdapter();
      const tree = await adapter.getFileTree(path);
      setFileTree(tree);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load directory';
      setError(msg);
      addLog(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addLog]);

  const openProject = useCallback(async () => {
    try {
      const adapter = getFileSystemAdapter() as TauriFileSystemAdapter;
      const path = await adapter.openProject();
      if (path) {
        setRootPath(path);
        addLog(`Project opened: ${path}`, 'success');
        await loadDirectory(path);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to open project';
      addLog(msg, 'error');
    }
  }, [setRootPath, addLog, loadDirectory]);

  const openFile = useCallback(async (path: string) => {
    setError(null);
    const existingFile = openFiles.find(f => f.path === path);
    if (existingFile) {
      setCurrentFile(existingFile);
      return;
    }

    try {
      const adapter = getFileSystemAdapter();
      const content = await adapter.readFile(path);
      const newFile: OpenFile = { path, content, hasUnsavedChanges: false };
      setOpenFiles(prev => [...prev, newFile]);
      setCurrentFile(newFile);
      addLog(`File opened: ${path.split('/').pop()}`, 'info');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to read file';
      setError(msg);
      addLog(msg, 'error');
    }
  }, [addLog, openFiles]);

  const closeFile = useCallback((path: string) => {
    setOpenFiles(prev => {
      const filtered = prev.filter(f => f.path !== path);
      if (currentFile?.path === path) {
        setCurrentFile(filtered[filtered.length - 1] || null);
      }
      return filtered;
    });
  }, [currentFile]);

  const setFileContent = useCallback((path: string, content: string, hasUnsavedChanges: boolean) => {
    const updatedFile = { path, content, hasUnsavedChanges };
    setOpenFiles(prev => prev.map(f => f.path === path ? updatedFile : f));
    if (currentFile?.path === path) {
      setCurrentFile(updatedFile);
    }
  }, [currentFile]);

  const updateFile = useCallback(
    async (content: string) => {
      if (!currentFile) return;

      setError(null);
      try {
        const adapter = getFileSystemAdapter();
        await adapter.writeFile(currentFile.path, content);
        setFileContent(currentFile.path, content, false);
        addLog(`File saved: ${currentFile.path.split('/').pop()}`, 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to write file';
        setError(msg);
        addLog(msg, 'error');
      }
    },
    [currentFile, addLog, setFileContent]
  );

  const refreshFile = useCallback(async (path: string) => {
    // If the path is the current file, reload it
    if (currentFile && currentFile.path === path) {
      setError(null);
      try {
        const adapter = getFileSystemAdapter();
        const content = await adapter.readFile(path);
        setFileContent(path, content, false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to read file';
        setError(msg);
        addLog(msg, 'error');
      }
    }
    // Always reload directory to update tree (new files, etc)
    if (rootPath) {
      await loadDirectory(rootPath);
    }
  }, [currentFile, rootPath, setFileContent, loadDirectory, addLog]);

  useEffect(() => {
    if (rootPath) {
      loadDirectory(rootPath);
    }
  }, [rootPath, loadDirectory]);

  return {
    fileTree,
    currentFile,
    openFiles,
    isLoading,
    error,
    rootPath,
    openProject,
    loadDirectory: () => rootPath && loadDirectory(rootPath),
    openFile,
    closeFile,
    updateFile,
    setFileContent,
    refreshFile,
    getOpenTabs: () => openFiles.map(f => f.path),
  };
}
