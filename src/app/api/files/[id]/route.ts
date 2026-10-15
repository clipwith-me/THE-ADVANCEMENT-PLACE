import { NextResponse } from "next/server";
import { isAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/server/auth/current";
import { getFileForDownload } from "@/server/services/file-service";
import { audit } from "@/server/audit";

/**
 * Authorised private-document download. Files are streamed from private
 * storage through this endpoint only; there is no public URL for any CV.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  try {
    const { file, data } = await getFileForDownload(user, id);
    if (user?.role === "ADMIN") {
      await audit({ actorId: user.id, action: "file.download", entityType: "StoredFile", entityId: file.id });
    }
    const asciiName = file.originalName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(data.length),
        // Always download, never render inline in our origin.
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (e) {
    if (isAppError(e) && e.code === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    logger.error("file.download_failed", { error: e });
    return NextResponse.json({ error: "Download failed" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
