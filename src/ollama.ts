import type { Message } from './types.js';

/**
 * Chat with an Ollama model. Streams the response so callers can display
 * partial output as it arrives.
 */
export async function chatOllama(
  messages: Message[],
  model: string,
  host = process.env.OLLAMA_HOST || 'http://localhost:11434',
  onToken?: (token: string) => void
): Promise<string> {
  const res = await fetch(`${host.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true })
  });
  if (!res.ok || !res.body) {
    throw new Error(`Ollama request failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(Boolean);
    for (const line of lines) {
      const data = JSON.parse(line);
      const content = data.message?.content || '';
      if (content) {
        full += content;
        onToken?.(content);
      }
      if (data.done) return full;
    }
  }

  return full;
}

export async function listModels(
  host = process.env.OLLAMA_HOST || 'http://localhost:11434'
): Promise<string[]> {
  const res = await fetch(`${host.replace(/\/$/, '')}/api/tags`);
  if (!res.ok) {
    throw new Error(`Ollama request failed: ${res.status}`);
  }
  const data = await res.json();
  return data.models?.map((m: any) => m.name) ?? [];
}
