import { AssistantTurn, AgentToolCall, ToolExecutionState } from './types';
import { ParserResult } from '../streamParser';

export class AgentSessionManager {
  private turn: AssistantTurn;

  constructor(turnId: string) {
    this.turn = {
      id: turnId,
      content: '',
      toolCalls: [],
      isStreaming: true,
      status: 'idle',
    };
  }

  getTurn(): AssistantTurn {
    return { ...this.turn, toolCalls: [...this.turn.toolCalls] };
  }

  updateFromParser(results: ParserResult[]) {
    results.forEach(result => {
      if (result.type === 'text') {
        this.turn.content += result.content;
      } else if (result.type === 'think') {
        this.turn.reasoning = (this.turn.reasoning || '') + result.content;
      } else if (result.type === 'tool_call' && result.toolCall) {
        const toolCall: AgentToolCall = {
          ...result.toolCall,
          id: Math.random().toString(36).substring(2, 11),
          state: 'pending_approval',
        };
        this.turn.toolCalls.push(toolCall);
        this.turn.status = 'waiting_for_approval';
      }
    });
  }

  setStreaming(isStreaming: boolean) {
    this.turn.isStreaming = isStreaming;
    if (!isStreaming && this.turn.status === 'streaming') {
      this.turn.status = 'done';
    } else if (isStreaming) {
      this.turn.status = 'streaming';
    }
  }

  updateToolState(toolCallId: string, state: ToolExecutionState, result?: string, error?: string) {
    const tc = this.turn.toolCalls.find(t => t.id === toolCallId);
    if (tc) {
      tc.state = state;
      if (result !== undefined) tc.result = result;
      if (error !== undefined) tc.error = error;
      
      // Update turn status based on remaining pending calls
      const hasPending = this.turn.toolCalls.some(t => t.state === 'pending_approval');
      const hasExecuting = this.turn.toolCalls.some(t => t.state === 'executing');
      
      if (hasExecuting) {
        this.turn.status = 'executing_tools';
      } else if (hasPending) {
        this.turn.status = 'waiting_for_approval';
      } else {
        this.turn.status = 'done';
      }
    }
  }

  setError(error: string) {
    this.turn.status = 'error';
    this.turn.error = error;
    this.turn.isStreaming = false;
  }
}
