import { AiProvider, ChatMessage, ToolDefinition, CompletionOptions } from '../provider';

export class OllamaProvider implements AiProvider {
  id = 'ollama';

  constructor(private endpoint = 'http://localhost:11434', private model = 'llama3') {}

  async complete(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    opts?: CompletionOptions
  ): Promise<string> {
    const response = await fetch(`${this.endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
        options: { temperature: opts?.temperature ?? 0.0 }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = (await response.json()) as { message?: { content?: string } };
    return data.message?.content || '';
  }
}
