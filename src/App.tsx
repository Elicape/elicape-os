import { SettingsProvider } from './context/SettingsContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { LlamaServerProvider } from './context/LlamaServerContext';
import { Workspace } from './components/layout/Workspace';

function App() {
  return (
    <SettingsProvider>
      <WorkspaceProvider>
        <LlamaServerProvider>
          <Workspace />
        </LlamaServerProvider>
      </WorkspaceProvider>
    </SettingsProvider>
  );
}

export default App;
