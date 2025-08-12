# OpenAICodex

TypeScript CLI inspired by Claude Code with local Ollama support.

## Usage

```
npm run build
node dist/index.js
```

Within the CLI use slash commands:

- `/models` – list available Ollama models
- `/save <file>` – save chat history to disk
- `/load <file>` – load chat history from disk
- `/compact` – summarize and shrink the conversation
- `/read <file>` – show file contents
- `/write <file> <content>` – write a file
- `/run <cmd>` – execute a shell command (with safety prompts)
- `/shell [cmd]` – run an interactive shell or command
- `/kill` – terminate the last running command
- `/search <query>` – perform web search
- `/tree [dir]` – show directory tree
- `/summary [dir]` – show file and directory counts
- `/diff <a> <b>` – view diff between two files
- `/patch <file> <content>` – generate a patch against file
- `/tools` – list MCP tools discovered from remote servers
- `/call <tool> <input>` – invoke an MCP tool
- `/exit` – quit the session

Options:

- `--model` – Ollama model (default `llama2`)
- `--host` – Ollama host URL
- `--mcp` – one or more MCP server URLs (or use `MCP_SERVERS` env var)

Web search is powered by the [DuckDuckGo Instant Answer API](https://api.duckduckgo.com/).
