import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming?: boolean;
  onAbort?: () => void;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  isStreaming,
  onAbort,
  disabled,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (input.trim() && !isStreaming && !disabled) {
        onSend(input);
        setInput('');
      }
    }
  };

  const handleSend = () => {
    if (input.trim() && !isStreaming && !disabled) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div className="px-4 py-3 bg-gray-900 border-t border-gray-700 flex-shrink-0">
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'Waiting for response...' : 'Type a message... (Ctrl+Enter to send)'}
          disabled={isStreaming || disabled}
          className="flex-1 resize-none bg-gray-800 text-gray-100 px-3 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed max-h-30"
        />

        {isStreaming ? (
          <button
            onClick={onAbort}
            className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 transition-colors text-white text-sm font-medium flex items-center gap-2"
            title="Stop generation"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {input && (
        <div className="mt-1 text-xs text-gray-500">
          {input.length} characters
        </div>
      )}
    </div>
  );
}
