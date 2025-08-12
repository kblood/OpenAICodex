#!/usr/bin/env node
import { Command } from 'commander';
import readline from 'readline';
import { chatOllama, listModels } from './ollama.js';
import { readFile, writeFile, listTree, diffFiles, generatePatch, summarizeTree } from './tools/filesystem.js';
import { runCommand, runInteractive, looksDangerous, RunningProcess } from './tools/shell.js';
import { webSearch } from './tools/search.js';
import { discoverTools, callTool, McpTool } from './mcp.js';
import type { Message } from './types.js';

const program = new Command();
program
  .name('claude')
  .description('Claude Code-style CLI')
  .option('-m, --model <model>', 'Ollama model to use', process.env.OLLAMA_MODEL || 'llama2')
  .option('--host <url>', 'Ollama host', process.env.OLLAMA_HOST || 'http://localhost:11434')
  .option('--mcp <url...>', 'MCP server URLs');

program.parse(process.argv);
const opts = program.opts();
const mcpServers: string[] = opts.mcp && opts.mcp.length ? opts.mcp : (process.env.MCP_SERVERS ? process.env.MCP_SERVERS.split(',') : []);

const remoteTools: Record<string, McpTool> = {};
async function initMcp() {
  for (const server of mcpServers) {
    try {
      const tools = await discoverTools(server);
      tools.forEach(t => (remoteTools[t.name] = t));
    } catch (err: any) {
      console.error(`MCP discover failed for ${server}:`, err.message);
    }
  }
}
initMcp();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});

const history: Message[] = [];
let active: RunningProcess | null = null;

function setActive(p: RunningProcess | null) {
  active = p;
}

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function handleCommand(line: string) {
  const [cmd, ...rest] = line.slice(1).split(' ');
  const arg = rest.join(' ');
  try {
    switch (cmd) {
      case 'exit':
        rl.close();
        return;
      case 'read':
        console.log(await readFile(arg));
        break;
      case 'write': {
        const [file, ...content] = rest;
        await writeFile(file, content.join(' '));
        console.log(`wrote ${file}`);
        break;
      }
      case 'run': {
        if (looksDangerous(arg)) {
          const ans = (await ask(`Run dangerous command "${arg}"? [y/N] `)).toLowerCase();
          if (ans !== 'y') {
            console.log('aborted');
            break;
          }
        }
        console.log(await runCommand(arg, setActive));
        setActive(null);
        break;
      }
      case 'shell': {
        const cmdToRun = arg || process.env.SHELL || 'bash';
        if (looksDangerous(cmdToRun)) {
          const ans = (await ask(`Run dangerous command "${cmdToRun}"? [y/N] `)).toLowerCase();
          if (ans !== 'y') {
            console.log('aborted');
            break;
          }
        }
        const code = await runInteractive(cmdToRun, setActive);
        setActive(null);
        console.log(`exit code ${code}`);
        break;
      }
      case 'kill': {
        if (active) {
          active.kill('SIGTERM');
          console.log('process terminated');
          setActive(null);
        } else {
          console.log('no active process');
        }
        break;
      }
      case 'search':
        console.log(await webSearch(arg));
        break;
      case 'tree':
        console.log(await listTree(arg || '.'));
        break;
      case 'summary':
        console.log(await summarizeTree(arg || '.'));
        break;
      case 'diff': {
        const [a, b] = rest;
        console.log(await diffFiles(a, b));
        break;
      }
      case 'patch': {
        const [file, ...content] = rest;
        console.log(await generatePatch(file, content.join(' ')));
        break;
      }
      case 'models':
        console.log((await listModels(opts.host)).join('\n'));
        break;
      case 'tools':
        if (Object.keys(remoteTools).length === 0) {
          console.log('no MCP tools');
        } else {
          for (const t of Object.values(remoteTools)) {
            console.log(`${t.name} (${t.server})${t.description ? ' - ' + t.description : ''}`);
          }
        }
        break;
      case 'call': {
        const [name, ...inputParts] = rest;
        const tool = remoteTools[name];
        if (!tool) {
          console.log(`Unknown MCP tool: ${name}`);
          break;
        }
        const inputStr = inputParts.join(' ');
        console.log(await callTool(tool, inputStr));
        break;
      }
      case 'save':
        await writeFile(arg || 'session.json', JSON.stringify(history, null, 2));
        console.log(`saved ${arg || 'session.json'}`);
        break;
      case 'load': {
        const data = await readFile(arg || 'session.json');
        const parsed: Message[] = JSON.parse(data);
        history.splice(0, history.length, ...parsed);
        console.log(`loaded ${arg || 'session.json'}`);
        break;
      }
      case 'compact': {
        const summaryPrompt =
          'Summarize our conversation so far for future context. Be concise.';
        const summary = await chatOllama(
          [...history, { role: 'user', content: summaryPrompt }],
          opts.model,
          opts.host
        );
        history.splice(0, history.length, { role: 'system', content: summary });
        console.log(`conversation compacted\n${summary}`);
        break;
      }
      default:
        console.log(`Unknown command: ${cmd}`);
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

async function handleChat(line: string) {
  history.push({ role: 'user', content: line });
  try {
    let reply = '';
    reply = await chatOllama(history, opts.model, opts.host, (t) => process.stdout.write(t));
    process.stdout.write('\n');
    history.push({ role: 'assistant', content: reply });
  } catch (err: any) {
    console.error('Ollama error:', err.message);
  }
}

rl.prompt();
rl.on('line', async (line) => {
  line = line.trim();
  if (!line) {
    rl.prompt();
    return;
  }
  if (line.startsWith('/')) {
    await handleCommand(line);
  } else {
    await handleChat(line);
  }
  rl.prompt();
}).on('close', () => {
  process.exit(0);
});
