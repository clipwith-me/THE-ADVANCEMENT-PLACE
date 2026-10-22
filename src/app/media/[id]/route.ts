import { NextResponse } from "next/server";
import { isAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/server/auth/current";
import { getPublicMedia } from "@/server/services/file-service";

/**
 * Public website media: About-page photos and job flyers. Private files (CVs,
 * candidate photos, attachments) are only ever served by /api/files.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { file, data, isPublic } = await getPublicMedia(await getCurrentUser(), id);
    const isImage = file.mimeType.startsWith("image/");
    const asciiName = file.originalName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(data.length),
        // Images display; PDF flyers download rather than render in our origin.
        "Content-Disposition": `${isImage ? "inline" : "attachment"}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
        // File IDs never change content. Admin-only previews stay out of shared caches.
        "Cache-Control": isPublic ? "public, max-age=3600" : "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (e) {
    if (isAppError(e) && e.code === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    logger.error("media.failed", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
