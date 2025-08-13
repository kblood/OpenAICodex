import { readFile, writeFile, listTree, diffFiles, generatePatch, summarizeTree } from './filesystem.js';
import { runCommand, looksDangerous } from './shell.js';
import { webSearch } from './search.js';

export interface LocalTool {
  name: string;
  description: string;
  run: (input: string) => Promise<string>;
}

export const localTools: LocalTool[] = [
  {
    name: 'read_file',
    description: 'Read a UTF-8 file from the filesystem. Input: path',
    run: async (input: string) => readFile(input.trim())
  },
  {
    name: 'write_file',
    description: 'Write content to a file. Input JSON: {"path": string, "content": string}',
    run: async (input: string) => {
      const { path, content } = JSON.parse(input);
      await writeFile(path, content);
      return 'ok';
    }
  },
  {
    name: 'list_tree',
    description: 'List files in a directory tree. Input: path',
    run: async (input: string) => listTree(input.trim() || '.')
  },
  {
    name: 'run_command',
    description: 'Execute a shell command and return its output. Input: command string',
    run: async (input: string) => {
      if (looksDangerous(input)) throw new Error('refusing to run dangerous command');
      return runCommand(input);
    }
  },
  {
    name: 'web_search',
    description: 'Search the web using DuckDuckGo. Input: query',
    run: webSearch
  }
];
