import { FileNode } from '../../types/index';
import { IFileSystemAdapter } from './types';

export class WebFileSystemAdapter implements IFileSystemAdapter {
  private memoryFiles: Record<string, string> = {
    'system_prompt.txt': `You are a coding assistant running inside a local editor.

You have access to tools to interact with the filesystem.

Rules:

- If you need to read or write files, you MUST use <tool_call>.
- Do NOT output code for file operations unless explicitly asked.
- Use tools instead of describing actions.

Write modes:
- "deny": do not write files
- "ask": request permission before writing
- "allow": write directly

If a write is needed in ask mode:
- request it using tool_call

Available tools:
- read_file(path)
- write_file(path, content)
- create_file(path, content)

Never invent tools.
Never bypass tool_call for filesystem actions.`,
    'grammar.gbnf': '', // We'll assume the server handles this or it's not strictly needed for web testing
    'qwen3-coder-template.jinja': '',
  };

  async openProject(): Promise<string | null> {
    return '/mock/project';
  }

  async readDirectory(_path: string): Promise<FileNode[]> {
    return [
      { id: '/mock/project/system_prompt.txt', name: 'system_prompt.txt', path: 'system_prompt.txt', type: 'file' },
      { id: '/mock/project/grammar.gbnf', name: 'grammar.gbnf', path: 'grammar.gbnf', type: 'file' },
      { id: '/mock/project/qwen3-coder-template.jinja', name: 'qwen3-coder-template.jinja', path: 'qwen3-coder-template.jinja', type: 'file' },
    ];
  }

  async readFile(path: string): Promise<string> {
    // Normalize path for lookup
    const fileName = path.split('/').pop() || path;
    if (this.memoryFiles[fileName] !== undefined) {
      return this.memoryFiles[fileName];
    }
    // Return empty for config files if not explicitly set, instead of a placeholder
    if (path.endsWith('.gbnf') || path.endsWith('.jinja')) {
      return '';
    }
    return `Content of ${path} (Web Mock)`;
  }

  async writeFile(path: string, content: string): Promise<void> {
    const fileName = path.split('/').pop() || path;
    this.memoryFiles[fileName] = content;
    console.log(`[WebFS] Wrote ${path}`);
  }

  async exists(path: string): Promise<boolean> {
    const fileName = path.split('/').pop() || path;
    return !!this.memoryFiles[fileName];
  }

  async getFileTree(path: string): Promise<FileNode> {
    return {
      id: '/mock/project',
      name: 'project',
      path: '/mock/project',
      type: 'folder',
      children: await this.readDirectory(path)
    };
  }
}
