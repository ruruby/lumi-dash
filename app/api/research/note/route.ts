import { NextRequest, NextResponse } from "next/server";
import { buildNoteDraft } from "@/lib/research-note";
import { getCandidate, markCandidateAdded } from "@/lib/research-store";
import { readVault } from "@/lib/vault";
import { createVaultNote } from "@/lib/vault-write";

/**
 * Add to Wiki, in two steps on purpose.
 *
 * POST builds a draft and writes nothing. PUT saves a draft the user confirmed.
 * Splitting them is what makes "확인 후 쓰기" real rather than a UI convention —
 * see docs/decisions/external-source-vs-vault.md.
 */

const MAX_RELATED_NOTES = 40;

function vaultErrorResponse(error: unknown) {
  const code = (error as NodeJS.ErrnoException)?.code;
  if (code === "ENOENT") {
    return NextResponse.json({ error: "vault 경로를 찾을 수 없어요." }, { status: 404 });
  }
  if (code === "EACCES" || code === "EPERM") {
    return NextResponse.json({ error: "그 폴더에 노트를 만들 권한이 없어요." }, { status: 403 });
  }
  console.error("[/api/research/note]", error);
  return NextResponse.json({ error: "노트를 저장하는 중 문제가 발생했어요." }, { status: 500 });
}

/** Build a draft for review. Reads the vault to offer real link targets; writes nothing. */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  const candidateId = typeof body.candidateId === "string" ? body.candidateId : "";
  const topicName = typeof body.topicName === "string" ? body.topicName.trim() : "";
  const vaultPath = typeof body.vaultPath === "string" ? body.vaultPath.trim() : "";
  const folder = typeof body.folder === "string" ? body.folder : "";

  if (!candidateId || !topicName) {
    return NextResponse.json({ error: "어떤 자료를 지식화할지 확인해주세요." }, { status: 400 });
  }

  const candidate = await getCandidate(candidateId);
  if (!candidate) {
    return NextResponse.json({ error: "그 자료를 찾을 수 없어요." }, { status: 404 });
  }

  // Existing note titles keep Related Knowledge pointing at notes that exist.
  let relatedNotes: string[] = [];
  if (vaultPath) {
    try {
      const vault = await readVault(vaultPath, folder);
      relatedNotes = vault.notes.map((note) => note.title).slice(0, MAX_RELATED_NOTES);
    } catch {
      // A draft is still useful without link suggestions.
    }
  }

  try {
    const draft = await buildNoteDraft({ candidate, topicName, relatedNotes });
    return NextResponse.json({ draft });
  } catch (error) {
    console.error("[/api/research/note POST]", error);
    return NextResponse.json({ error: "노트 초안을 만드는 중 문제가 발생했어요." }, { status: 500 });
  }
}

/** Save a confirmed draft as a new note. The only vault write in the app. */
export async function PUT(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  const candidateId = typeof body.candidateId === "string" ? body.candidateId : "";
  const vaultPath = typeof body.vaultPath === "string" ? body.vaultPath.trim() : "";
  const folder = typeof body.folder === "string" ? body.folder : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const markdown = typeof body.markdown === "string" ? body.markdown : "";

  if (!candidateId || !vaultPath || !title || !markdown) {
    return NextResponse.json({ error: "저장할 노트 내용을 확인해주세요." }, { status: 400 });
  }

  const candidate = await getCandidate(candidateId);
  if (!candidate) {
    return NextResponse.json({ error: "그 자료를 찾을 수 없어요." }, { status: 404 });
  }

  try {
    const created = await createVaultNote(vaultPath, folder, title, markdown);
    await markCandidateAdded(candidateId, created.relativePath);
    return NextResponse.json({ note: created });
  } catch (error) {
    if (error instanceof Error && error.message.includes("vault 바깥")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return vaultErrorResponse(error);
  }
}
