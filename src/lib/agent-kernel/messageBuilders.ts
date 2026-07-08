import { LLMChatMessage } from '../../types';
import { AgentToolCall } from './types';

export function buildSystemMessage(content: string): LLMChatMessage {
  return { role: 'system', content };
}

export function buildAssistantMessage(content: string): LLMChatMessage {
  return { role: 'assistant', content };
}

export function buildToolResultMessage(toolCall: AgentToolCall): LLMChatMessage[] {
  return [
    {
      role: 'assistant',
      content: `<tool_call>${JSON.stringify({
        name: toolCall.name,
        arguments: toolCall.arguments
      })}</tool_call>`
    },
    {
      role: 'tool',
      content: toolCall.result || toolCall.error || 'No result provided'
    }
  ];
}

export function assembleConversation(
  history: LLMChatMessage[],
  currentTurn: { content: string, toolCalls: AgentToolCall[], reasoning?: string }
): LLMChatMessage[] {
  const messages = [...history];
  
  if (currentTurn.content || currentTurn.toolCalls.length > 0 || currentTurn.reasoning) {
    let text = currentTurn.reasoning ? `<think>\n${currentTurn.reasoning}\n</think>\n` : '';
    text += currentTurn.content;
    
    if (text.trim()) {
      messages.push(buildAssistantMessage(text));
    }
    
    currentTurn.toolCalls.forEach(tc => {
      if (tc.state === 'succeeded' || tc.state === 'failed' || tc.state === 'denied') {
        messages.push(...buildToolResultMessage(tc));
      }
    });
  }
  
  return messages;
}
