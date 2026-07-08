import { AgentToolCall } from '../lib/agent-kernel/types';

export type WritePermissionMode = 'ask' | 'allow' | 'deny';

export interface WorkspaceSettings {
  endpoint: string;
  modelName: string;
  systemPrompt: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  writePermissionMode: WritePermissionMode;
  grammar?: string;
  chatTemplate?: string;
  templatePath: string;
  
  // Llama Server Integration
  binaryPath: string;
  modelPath: string;
  serverPort: number;
  serverArgs: string;
  autoStartServer: boolean;

  // IDE Features
  autosaveEnabled: boolean;
  theme: 'dark' | 'light';
  fontFamily: string;
  agentMode: 'plan' | 'apply' | 'shell';
}

export interface OpenFile {
  path: string;
  content: string;
  hasUnsavedChanges: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  reasoning?: string;
  timestamp: number;
  isStreaming?: boolean;
  toolCalls?: AgentToolCall[];
  turnId?: string;
}

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  isOpen?: boolean;
  children?: FileNode[];
}

export interface LLMStreamChunk {
  type: 'start' | 'content' | 'done' | 'error';
  content?: string;
  error?: string;
}

export interface LLMChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
}

export interface PromptContext {
  selectedFilePath?: string;
  selectedFileContent?: string;
  openTabs?: string[];
  fileTreeSummary?: string;
}
