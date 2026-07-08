import { ToolCall } from '../streamParser';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  validate: (args: any) => string | null; // returns error message or null if valid
}

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  read_file: {
    name: 'read_file',
    description: 'Read the contents of a file',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string' },
      },
      required: ['path'],
    },
    validate: (args) => (!args.path ? 'Missing path argument' : null),
  },
  write_file: {
    name: 'write_file',
    description: 'Write content to a file',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['path', 'content'],
    },
    validate: (args) => {
      if (!args.path) return 'Missing path argument';
      if (args.content === undefined) return 'Missing content argument';
      return null;
    },
  },
  create_file: {
    name: 'create_file',
    description: 'Create a new file with content',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['path'],
    },
    validate: (args) => (!args.path ? 'Missing path argument' : null),
  },
  list_dir: {
    name: 'list_dir',
    description: 'List files and directories in a given path',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string' },
      },
      required: ['path'],
    },
    validate: (args) => (!args.path ? 'Missing path argument' : null),
  },
  run_command: {
    name: 'run_command',
    description: 'Execute a shell command and return its output',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string' },
      },
      required: ['command'],
    },
    validate: (args) => (!args.command ? 'Missing command argument' : null),
  },
};

export function validateToolCall(call: ToolCall): string | null {
  const definition = TOOL_REGISTRY[call.name];
  if (!definition) return `Unknown tool: ${call.name}`;
  return definition.validate(call.arguments);
}
