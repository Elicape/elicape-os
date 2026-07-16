import { useState, useCallback } from 'react';
import { WorkspaceSettings } from '../types/index';
import { getStorageItem, setStorageItem } from '../lib/storage';

const SETTINGS_KEY = 'workspace_settings';

const DEFAULT_SETTINGS: WorkspaceSettings = {
  endpoint: 'http://127.0.0.1:8080/v1',
  modelName: 'qwen3-coder-3b',
  systemPrompt: 'You are a helpful coding assistant. Always wrap your internal reasoning and thought process inside <think> and </think> tags before providing your final answer. Provide concise, practical answers.',
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
  writePermissionMode: 'ask',
  binaryPath: 'bin/llama-server',
  modelPath: 'models/Qwen3-coder-3.4b-20x-e32-q8_0.gguf',
  serverPort: 8080,
  serverArgs: '-cnv',
  templatePath: 'qwen3-coder-template.jinja',
  autoStartServer: false,
  autosaveEnabled: false,
  theme: 'dark',
  fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  agentMode: 'apply'
};

export function useSettings() {
  const [settings, setSettings] = useState<WorkspaceSettings>(() => {
    const stored = getStorageItem<WorkspaceSettings>(SETTINGS_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS;
  });

  const updateSettings = useCallback((updates: Partial<WorkspaceSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...updates };
      setStorageItem(SETTINGS_KEY, merged);
      return merged;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setStorageItem(SETTINGS_KEY, DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}
