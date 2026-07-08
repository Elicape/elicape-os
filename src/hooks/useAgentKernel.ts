import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ToolCall } from '../lib/streamParser';
import { getFileSystemAdapter } from '../lib/fs';
import { useWorkspaceContext } from '../context/WorkspaceContext';
import { validateToolCall } from '../lib/agent-kernel/toolRegistry';

export type ToolResult = {
  role: 'tool';
  content: string;
};

export function useAgentKernel(rootPath: string | null, onWrite?: (path: string) => void) {
  const { addLog } = useWorkspaceContext();

  const resolvePath = useCallback((p: string) => {
    if (!p || p === '.' || p === './') return rootPath || '.';
    if (p.startsWith('/')) return p; // Absolute path
    if (p.startsWith('./') && rootPath) return `${rootPath}/${p.slice(2)}`;
    if (rootPath) return `${rootPath}/${p}`;
    return p;
  }, [rootPath]);

  const executeTool = useCallback(async (call: ToolCall): Promise<string> => {
    const adapter = getFileSystemAdapter();
    const { name, arguments: args } = call;

    addLog(`Executing tool: ${name}`, 'info');

    try {
      const validationError = validateToolCall(call);
      if (validationError) throw new Error(validationError);

      let result = '';
      switch (name) {
        case 'read_file':
          const readPath = resolvePath(args.path);
          result = await adapter.readFile(readPath);
          addLog(`Read file: ${readPath}`, 'success');
          break;

        case 'write_file':
          const writePath = resolvePath(args.path);
          await adapter.writeFile(writePath, args.content);
          addLog(`Wrote file: ${writePath}`, 'success');
          result = `Successfully wrote to ${writePath}`;
          onWrite?.(writePath);
          break;

        case 'create_file':
          const createPath = resolvePath(args.path);
          await adapter.writeFile(createPath, args.content || '');
          addLog(`Created file: ${createPath}`, 'success');
          result = `Successfully created ${createPath}`;
          onWrite?.(createPath);
          break;

        case 'list_dir':
          const listPath = resolvePath(args.path);
          const files = await adapter.readDirectory(listPath);
          addLog(`Listed directory: ${listPath}`, 'success');
          result = files.map(f => `${f.type === 'folder' ? 'DIR ' : 'FILE'} ${f.name}`).join('\n');
          if (!result) result = 'Directory is empty.';
          break;

        case 'run_command':
          const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
          if (!isTauri) {
            throw new Error('run_command is only available in the desktop app.');
          }
          addLog(`Running command: ${args.command}`, 'info');
          result = await invoke<string>('run_shell_command', { command: args.command });
          addLog(`Command executed successfully`, 'success');
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      addLog(`Tool error (${name}): ${msg}`, 'error');
      return `Error: ${msg}`;
    }
  }, [addLog, onWrite, resolvePath, rootPath]);


  return {
    executeTool,
  };
}
