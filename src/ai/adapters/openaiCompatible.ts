import { AiProvider, ChatMessage, ToolDefinition, CompletionOptions } from '../provider';

export class OpenAiCompatibleProvider implements AiProvider {
  id = 'openai-compatible';

  constructor(
    private endpoint = 'https://api.openai.com/v1',
    private apiKey = '',
    private model = 'gpt-4o'
  ) {}

  async complete(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    opts?: CompletionOptions
  ): Promise<string> {
    const response = await fetch(`${this.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: opts?.temperature ?? 0.0
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || '';
  }
}
