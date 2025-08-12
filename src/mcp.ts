export interface McpTool {
  name: string;
  description?: string;
  server: string;
}

export async function discoverTools(server: string): Promise<McpTool[]> {
  const res = await fetch(`${server}/tools`);
  if (!res.ok) throw new Error(`MCP discover failed: ${res.status}`);
  const data = await res.json() as { name: string; description?: string }[];
  return data.map(t => ({ ...t, server }));
}

export async function callTool(tool: McpTool, input: string): Promise<string> {
  const res = await fetch(`${tool.server}/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool: tool.name, input })
  });
  if (!res.ok) throw new Error(`MCP call failed: ${res.status}`);
  const data = await res.json();
  return data.output ?? '';
}
