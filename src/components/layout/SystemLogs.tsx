import { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { LogEntry } from '../../hooks/useLogger';

interface SystemLogsProps {
  logs: LogEntry[];
  onClear: () => void;
}

export function SystemLogs({ logs, onClear }: SystemLogsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isExpanded]);

  if (logs.length === 0 && !isExpanded) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 transition-all duration-300 z-50 ${isExpanded ? 'h-64' : 'h-10'}`}>
      <div 
        className="flex items-center justify-between px-4 h-10 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">System Logs</span>
          <span className="ml-2 px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-500">
            {logs.length}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="text-[10px] text-gray-500 hover:text-gray-300"
          >
            Clear
          </button>
          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
        </div>
      </div>

      {isExpanded && (
        <div 
          ref={scrollRef}
          className="p-2 h-[calc(16rem-2.5rem)] overflow-y-auto font-mono text-[11px] scrollbar-thin scrollbar-thumb-gray-700"
        >
          {logs.length === 0 ? (
            <div className="text-gray-600 italic p-2">No logs yet...</div>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2 p-1 rounded hover:bg-gray-850 group">
                  <span className="text-gray-600 shrink-0">
                    [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
                  </span>
                  {log.type === 'error' && <AlertCircle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />}
                  {log.type === 'success' && <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />}
                  {log.type === 'info' && <Info className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />}
                  <span className={`${
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'success' ? 'text-green-400' : 
                    'text-gray-300'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
