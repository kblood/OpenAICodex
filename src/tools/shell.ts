import { spawn, ChildProcess } from 'child_process';

export type RunningProcess = ChildProcess;

export function looksDangerous(cmd: string): boolean {
  return /(\brm\b|\bsudo\b|\bshutdown\b|\breboot\b)/.test(cmd);
}

export function runCommand(cmd: string, onProc?: (p: RunningProcess) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, { shell: true });
    onProc && onProc(child);
    let out = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (out += d.toString()));
    child.on('error', reject);
    child.on('close', () => resolve(out));
  });
}

export function runInteractive(cmd: string, onProc?: (p: RunningProcess) => void): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, { shell: true, stdio: 'inherit' });
    onProc && onProc(child);
    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 0));
  });
}
