import { ToolCall } from '../streamParser';

export type ToolExecutionState = 
  | 'pending_approval' 
  | 'executing' 
  | 'succeeded' 
  | 'failed' 
  | 'denied';

export interface AgentToolCall extends ToolCall {
  id: string;
  state: ToolExecutionState;
  result?: string;
  error?: string;
}

export interface AssistantTurn {
  id: string;
  content: string;
  reasoning?: string;
  toolCalls: AgentToolCall[];
  isStreaming: boolean;
  status: 'idle' | 'streaming' | 'waiting_for_approval' | 'executing_tools' | 'done' | 'error';
  error?: string;
}
