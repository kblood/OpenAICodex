import { promises as fs } from 'fs';
import path from 'path';
import { createTwoFilesPatch } from 'diff';

export async function readFile(path: string): Promise<string> {
  return fs.readFile(path, 'utf8');
}

export async function writeFile(path: string, content: string): Promise<void> {
  await fs.writeFile(path, content, 'utf8');
}

export async function listTree(dir = '.', depth = 2): Promise<string> {
  async function walk(current: string, prefix: string, level: number): Promise<string> {
    if (level > depth) return '';
    const entries = await fs.readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    let out = '';
    for (const e of entries) {
      out += `${prefix}${e.name}\n`;
      if (e.isDirectory()) {
        out += await walk(path.join(current, e.name), prefix + '  ', level + 1);
      }
    }
    return out;
  }
  const result = await walk(dir, '', 0);
  return result.trim();
}

export async function diffFiles(a: string, b: string): Promise<string> {
  const [aTxt, bTxt] = await Promise.all([
    fs.readFile(a, 'utf8'),
    fs.readFile(b, 'utf8')
  ]);
  return createTwoFilesPatch(a, b, aTxt, bTxt);
}

export async function generatePatch(file: string, newContent: string): Promise<string> {
  const old = await fs.readFile(file, 'utf8');
  return createTwoFilesPatch(file, file, old, newContent);
}

export async function summarizeTree(dir = '.'): Promise<string> {
  let files = 0;
  let dirs = 0;
  async function walk(current: string): Promise<void> {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        dirs++;
        await walk(path.join(current, e.name));
      } else {
        files++;
      }
    }
  }
  await walk(dir);
  return `${dirs} directories, ${files} files`;
}
