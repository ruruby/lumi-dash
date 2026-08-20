import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveScope } from "@/lib/vault";

/**
 * The only place this app writes into the user's vault.
 *
 * Two rules from docs/decisions/external-source-vs-vault.md are enforced here:
 * new files only, and never inside a path that escapes the vault. Existing
 * notes are never opened, so a bug here cannot overwrite the user's own work.
 */

/** Characters Obsidian rejects in note titles, plus path separators. */
const ILLEGAL_FILENAME = /[\\/:*?"<>|#^[\]]/g;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
const MAX_BASENAME_CHARS = 80;
const MAX_COLLISION_ATTEMPTS = 50;

export function sanitizeNoteTitle(title: string): string {
  const cleaned = title
    .replace(ILLEGAL_FILENAME, " ")
    .replace(CONTROL_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim()
    // A leading dot would make the note invisible to the vault reader.
    .replace(/^\.+/, "")
    .replace(/\.+$/, "")
    .trim();

  const truncated = cleaned.slice(0, MAX_BASENAME_CHARS).trim();
  return truncated || "제목 없는 자료";
}

export type CreatedNote = {
  /** Path relative to the vault root, using forward slashes. */
  relativePath: string;
  title: string;
};

/**
 * Creates a new note and returns where it landed. When the name is taken, a
 * numeric suffix is appended rather than touching the existing file. The `wx`
 * flag makes each attempt fail if the file appeared in the meantime, so this
 * cannot clobber a note created between the check and the write.
 */
export async function createVaultNote(
  vaultPath: string,
  folder: string,
  title: string,
  markdown: string,
): Promise<CreatedNote> {
  const targetDir = resolveScope(vaultPath, folder);
  await mkdir(targetDir, { recursive: true });

  const baseName = sanitizeNoteTitle(title);
  const root = path.resolve(vaultPath);

  for (let attempt = 1; attempt <= MAX_COLLISION_ATTEMPTS; attempt += 1) {
    const fileName = attempt === 1 ? `${baseName}.md` : `${baseName} ${attempt}.md`;
    const resolved = path.resolve(path.join(targetDir, fileName));

    // Guard again with the resolved filename, so a crafted title cannot escape.
    if (!resolved.startsWith(root + path.sep)) {
      throw new Error("vault 바깥에는 노트를 만들 수 없어요.");
    }

    try {
      await writeFile(resolved, markdown, { encoding: "utf8", flag: "wx" });
      return {
        relativePath: path.relative(root, resolved).split(path.sep).join("/"),
        title: path.basename(resolved, ".md"),
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") continue;
      throw error;
    }
  }

  throw new Error("같은 이름의 노트가 너무 많아요. 제목을 바꿔서 다시 시도해주세요.");
}
