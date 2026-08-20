import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { VaultNote, VaultReadResult } from "@/lib/vault-types";

const MAX_NOTES = 60;
const MAX_CONTENT_CHARS = 4000;

/** [[Note]], [[Note|alias]], [[Note#heading]] — capture the note name only. */
const WIKILINK = /\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g;

/** Reject absolute paths and `..` so a category folder can only ever be inside the vault. */
function resolveScope(vaultPath: string, folder: string): string {
  if (!folder) return vaultPath;

  const resolved = path.resolve(vaultPath, folder);
  const root = path.resolve(vaultPath);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error("vault 바깥의 폴더는 열 수 없어요.");
  }
  return resolved;
}

async function collectMarkdownFiles(dir: string, out: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    // Skip .obsidian, .git, and friends.
    if (entry.name.startsWith(".")) continue;

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectMarkdownFiles(full, out);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      out.push(full);
    }
  }
}

/** frontmatter `updated: YYYY-MM-DD` wins over mtime, since the user maintains it deliberately. */
function extractUpdatedAt(content: string, mtimeMs: number): number {
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (frontmatter) {
    const updated = frontmatter[1].match(/^updated:\s*(.+)$/m);
    if (updated) {
      const parsed = Date.parse(updated[1].trim());
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return mtimeMs;
}

function extractLinkTargets(content: string): string[] {
  const targets: string[] = [];
  for (const match of content.matchAll(WIKILINK)) {
    const target = match[1].trim();
    if (target) targets.push(target);
  }
  return targets;
}

/** Immediate subfolders of the vault root, offered as category scopes. */
export async function listVaultFolders(vaultPath: string): Promise<string[]> {
  const stats = await stat(vaultPath);
  if (!stats.isDirectory()) {
    throw new Error("지정한 경로가 폴더가 아닙니다.");
  }

  const entries = await readdir(vaultPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();
}

/** Every markdown file in the vault, as paths relative to the root, for the file browser. */
export async function listVaultFiles(vaultPath: string): Promise<string[]> {
  const stats = await stat(vaultPath);
  if (!stats.isDirectory()) {
    throw new Error("지정한 경로가 폴더가 아닙니다.");
  }

  const files: string[] = [];
  await collectMarkdownFiles(vaultPath, files);
  return files
    .map((file) => path.relative(vaultPath, file).split(path.sep).join("/"))
    .sort((a, b) => a.localeCompare(b, "ko"));
}

/** One note's raw markdown, for reading in the browser. */
export async function readVaultNote(
  vaultPath: string,
  relativePath: string,
): Promise<{ relativePath: string; title: string; content: string; updatedAt: number }> {
  const resolved = resolveScope(vaultPath, relativePath);

  const fileStat = await stat(resolved);
  if (!fileStat.isFile()) {
    throw new Error("파일이 아닙니다.");
  }
  if (!resolved.toLowerCase().endsWith(".md")) {
    throw new Error("마크다운 노트만 열 수 있어요.");
  }

  const content = await readFile(resolved, "utf8");
  return {
    relativePath: path.relative(vaultPath, resolved).split(path.sep).join("/"),
    title: path.basename(resolved, path.extname(resolved)),
    content,
    updatedAt: extractUpdatedAt(content, fileStat.mtimeMs),
  };
}

export async function readVault(vaultPath: string, folder = ""): Promise<VaultReadResult> {
  const scope = resolveScope(vaultPath, folder);

  const stats = await stat(scope);
  if (!stats.isDirectory()) {
    throw new Error("지정한 경로가 폴더가 아닙니다.");
  }

  const files: string[] = [];
  await collectMarkdownFiles(scope, files);
  files.sort();

  const totalFound = files.length;
  const selected = files.slice(0, MAX_NOTES);

  const raw = await Promise.all(
    selected.map(async (file) => {
      const [content, fileStat] = await Promise.all([readFile(file, "utf8"), stat(file)]);
      return {
        title: path.basename(file, path.extname(file)),
        relativePath: path.relative(scope, file).split(path.sep).join("/"),
        content: content.slice(0, MAX_CONTENT_CHARS),
        rawLinks: extractLinkTargets(content),
        updatedAt: extractUpdatedAt(content, fileStat.mtimeMs),
      };
    }),
  );

  // Only keep links that point at a note in scope, so the graph has no dangling edges.
  const knownTitles = new Set(raw.map((note) => note.title));

  const notes: VaultNote[] = raw.map((note) => ({
    title: note.title,
    relativePath: note.relativePath,
    content: note.content,
    updatedAt: note.updatedAt,
    links: Array.from(new Set(note.rawLinks.filter((t) => t !== note.title && knownTitles.has(t)))),
  }));

  return { notes, truncated: totalFound > selected.length, totalFound };
}

export function buildVaultContext(notes: VaultNote[]): string {
  return notes.map((note) => `## ${note.title}\n${note.content.trim()}`).join("\n\n---\n\n");
}
