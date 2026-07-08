import { WorkspaceSettings, LLMChatMessage } from '../types/index';
import { TOOL_REGISTRY } from './agent-kernel/toolRegistry';

const LLAMA_ENDPOINT = "http://127.0.0.1:8080/v1/chat/completions";

export async function sendToQwen3(messages: any[]) {
  const response = await fetch(LLAMA_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen3-coder",
      messages: messages,
      temperature: 0.2,
      stream: false,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    throw new Error(`LLM mudo. Status: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function* streamChat(
  messages: LLMChatMessage[],
  settings: WorkspaceSettings,
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const url = new URL(settings.endpoint);
  if (!url.pathname.endsWith('/')) {
    url.pathname += '/';
  }
  url.pathname += 'chat/completions';

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.modelName,
      messages,
      temperature: settings.temperature,
      top_p: settings.topP,
      max_tokens: settings.maxTokens,
      stream: true,
      ...(settings.grammar ? { grammar: settings.grammar } : {}),
      ...(settings.chatTemplate ? { chat_template: settings.chatTemplate } : {}),
      tools: Object.values(TOOL_REGISTRY).map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      })),
    }),
    signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${response.status} ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  
  // Buffer for OpenAI format tool calls
  let activeToolCalls: { [index: number]: { name: string; arguments: string } } = {};

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      console.log('[llm-client] raw decoded buffer chunk:', buffer);
      const lines = buffer.split('\n');

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        console.log('[llm-client] raw line:', JSON.stringify(line));
        if (!line || line === '[DONE]') continue;

        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          console.log('[llm-client] data payload:', data);
          try {
            const chunk = JSON.parse(data);
            console.log('[llm-client] parsed JSON chunk:', chunk);
            const delta = chunk.choices?.[0]?.delta;

            let content = '';
            let sourceField = '';

            if (delta?.content) {
              content = delta.content;
              sourceField = 'content';
            } else if (delta?.reasoning_content) {
              content = delta.reasoning_content;
              sourceField = 'reasoning_content';
            } else if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!activeToolCalls[idx]) {
                  activeToolCalls[idx] = { name: tc.function?.name || '', arguments: tc.function?.arguments || '' };
                } else {
                  if (tc.function?.name) activeToolCalls[idx].name += tc.function.name;
                  if (tc.function?.arguments) activeToolCalls[idx].arguments += tc.function.arguments;
                }
              }
              sourceField = 'tool_calls_buffer';
            }

            if (content) {
              console.log(`[LLM Stream] Field: ${sourceField} | Chunk: "${content.substring(0, 50)}..."`);
              yield content;
            }
          } catch (e) {
            console.error('[llm-client] invalid JSON payload:', e);
            // Skip invalid JSON
          }
        }
      }

      buffer = lines[lines.length - 1];
    }

    buffer += decoder.decode();
    if (buffer.trim() && buffer.trim() !== '[DONE]') {
      const line = buffer.trim();
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        try {
          const chunk = JSON.parse(data);
          const delta = chunk.choices?.[0]?.delta;

          let content = '';
          let sourceField = '';

          if (delta?.content) {
            content = delta.content;
            sourceField = 'content';
          } else if (delta?.reasoning_content) {
            content = delta.reasoning_content;
            sourceField = 'reasoning_content';
          } else if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!activeToolCalls[idx]) {
                activeToolCalls[idx] = { name: tc.function?.name || '', arguments: tc.function?.arguments || '' };
              } else {
                if (tc.function?.name) activeToolCalls[idx].name += tc.function.name;
                if (tc.function?.arguments) activeToolCalls[idx].arguments += tc.function.arguments;
              }
            }
            sourceField = 'tool_calls_buffer';
          }

          if (content) {
            console.log(`[LLM Stream] Field: ${sourceField} | Chunk: "${content.substring(0, 50)}..."`);
            yield content;
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    // Yield any buffered tool calls at the end of the stream
    for (const idx of Object.keys(activeToolCalls)) {
      const tc = activeToolCalls[Number(idx)];
      const args = tc.arguments.trim() || '{}';
      yield `\n<tool_call>{"name": "${tc.name}", "arguments": ${args}}</tool_call>\n`;
    }
  } finally {
    reader.releaseLock();
  }
}
