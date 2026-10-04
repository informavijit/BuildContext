export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface AiProvider {
  id: string;
  complete(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    opts?: CompletionOptions
  ): Promise<string>;
}
