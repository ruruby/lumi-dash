"use client";

import { Fragment, type ReactNode } from "react";
import { ACCENT_SOFT, TEXT_FAINT } from "@/lib/lumi-theme";

/**
 * Renders vault markdown as formatted text instead of a raw dump.
 *
 * Purpose-built rather than a dependency because Obsidian notes lean on
 * `[[wikilinks]]`, which no general markdown renderer handles — and following
 * one is how the user navigates their own knowledge.
 */

type MarkdownViewProps = {
  markdown: string;
  /** Called when a `[[wikilink]]` is clicked. Links render as plain text without it. */
  onFollowLink?: (target: string) => void;
  className?: string;
};

const INLINE = /(\[\[[^\]]+\]\]|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

/** Splits frontmatter off the top so it can be shown as metadata, not body text. */
export function splitFrontmatter(markdown: string): { frontmatter: string | null; body: string } {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { frontmatter: null, body: markdown };
  return { frontmatter: match[1], body: markdown.slice(match[0].length) };
}

function renderInline(text: string, onFollowLink?: (target: string) => void): ReactNode[] {
  const parts = text.split(INLINE).filter((part) => part !== "");

  return parts.map((part, index) => {
    const key = `${index}-${part.slice(0, 12)}`;

    if (part.startsWith("[[") && part.endsWith("]]")) {
      const raw = part.slice(2, -2);
      // `[[Note|alias]]` and `[[Note#heading]]` both point at the note name.
      const target = raw.split(/[|#]/)[0].trim();
      const label = raw.includes("|") ? raw.slice(raw.indexOf("|") + 1).trim() : target;

      if (!onFollowLink) {
        return (
          <span key={key} style={{ color: ACCENT_SOFT }}>
            {label}
          </span>
        );
      }
      return (
        <button
          key={key}
          type="button"
          onClick={() => onFollowLink(target)}
          style={{ color: ACCENT_SOFT, borderBottom: "1px dashed rgba(232,192,127,0.5)" }}
          className="hover:opacity-80"
        >
          {label}
        </button>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} style={{ color: "#fff", fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={key} style={{ fontStyle: "italic" }}>
          {part.slice(1, -1)}
        </em>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={key}
          style={{ background: "rgba(255,255,255,0.08)", color: "#e8d8b0", padding: "1px 5px", borderRadius: 4 }}
          className="text-[11.5px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={key}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#a9bce4" }}
          className="underline"
        >
          {link[1]}
        </a>
      );
    }

    return <Fragment key={key}>{part}</Fragment>;
  });
}

type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "quote"; lines: string[] }
  | { kind: "code"; lines: string[]; language: string }
  | { kind: "rule" };

/** Groups lines into blocks so lists and code fences stay together. */
export function parseBlocks(body: string): Block[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];

  let index = 0;
  while (index < lines.length) {
    const line = lines[index];

    if (line.trim() === "") {
      index += 1;
      continue;
    }

    const fence = line.match(/^```(\w*)/);
    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1; // closing fence
      blocks.push({ kind: "code", lines: code, language: fence[1] });
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ kind: "rule" });
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({ kind: "heading", level: heading[1].length, text: heading[2].trim() });
      index += 1;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quote.push(lines[index].replace(/^\s*>\s?/, ""));
        index += 1;
      }
      blocks.push({ kind: "quote", lines: quote });
      continue;
    }

    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      const items: string[] = [];
      while (index < lines.length) {
        const next = lines[index];
        const nextBullet = next.match(/^\s*[-*+]\s+(.*)$/);
        const nextNumbered = next.match(/^\s*\d+[.)]\s+(.*)$/);
        const match = ordered ? nextNumbered : nextBullet;
        if (!match) break;
        items.push(match[1]);
        index += 1;
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }

    // Consecutive plain lines form one paragraph.
    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() !== "" &&
      !/^(#{1,6})\s/.test(lines[index]) &&
      !/^\s*[-*+]\s/.test(lines[index]) &&
      !/^\s*\d+[.)]\s/.test(lines[index]) &&
      !/^\s*>/.test(lines[index]) &&
      !lines[index].startsWith("```")
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

const HEADING_SIZES = [17, 15, 13.5, 12.5, 12, 12];

export function MarkdownView({ markdown, onFollowLink, className }: MarkdownViewProps) {
  const { frontmatter, body } = splitFrontmatter(markdown);
  const blocks = parseBlocks(body);

  return (
    <div className={className} style={{ color: "rgba(236,234,243,0.82)" }}>
      {frontmatter && (
        <div
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          className="mb-3 rounded-lg px-3 py-2"
        >
          {frontmatter
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map((line) => (
              <div key={line} style={{ fontSize: 10.5, color: TEXT_FAINT }} className="leading-relaxed">
                {line}
              </div>
            ))}
        </div>
      )}

      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;

        if (block.kind === "heading") {
          return (
            <div
              key={key}
              style={{
                fontSize: HEADING_SIZES[block.level - 1] ?? 12,
                fontWeight: 700,
                color: block.level <= 2 ? "#fff" : ACCENT_SOFT,
                marginTop: index === 0 ? 0 : block.level <= 2 ? 18 : 14,
                marginBottom: 6,
              }}
            >
              {renderInline(block.text, onFollowLink)}
            </div>
          );
        }

        if (block.kind === "paragraph") {
          return (
            <p key={key} className="text-[12.5px] leading-relaxed mb-2.5">
              {renderInline(block.text, onFollowLink)}
            </p>
          );
        }

        if (block.kind === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={key}
              className={`mb-2.5 pl-4 text-[12.5px] leading-relaxed ${
                block.ordered ? "list-decimal" : "list-disc"
              }`}
              style={{ color: "rgba(236,234,243,0.82)" }}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${itemIndex}-${item.slice(0, 12)}`} className="mb-1">
                  {renderInline(item, onFollowLink)}
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.kind === "quote") {
          return (
            <blockquote
              key={key}
              style={{ borderLeft: "2px solid rgba(201,154,75,0.5)", color: "rgba(236,234,243,0.65)" }}
              className="mb-2.5 pl-3 text-[12px] leading-relaxed italic"
            >
              {block.lines.map((line, lineIndex) => (
                <div key={`${lineIndex}-${line.slice(0, 12)}`}>{renderInline(line, onFollowLink)}</div>
              ))}
            </blockquote>
          );
        }

        if (block.kind === "code") {
          return (
            <pre
              key={key}
              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}
              className="lumi-scroll mb-2.5 overflow-x-auto rounded-lg p-3 text-[11.5px] leading-relaxed"
            >
              <code style={{ color: "#e8d8b0" }}>{block.lines.join("\n")}</code>
            </pre>
          );
        }

        return <div key={key} style={{ height: 1, background: "rgba(255,255,255,0.1)" }} className="my-3" />;
      })}
    </div>
  );
}
