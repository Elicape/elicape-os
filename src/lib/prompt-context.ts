import { PromptContext, FileNode } from '../types/index';

export function buildPromptContext(context: PromptContext): string {
  const parts: string[] = [];

  if (context.selectedFilePath) {
    parts.push(`Current file: ${context.selectedFilePath}`);
  }

  if (context.selectedFileContent) {
    parts.push('File content:');
    parts.push('```');
    parts.push(context.selectedFileContent);
    parts.push('```');
  }

  if (context.openTabs && context.openTabs.length > 0) {
    parts.push(`Open tabs: ${context.openTabs.join(', ')}`);
  }

  if (context.fileTreeSummary) {
    parts.push('Project structure:');
    parts.push(context.fileTreeSummary);
  }

  return parts.join('\n\n');
}

export function serializeFileTree(node: FileNode, indent = ''): string {
  const prefix = node.type === 'folder' ? '📁 ' : '📄 ';
  let result = `${indent}${prefix}${node.name}\n`;

  if (node.children && node.type === 'folder') {
    for (const child of node.children) {
      result += serializeFileTree(child, indent + '  ');
    }
  }

  return result;
}

export interface ContextBuilderOptions {
  selectedFile?: {
    path: string;
    content: string;
  };
  openTabs?: string[];
  fileTree?: FileNode;
}

export function buildContextString(options: ContextBuilderOptions): string {
  const context: PromptContext = {};

  if (options.selectedFile) {
    context.selectedFilePath = options.selectedFile.path;
    context.selectedFileContent = options.selectedFile.content;
  }

  if (options.openTabs) {
    context.openTabs = options.openTabs;
  }

  if (options.fileTree) {
    context.fileTreeSummary = serializeFileTree(options.fileTree);
  }

  return buildPromptContext(context);
}
