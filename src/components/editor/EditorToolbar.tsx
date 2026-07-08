import { Save } from 'lucide-react';
import { PanelHeader } from '../layout/PanelHeader';

interface EditorToolbarProps {
  filePath?: string;
  hasUnsavedChanges?: boolean;
  onSave?: () => void;
  isLoading?: boolean;
}

export function EditorToolbar({
  filePath,
  hasUnsavedChanges,
  onSave,
  isLoading,
}: EditorToolbarProps) {
  return (
    <PanelHeader
      title={filePath ? `${filePath.split('/').pop()}` : 'Editor'}
      actions={
        filePath && (
          <button
            onClick={onSave}
            disabled={isLoading || !hasUnsavedChanges}
            className="p-1.5 rounded hover:bg-gray-800 transition-colors disabled:opacity-50 text-gray-400 hover:text-gray-200"
            title={hasUnsavedChanges ? 'Save file' : 'No changes'}
          >
            <Save className="w-3.5 h-3.5" />
          </button>
        )
      }
    />
  );
}
