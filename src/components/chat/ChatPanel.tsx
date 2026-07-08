import { useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType } from '../../types/index';
import { PanelHeader } from '../layout/PanelHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  messages: ChatMessageType[];
  isStreaming?: boolean;
  onSendMessage: (content: string) => void;
  onAbort?: () => void;
  onApprove?: (id: string) => void;
  onDeny?: (id: string) => void;
  error?: string | null;
}

export function ChatPanel({
  messages,
  isStreaming,
  onSendMessage,
  onAbort,
  onApprove,
  onDeny,
  error,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PanelHeader title="Chat" />

      {error && (
        <div className="px-4 py-2 bg-red-900 border-b border-red-700 text-red-100 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-sm mb-2">No messages yet</p>
              <p className="text-xs text-gray-600">Start a conversation to get help coding</p>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <div key={message.id} className="group">
                <ChatMessage 
                  message={message} 
                  onApprove={onApprove}
                  onDeny={onDeny}
                />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput
        onSend={onSendMessage}
        isStreaming={isStreaming}
        onAbort={onAbort}
      />
    </div>
  );
}
