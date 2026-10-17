import { NextResponse } from "next/server";
import { isAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/server/auth/current";
import { getFileForDownload } from "@/server/services/file-service";
import { audit } from "@/server/audit";

/**
 * Authorised private-document download. Files are streamed from private
 * storage through this endpoint only; there is no public URL for any CV or photo.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  try {
    const { file, data } = await getFileForDownload(user, id);
    const isPhoto = file.kind === "PHOTO";
    // CV and document downloads are audited. Passport photos are identification
    // thumbnails shown in lists, so auditing each render would bury real events.
    if (user?.role === "ADMIN" && !isPhoto) {
      await audit({ actorId: user.id, action: "file.download", entityType: "StoredFile", entityId: file.id });
    }
    const asciiName = file.originalName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(data.length),
        // Documents always download, never render inline in our origin. Photos
        // are signature-checked, metadata-stripped JPEG/PNG shown via <img>.
        "Content-Disposition": `${isPhoto ? "inline" : "attachment"}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
        // A new upload always gets a new ID, so a photo's bytes never change.
        "Cache-Control": isPhoto ? "private, max-age=3600" : "private, no-store, max-age=0",
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
