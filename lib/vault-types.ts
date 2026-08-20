export type VaultNote = {
  /** Note title = file name without extension (Obsidian's own convention). */
  title: string;
  /** Path relative to the read scope, for display and de-duplication. */
  relativePath: string;
  /** Titles this note links to via [[wikilinks]], resolved to notes in scope only. */
  links: string[];
  /** Note body, used as grounding context. */
  content: string;
  /**
   * When this note last changed, as an epoch millisecond value.
   * Prefers frontmatter `updated`, falling back to the file's mtime.
   */
  updatedAt: number;
};

export type VaultReadResult = {
  notes: VaultNote[];
  /** Set when the scope held more notes than the read cap. */
  truncated: boolean;
  totalFound: number;
};
