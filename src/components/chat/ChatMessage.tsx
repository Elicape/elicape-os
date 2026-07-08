import React from 'react';
import { Copy, Check, Wrench, ShieldAlert, Loader2, XCircle, CheckCircle2, Brain } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../../types/index';
import { AgentToolCall } from '../../lib/agent-kernel/types';

interface ChatMessageProps {
  message: ChatMessageType;
  onApprove?: (id: string) => void;
  onDeny?: (id: string) => void;
}

export function ChatMessage({ message, onApprove, onDeny }: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  
  const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const renderToolCall = (tc: AgentToolCall) => {
    const isPending = tc.state === 'pending_approval';
    const isExecuting = tc.state === 'executing';
    const isSuccess = tc.state === 'succeeded';
    const isFailed = tc.state === 'failed';
    const isDenied = tc.state === 'denied';

    return (
      <div key={tc.id} className="mt-3 overflow-hidden rounded-lg border border-gray-800 bg-gray-950/50">
        <div className="flex items-center justify-between px-3 py-2 bg-gray-900/50 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Wrench className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-mono font-medium text-gray-300">{tc.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isPending && <span className="text-[10px] text-yellow-500 font-medium uppercase tracking-tight">Pending Approval</span>}
            {isExecuting && <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />}
            {isSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
            {isFailed && <XCircle className="w-3.5 h-3.5 text-red-500" />}
            {isDenied && <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />}
          </div>
        </div>

        <div className="p-3">
          <div className="text-[11px] font-mono text-gray-500 mb-2">Arguments:</div>
          <pre className="text-xs font-mono text-gray-400 bg-black/30 p-2 rounded border border-gray-800/50 overflow-x-auto">
            {JSON.stringify(tc.arguments, null, 2)}
          </pre>

          {isPending && (
            <div className="mt-3 flex gap-2">
              <button 
                onClick={() => onApprove?.(tc.id)}
                className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
              <button 
                onClick={() => onDeny?.(tc.id)}
                className="flex-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" /> Deny
              </button>
            </div>
          )}

          {(isSuccess || isFailed || isDenied) && (
            <div className="mt-3 pt-3 border-t border-gray-800/50">
              <div className="text-[11px] font-mono text-gray-500 mb-2">Result:</div>
              <div className={`text-xs font-mono p-2 rounded border ${
                isSuccess ? 'text-green-400 bg-green-950/20 border-green-900/30' : 
                isDenied ? 'text-orange-400 bg-orange-950/20 border-orange-900/30' :
                'text-red-400 bg-red-950/20 border-red-900/30'
              }`}>
                {tc.result || tc.error || (isDenied ? 'Execution denied by user' : 'No output')}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex gap-3 px-4 py-4 ${isUser ? 'bg-gray-800/30' : 'bg-gray-900'}`}>
      <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-semibold ${
        isUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
      }`}>
        {isUser ? 'U' : 'A'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-400">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-gray-600">{time}</span>
        </div>

        {message.reasoning && (
          <details className="mb-2 group/reasoning">
            <summary className="text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-400 transition-colors flex items-center gap-1.5 w-max select-none">
              <Brain className="w-3.5 h-3.5" />
              <span>Thought Process</span>
            </summary>
            <div className="mt-2 text-[13px] text-gray-400 whitespace-pre-wrap leading-relaxed border-l-2 border-gray-700 pl-3 ml-1">
              {message.reasoning}
              {message.isStreaming && !message.content && <span className="animate-pulse ml-1">▋</span>}
            </div>
          </details>
        )}

        {message.content && (
          <div className="text-sm text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
            {message.isStreaming && <span className="animate-pulse">▋</span>}
          </div>
        )}

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-3">
            {message.toolCalls.map(renderToolCall)}
          </div>
        )}
      </div>

      {isAssistant && !message.isStreaming && message.content && (
        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-1 rounded hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
          title="Copy message"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-gray-500" />
          )}
        </button>
      )}
    </div>
  );
}
