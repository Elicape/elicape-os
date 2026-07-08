import { getFileSystemAdapter } from '../fs';

export interface KernelConfig {
  systemPrompt: string;
  grammar: string;
  chatTemplate: string;
}

export async function loadKernelConfig(): Promise<KernelConfig> {
  const adapter = getFileSystemAdapter();
  
  const [systemPrompt, grammar, chatTemplate] = await Promise.all([
    readOptionalFile(adapter, 'system_prompt.txt', 'You are a coding assistant. You have access to filesystem tools. Use <tool_call> to read or write files.'),
    readOptionalFile(adapter, 'grammar.gbnf', ''),
    readOptionalFile(adapter, 'qwen3-coder-template.jinja', ''),
  ]);

  return {
    systemPrompt,
    grammar,
    chatTemplate,
  };
}

async function readOptionalFile(adapter: any, path: string, defaultValue: string): Promise<string> {
  try {
    return await adapter.readFile(path);
  } catch (e) {
    console.warn(`Failed to load config file ${path}, using default.`, e);
    return defaultValue;
  }
}
