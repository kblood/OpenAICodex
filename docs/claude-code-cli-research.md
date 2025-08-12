# Research: Claude Code-style LLM CLI Client

This document aggregates information and design notes for building a CLI client inspired by **Claude Code**. The goal is to understand the expected features before implementing a TypeScript-based tool.

## Goals and Context

- Offer an interactive command line interface for chatting with an LLM.
- Provide capabilities that mirror the developer-focused workflow of Claude Code.
- Start with local model support via [Ollama](https://github.com/ollama/ollama) but be extensible for other providers.
- Leverage the **Model Context Protocol (MCP)** so that tools such as filesystem access, command execution, or web search can be added as servers.

## Core Features Observed in Claude Code

1. **Conversation-first workflow**
   - Use the terminal as a chat window.
   - Commands prefixed with special characters (e.g. `/` commands) for actions like running code, clearing context, etc.
   - Streamed responses for quicker feedback.

2. **Tight integration with the local environment**
   - Read, create and modify files on disk.
   - Maintain an in-memory view of the current project tree for contextual reasoning.
   - Ability to apply patches or create new files suggested by the LLM.
   - Diff viewing and patch generation commands aid iterative development.
   - Current prototype exposes `/tree` and `/summary` for directory views.

3. **Command execution**
   - Run shell commands from within the conversation (e.g. `npm test`).
   - Capture stdout/stderr and send the result back to the model.
   - Interactive shell sessions and a `/kill` command allow process control.
   - Offer safety confirmations before executing destructive commands.

4. **Web search and browsing**
   - Invoke an external search service when the model requires up-to-date information.
   - Summaries of relevant results are passed back to the model.
   - Initial implementation uses the DuckDuckGo Instant Answer API.

5. **MCP server architecture**
   - The client connects to multiple MCP servers which expose tools such as filesystem, search, or shell.
   - Tools are described with JSON schemas so the model can call them reliably.
   - New capabilities can be added by running additional MCP servers.

6. **Local-first model execution**
   - Out of the box support for running a model via Ollama on `http://localhost:11434`.
   - Should allow selecting different models or remote endpoints through configuration.
   - Stream responses for faster feedback and allow the host to be overridden with `--host` or `OLLAMA_HOST`.

## Suggested Implementation Plan

- **Tech stack**: TypeScript + Node.js. Use packages like `commander` for CLI parsing and `node-fetch` or `axios` for HTTP requests.
- **Model API wrapper**: Create a lightweight client for the Ollama REST API to send prompts and stream responses.
- **MCP client**: Implement a basic MCP client that can connect to local MCP servers and expose their tools to the model.
- **File system tools**: Provide MCP tools for reading, writing, listing, and searching files.
- **Command execution tool**: Implement an MCP tool that executes shell commands with controlled environment and returns output.
- **Web search tool**: Start with a simple DuckDuckGo or Bing Web Search integration for proof of concept; make provider configurable.
- **Session management**: Maintain chat history, handle multi-turn conversations, and support exporting or clearing history.
- **Extensibility**: Design plugin interfaces so additional MCP servers (e.g. git operations, database access) can be added later.

## Additional Research and Reverse Engineering Notes

- The official `anthropics/claude-code` repository reveals an open-source Node.js 18+ CLI distributed on npm.
- Source inspection shows TypeScript modules that register tools for filesystem access, shell commands and git operations via an internal RPC layer resembling MCP.
- The CLI exposes slash commands like `/bug` for feedback and integrates tightly with git workflows.
- Reverse-engineering reports note the binary packages embed this RPC layer to broker tool calls from the model.
- Decompiling the published npm package shows an `esbuild` bundled script with modules for tool registration, streaming chat handling, and a lightweight JSON-RPC dispatcher. Tools are described with JSON schemas and executed in child processes.

## Open Questions

- Which authentication mechanisms are needed for remote LLM providers?
- How should the CLI manage sensitive operations (e.g., running scripts) securely?
- What is the best UX for browsing search results or file diffs in a terminal-only environment?

This research will guide the subsequent implementation of the CLI client.
