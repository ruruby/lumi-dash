import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";

const execFileAsync = promisify(execFile);

const DISALLOWED_TOOLS = "Bash Edit Write Read Glob Grep WebFetch WebSearch Agent Task NotebookEdit";

export async function isLocalClaudeCliAvailable(): Promise<boolean> {
  try {
    await execFileAsync("claude", ["--version"], { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

const DEFAULT_TIMEOUT_MS = 60_000;

export async function runClaudeCli(
  prompt: string,
  systemPrompt: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<string> {
  const { stdout } = await execFileAsync(
    "claude",
    ["-p", prompt, "--system-prompt", systemPrompt, "--disallowedTools", DISALLOWED_TOOLS],
    { cwd: os.tmpdir(), timeout: timeoutMs, maxBuffer: 1024 * 1024 },
  );

  return stdout.trim();
}
