import { useFileSystem } from '../../hooks/useFileSystem';
import { useChat } from '../../hooks/useChat';
import { useSettingsContext } from '../../context/SettingsContext';
import { useWorkspaceContext } from '../../context/WorkspaceContext';
import { TopBar } from './TopBar';
import { ResizablePanel } from './ResizablePanel';
import { FileTree } from '../file-tree/FileTree';
import { FileViewer } from '../editor/FileViewer';
import { ChatPanel } from '../chat/ChatPanel';
import { SettingsPanel } from '../settings/SettingsPanel';
import { SystemLogs } from './SystemLogs';
import { AboutDialog } from './AboutDialog';

export function Workspace() {
  const { settings } = useSettingsContext();
  const { settingsPanelOpen, aboutDialogOpen, logs, clearLogs, rootPath } = useWorkspaceContext();
  const fileSystem = useFileSystem();
  const chat = useChat(settings, rootPath, fileSystem.refreshFile);

  return (
    <div className={`flex flex-col h-screen ${settings.theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-white text-gray-900'} pb-10 transition-colors duration-200`}>
      <TopBar 
        onClearChat={chat.clearHistory} 
        onOpenProject={fileSystem.openProject}
        onSaveFile={() => fileSystem.currentFile && fileSystem.updateFile(fileSystem.currentFile.content)}
        onCloseFile={fileSystem.closeFile}
        currentFilePath={fileSystem.currentFile?.path}
        onSaveSession={chat.saveSession}
        onLoadSession={chat.loadSession}
        rootPath={rootPath}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: File Tree */}
        <ResizablePanel defaultWidth={280} minWidth={200} maxWidth={500} className="bg-gray-900 border-r border-gray-700">
          <FileTree
            tree={fileSystem.fileTree}
            currentFile={fileSystem.currentFile?.path}
            onFileSelect={fileSystem.openFile}
            isLoading={fileSystem.isLoading}
            onRefresh={() => fileSystem.loadDirectory(rootPath || '')}
          />
        </ResizablePanel>

        {/* Center Panel: Editor */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-950">
          <FileViewer
            file={fileSystem.currentFile}
            openFiles={fileSystem.openFiles}
            onUpdate={fileSystem.updateFile}
            onFileChange={fileSystem.setFileContent}
            onFileSelect={fileSystem.openFile}
            onCloseFile={fileSystem.closeFile}
            error={fileSystem.error}
          />
        </div>

        {/* Right Panel: Chat */}
        <ResizablePanel defaultWidth={350} minWidth={250} maxWidth={600} className="bg-gray-900 border-l border-gray-700 flex flex-col">
          <ChatPanel
            messages={chat.messages}
            isStreaming={chat.isStreaming}
            onSendMessage={chat.sendMessage}
            onAbort={chat.abort}
            onApprove={chat.approveTool}
            onDeny={chat.denyTool}
            error={chat.error}
          />
        </ResizablePanel>
      </div>

      <SystemLogs logs={logs} onClear={clearLogs} />

      {/* Settings Panel */}
      {settingsPanelOpen && <SettingsPanel />}

      {/* About Dialog */}
      {aboutDialogOpen && <AboutDialog />}
    </div>
  );
}
