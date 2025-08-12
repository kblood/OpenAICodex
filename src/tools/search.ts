export async function webSearch(query: string): Promise<string> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`search failed: ${res.status}`);
  }
  const data = await res.json() as any;
  const lines: string[] = [];
  if (data.AbstractText) {
    lines.push(data.AbstractText);
  }
  const topics: any[] = Array.isArray(data.RelatedTopics) ? data.RelatedTopics : [];
  for (const t of topics.filter(t => t.Text && t.FirstURL).slice(0, 3)) {
    lines.push(`${t.Text} - ${t.FirstURL}`);
  }
  const results: any[] = Array.isArray(data.Results) ? data.Results : [];
  for (const r of results.filter(r => r.Text && r.FirstURL).slice(0, 3)) {
    lines.push(`${r.Text} - ${r.FirstURL}`);
  }
  return lines.join('\n');
}
