import { NextRequest, NextResponse } from "next/server";
import { listVaultFiles, listVaultFolders, readVault, readVaultNote } from "@/lib/vault";

function errorResponse(error: unknown) {
  const code = (error as NodeJS.ErrnoException)?.code;
  if (code === "ENOENT") {
    return NextResponse.json({ error: "그 경로를 찾을 수 없어요. 경로를 다시 확인해주세요." }, { status: 404 });
  }
  if (code === "EACCES" || code === "EPERM") {
    return NextResponse.json({ error: "그 폴더를 읽을 권한이 없어요." }, { status: 403 });
  }
  if (code === "ENOTDIR") {
    return NextResponse.json({ error: "지정한 경로가 폴더가 아니에요." }, { status: 400 });
  }
  console.error("[/api/vault]", error);
  return NextResponse.json({ error: "vault를 읽는 중 문제가 발생했어요." }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const vaultPath = request.nextUrl.searchParams.get("path")?.trim();
  const folder = request.nextUrl.searchParams.get("folder")?.trim() ?? "";
  const mode = request.nextUrl.searchParams.get("mode");

  if (!vaultPath) {
    return NextResponse.json({ error: "vault 폴더 경로를 입력해주세요." }, { status: 400 });
  }

  try {
    if (mode === "folders") {
      const folders = await listVaultFolders(vaultPath);
      return NextResponse.json({ folders });
    }

    if (mode === "files") {
      const files = await listVaultFiles(vaultPath);
      return NextResponse.json({ files });
    }

    if (mode === "note") {
      const file = request.nextUrl.searchParams.get("file")?.trim();
      if (!file) {
        return NextResponse.json({ error: "열 파일을 지정해주세요." }, { status: 400 });
      }
      const note = await readVaultNote(vaultPath, file);
      return NextResponse.json(note);
    }

    const result = await readVault(vaultPath, folder);
    // Graph and panels only need titles/links; note bodies stay server-side until grounding needs them.
    return NextResponse.json({
      notes: result.notes.map((note) => ({
        title: note.title,
        relativePath: note.relativePath,
        links: note.links,
      })),
      truncated: result.truncated,
      totalFound: result.totalFound,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
