export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ParserResult {
  type: 'text' | 'tool_call' | 'think' | 'error';
  content: string;
  toolCall?: ToolCall;
  error?: string;
}

export class StreamParser {
  private buffer: string = '';
  private isInsideToolCall: boolean = false;
  private currentToolCallContent: string = '';
  private isInsideThink: boolean = false;

  parseChunk(chunk: string): ParserResult[] {
    const results: ParserResult[] = [];
    this.buffer += chunk;

    while (this.buffer.length > 0) {
      if (this.isInsideToolCall) {
        const endTagIndex = this.buffer.indexOf('</tool_call>');
        
        if (endTagIndex === -1) {
          // End tag not found, everything is tool call content
          this.currentToolCallContent += this.buffer;
          this.buffer = '';
        } else {
          // End tag found
          this.currentToolCallContent += this.buffer.substring(0, endTagIndex);
          this.isInsideToolCall = false;
          
          try {
            const toolCall = JSON.parse(this.currentToolCallContent) as ToolCall;
            results.push({ 
              type: 'tool_call', 
              content: `<tool_call>${this.currentToolCallContent}</tool_call>`,
              toolCall 
            });
          } catch (e) {
            console.error('Failed to parse tool call JSON:', this.currentToolCallContent);
            results.push({
              type: 'error',
              content: `<tool_call>${this.currentToolCallContent}</tool_call>`,
              error: `Invalid JSON in tool call: ${e instanceof Error ? e.message : String(e)}`
            });
          }
          
          this.buffer = this.buffer.substring(endTagIndex + '</tool_call>'.length);
          this.currentToolCallContent = '';
        }
      } else if (this.isInsideThink) {
        const endTagIndex = this.buffer.indexOf('</think>');
        if (endTagIndex === -1) {
          // Check for partial end tag
          const partialEndIndex = this.buffer.lastIndexOf('<');
          if (partialEndIndex !== -1 && '</think>'.startsWith(this.buffer.substring(partialEndIndex))) {
            const thinkContent = this.buffer.substring(0, partialEndIndex);
            if (thinkContent) {
              results.push({ type: 'think', content: thinkContent });
            }
            this.buffer = this.buffer.substring(partialEndIndex);
            break;
          } else {
            results.push({ type: 'think', content: this.buffer });
            this.buffer = '';
          }
        } else {
          const thinkContent = this.buffer.substring(0, endTagIndex);
          if (thinkContent) {
            results.push({ type: 'think', content: thinkContent });
          }
          this.isInsideThink = false;
          this.buffer = this.buffer.substring(endTagIndex + '</think>'.length);
        }
      } else {
        const toolCallStart = this.buffer.indexOf('<tool_call>');
        const thinkStart = this.buffer.indexOf('<think>');
        
        let nextStartTag = -1;
        let isNextTool = false;
        
        if (toolCallStart !== -1 && thinkStart !== -1) {
          nextStartTag = Math.min(toolCallStart, thinkStart);
          isNextTool = toolCallStart < thinkStart;
        } else if (toolCallStart !== -1) {
          nextStartTag = toolCallStart;
          isNextTool = true;
        } else if (thinkStart !== -1) {
          nextStartTag = thinkStart;
          isNextTool = false;
        }

        if (nextStartTag === -1) {
          // No start tag found, check for partial tag
          const partialTagIndex = this.buffer.lastIndexOf('<');
          if (partialTagIndex !== -1 && 
              ('<tool_call>'.startsWith(this.buffer.substring(partialTagIndex)) || 
               '<think>'.startsWith(this.buffer.substring(partialTagIndex)))) {
            const textContent = this.buffer.substring(0, partialTagIndex);
            if (textContent) {
              results.push({ type: 'text', content: textContent });
            }
            this.buffer = this.buffer.substring(partialTagIndex);
            break; // Hold the partial tag
          } else {
            results.push({ type: 'text', content: this.buffer });
            this.buffer = '';
          }
        } else {
          // Start tag found
          const textContent = this.buffer.substring(0, nextStartTag);
          if (textContent) {
            results.push({ type: 'text', content: textContent });
          }
          
          if (isNextTool) {
            this.isInsideToolCall = true;
            this.buffer = this.buffer.substring(nextStartTag + '<tool_call>'.length);
          } else {
            this.isInsideThink = true;
            this.buffer = this.buffer.substring(nextStartTag + '<think>'.length);
          }
        }
      }
    }

    return results;
  }

  reset() {
    this.buffer = '';
    this.isInsideToolCall = false;
    this.currentToolCallContent = '';
    this.isInsideThink = false;
  }
}
