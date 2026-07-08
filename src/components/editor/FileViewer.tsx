import { useState, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism-tomorrow.css'; // Premium dark theme

import { EditorToolbar } from './EditorToolbar';
import { EditorTabs } from './EditorTabs';
import { useSettingsContext } from '../../context/SettingsContext';
import { OpenFile } from '../../types/index';

interface FileViewerProps {
  file?: OpenFile | null;
  openFiles: OpenFile[];
  onUpdate?: (content: string) => void;
  onFileChange: (path: string, content: string, hasUnsavedChanges: boolean) => void;
  onFileSelect: (path: string) => void;
  onCloseFile: (path: string) => void;
  error?: string | null;
}

export function FileViewer({ 
  file, 
  openFiles,
  onUpdate, 
  onFileChange,
  onFileSelect,
  onCloseFile,
  error 
}: FileViewerProps) {
  const [content, setContent] = useState('');
  const { settings } = useSettingsContext();

  useEffect(() => {
    if (file) {
      setContent(file.content);
    } else {
      setContent('');
    }
  }, [file?.path, file?.content]);

  // Autosave loop
  useEffect(() => {
    if (settings.autosaveEnabled && file?.hasUnsavedChanges && file) {
      const timer = setTimeout(() => {
        handleSave();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [content, settings.autosaveEnabled, file?.hasUnsavedChanges, file]);

  const highlight = (code: string) => {
    if (!file) return code;
    const ext = file.path.split('.').pop() || '';
    let lang = 'javascript';
    if (['ts', 'tsx'].includes(ext)) lang = 'typescript';
    else if (['js', 'jsx'].includes(ext)) lang = 'javascript';
    else if (ext === 'json') lang = 'json';
    else if (ext === 'css') lang = 'css';
    else if (ext === 'md') lang = 'markdown';

    return prism.highlight(code, prism.languages[lang] || prism.languages.javascript, lang);
  };

  const handleSave = () => {
    if (file) {
      onUpdate?.(content);
    }
  };

  const onValueChange = (newContent: string) => {
    setContent(newContent);
    if (file) {
      onFileChange(file.path, newContent, true);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: settings.fontFamily }}>
      <EditorTabs 
        openFiles={openFiles}
        currentFile={file || null}
        onSelectFile={onFileSelect}
        onCloseFile={onCloseFile}
      />
      
      <EditorToolbar
        filePath={file?.path}
        hasUnsavedChanges={file?.hasUnsavedChanges || false}
        onSave={handleSave}
      />

      {error && (
        <div className="px-4 py-2 bg-red-900 border-b border-red-700 text-red-100 text-[10px] font-mono">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto bg-gray-950 custom-scrollbar">
        {file ? (
          <Editor
            value={content}
            onValueChange={onValueChange}
            highlight={highlight}
            padding={20}
            className="font-mono text-sm min-h-full"
            style={{
              fontFamily: '"Fira Code", "Fira Mono", monospace',
              fontSize: 13,
              outline: 'none',
              backgroundColor: 'transparent',
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-sm mb-2 font-semibold">No Active File</p>
              <p className="text-xs text-gray-600">Select a file to begin editing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
