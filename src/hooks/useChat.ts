import { useState, useCallback, useRef } from 'react';
import { ChatMessage, LLMChatMessage, WorkspaceSettings } from '../types/index';
import { streamChat } from '../lib/llm-client';
import { StreamParser } from '../lib/streamParser';
import { useAgentKernel } from './useAgentKernel';
import { AgentSessionManager } from '../lib/agent-kernel/session';
import { assembleConversation } from '../lib/agent-kernel/messageBuilders';
import { buildPrompt } from '../lib/promptBuilder';
import { getFileSystemAdapter } from '../lib/fs';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function useChat(settings: WorkspaceSettings, rootPath: string | null, onWrite?: (path: string) => void) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const { executeTool } = useAgentKernel(rootPath, onWrite);
  
  const sessionRef = useRef<AgentSessionManager | null>(null);
  const historyRef = useRef<LLMChatMessage[]>([]);

  const sendMessage = useCallback(
    async (content?: string) => {
      if (!content?.trim() && !sessionRef.current) return;

      setError(null);
      setIsStreaming(true);

      // SHELL MODE: bypass kernel, tools, grammar — raw text only
      if (settings.agentMode === 'shell') {
        const userContent = content?.trim() || '';
        const shellUserMsg: ChatMessage = { id: generateId(), role: 'user', content: userContent, timestamp: Date.now() };
        setMessages((prev) => [...prev, shellUserMsg]);

        const shellTurnId = generateId();
        const shellAssistantMsg: ChatMessage = { id: shellTurnId, role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true };
        setMessages((prev) => [...prev, shellAssistantMsg]);

        try {
          abortController.current = new AbortController();
          const shellUrl = new URL(settings.endpoint);
          if (!shellUrl.pathname.endsWith('/')) shellUrl.pathname += '/';
          shellUrl.pathname += 'chat/completions';

          const shellResponse = await fetch(shellUrl.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: settings.modelName,
              messages: [
                { role: 'system', content: 'Eres el General. Solo texto, max 3 bullets.' },
                ...messages.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: userContent },
              ],
              temperature: settings.temperature,
              top_p: settings.topP,
              max_tokens: settings.maxTokens,
              stream: true,
            }),
            signal: abortController.current.signal,
          });

          if (!shellResponse.ok) {
            throw new Error(`HTTP ${shellResponse.status}: ${await shellResponse.text()}`);
          }

          const shellReader = shellResponse.body!.getReader();
          const shellDecoder = new TextDecoder();
          let shellBuffer = '';
          let shellFullContent = '';

          while (true) {
            const { done, value } = await shellReader.read();
            if (done) break;

            shellBuffer += shellDecoder.decode(value, { stream: true });
            const shellLines = shellBuffer.split('\n');

            for (let i = 0; i < shellLines.length - 1; i++) {
              const line = shellLines[i].trim();
              if (!line || line === '[DONE]') continue;
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  const delta = data.choices?.[0]?.delta;
                  if (delta?.content) shellFullContent += delta.content;
                } catch {/* skip invalid JSON */}
              }
            }
            shellBuffer = shellLines[shellLines.length - 1];

            setMessages((prev) =>
              prev.map((m) => (m.id === shellTurnId ? { ...m, content: shellFullContent } : m))
            );
          }
        } catch (err) {
          if (err instanceof Error && err.message !== 'The operation was aborted') {
            setError(err.message);
          }
        } finally {
          setIsStreaming(false);
          setMessages((prev) =>
            prev.map((m) => (m.id === shellTurnId ? { ...m, isStreaming: false } : m))
          );
        }
        return;
      }

      // PLAN/APPLY MODE: usa PromptBuilder con GraphLoader + constitution + skills
      const modeInstruction = settings.agentMode === 'plan'
        ? "You are in PLAN mode. Outline your approach and ask for feedback. Do NOT use any tools to modify files yet."
        : "You are in APPLY mode. Use tools directly to implement your plan.";

      let builtMessages: LLMChatMessage[];
      let routeModel: string;
      let routeGrammar: string | undefined;

      if (content?.trim()) {
        try {
          const result = await buildPrompt(content.trim(), messages, modeInstruction);
          builtMessages = result.messages;
          routeModel = result.route.model;
          routeGrammar = result.route.grammar;
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Prompt builder error';
          setError(errorMsg);
          setIsStreaming(false);
          return;
        }
      } else if (sessionRef.current) {
        builtMessages = [];
        routeModel = '';
        routeGrammar = undefined;
      } else {
        return;
      }

      const activeSettings = {
        ...settings,
        modelName: routeModel || settings.modelName,
        grammar: routeGrammar || settings.grammar,
      };

      let session = sessionRef.current;

      if (content?.trim()) {
        const userMessage: ChatMessage = {
          id: generateId(),
          role: 'user',
          content: content.trim(),
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMessage]);

        historyRef.current = builtMessages;

        const turnId = generateId();
        session = new AgentSessionManager(turnId);
        sessionRef.current = session;

        const assistantMessage: ChatMessage = {
          id: turnId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          isStreaming: true,
          toolCalls: [],
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else if (session) {
        // session already set — continue multi-turn with existing historyRef
      } else {
        return;
      }

      try {
        let shouldContinue = true;
        while (shouldContinue) {
          const turn = session.getTurn();
          const conversation = assembleConversation(historyRef.current, turn);
          
          abortController.current = new AbortController();
          const parser = new StreamParser();
          session.setStreaming(true);

          for await (const chunk of streamChat(conversation, activeSettings, abortController.current.signal)) {
            const results = parser.parseChunk(chunk);
            session.updateFromParser(results);
            
            const updatedTurn = session.getTurn();
            syncTurnToUI(updatedTurn);
          }

          session.setStreaming(false);
          const finalTurn = session.getTurn();
          syncTurnToUI(finalTurn);

          // Handle auto-approval or wait for manual
          const pendingCalls = finalTurn.toolCalls.filter(tc => tc.state === 'pending_approval');
          if (pendingCalls.length > 0) {
            if (activeSettings.writePermissionMode === 'allow') {
              for (const tc of pendingCalls) {
                await performExecution(session, tc);
              }
              // Loop continues
            } else {
              shouldContinue = false; // Wait for manual approval
            }
          } else {
            const hasResults = finalTurn.toolCalls.some(tc => tc.state === 'succeeded' || tc.state === 'failed' || tc.state === 'denied');
            if (hasResults && finalTurn.status === 'done') {
              shouldContinue = false; 
            } else {
              shouldContinue = false;
            }
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
        if (errorMessage !== 'The operation was aborted') {
          session.setError(errorMessage);
          setError(errorMessage);
          syncTurnToUI(session.getTurn());
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, settings, rootPath, executeTool]
  );

  const syncTurnToUI = (turn: any) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === turn.id
          ? { 
              ...msg, 
              content: turn.content, 
              reasoning: turn.reasoning,
              isStreaming: turn.isStreaming,
              toolCalls: turn.toolCalls 
            }
          : msg
      )
    );
  };

  const performExecution = async (session: AgentSessionManager, tc: any) => {
    session.updateToolState(tc.id, 'executing');
    syncTurnToUI(session.getTurn());
    
    const result = await executeTool(tc);
    session.updateToolState(tc.id, 'succeeded', result);
    syncTurnToUI(session.getTurn());
  };

  const approveTool = useCallback(async (toolCallId: string) => {
    if (!sessionRef.current) return;
    const turn = sessionRef.current.getTurn();
    const tc = turn.toolCalls.find(t => t.id === toolCallId);
    if (!tc) return;

    await performExecution(sessionRef.current, tc);
    
    const updatedTurn = sessionRef.current.getTurn();
    const hasPending = updatedTurn.toolCalls.some(t => t.state === 'pending_approval');
    if (!hasPending) {
      sendMessage();
    }
  }, [executeTool, sendMessage]);

  const denyTool = useCallback((toolCallId: string) => {
    if (!sessionRef.current) return;
    sessionRef.current.updateToolState(toolCallId, 'denied', 'Error: User denied the request.');
    syncTurnToUI(sessionRef.current.getTurn());
    
    const updatedTurn = sessionRef.current.getTurn();
    const hasPending = updatedTurn.toolCalls.some(t => t.state === 'pending_approval');
    if (!hasPending) {
      sendMessage();
    }
  }, [sendMessage]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
    sessionRef.current = null;
    historyRef.current = [];
  }, []);

  const abort = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
  }, []);

  const saveSession = useCallback(async (name: string) => {
    try {
      const adapter = getFileSystemAdapter();
      const data = JSON.stringify({
        messages,
        history: historyRef.current
      }, null, 2);
      const fileName = name.endsWith('.json') ? name : `${name}.json`;
      // Ensure .chat-sessions folder exists? The adapter might need to handle it.
      // For now, assume it's okay or will fail gracefully if folder missing.
      await adapter.writeFile(`.chat-sessions/${fileName}`, data);
      return true;
    } catch (err) {
      console.error('Failed to save session', err);
      return false;
    }
  }, [messages]);

  const loadSession = useCallback(async (path: string) => {
    try {
      const adapter = getFileSystemAdapter();
      const content = await adapter.readFile(path);
      const data = JSON.parse(content);
      setMessages(data.messages);
      historyRef.current = data.history;
      sessionRef.current = null;
      return true;
    } catch (err) {
      console.error('Failed to load session', err);
      return false;
    }
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearHistory,
    abort,
    approveTool,
    denyTool,
    saveSession,
    loadSession
  };
}
