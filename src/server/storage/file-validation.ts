/**
 * Content-based validation for uploaded documents. The browser-supplied
 * filename and MIME type are never trusted: the type is decided from the
 * file's bytes, and the extension must agree with it.
 *
 * No malware scanner is wired in (see docs/security.md). To compensate, the
 * accepted set is narrow (PDF, DOCX) and active-content markers are rejected.
 */
export const ALLOWED_DOCUMENTS = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

export type DocumentExt = keyof typeof ALLOWED_DOCUMENTS;

export type ValidationResult =
  | { ok: true; ext: DocumentExt; mimeType: string }
  | { ok: false; error: string };

const PDF_MAGIC = Buffer.from("%PDF-");
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
// PDF features that execute or launch content; legitimate CVs don't need them.
const PDF_ACTIVE = [/\/JavaScript\b/, /\/Launch\b/, /\/EmbeddedFile\b/, /\/RichMedia\b/];

export function extensionOf(filename: string): string {
  const m = /\.([A-Za-z0-9]{1,8})$/.exec(filename.trim());
  return m?.[1]?.toLowerCase() ?? "";
}

export function validateDocument(bytes: Buffer, filename: string, maxBytes: number): ValidationResult {
  if (bytes.length === 0) return { ok: false, error: "The file is empty." };
  if (bytes.length > maxBytes) {
    return { ok: false, error: `The file is too large. The maximum size is ${Math.floor(maxBytes / (1024 * 1024))} MB.` };
  }
  const ext = extensionOf(filename);
  if (ext !== "pdf" && ext !== "docx") {
    return { ok: false, error: "Only PDF or Word (.docx) documents are accepted." };
  }

  if (ext === "pdf") {
    if (!bytes.subarray(0, 1024).includes(PDF_MAGIC)) {
      return { ok: false, error: "This file isn't a valid PDF." };
    }
    const text = bytes.toString("latin1");
    if (PDF_ACTIVE.some((re) => re.test(text))) {
      return { ok: false, error: "This PDF contains embedded scripts or files and can't be accepted. Please export a plain PDF." };
    }
    return { ok: true, ext, mimeType: ALLOWED_DOCUMENTS.pdf };
  }

  // DOCX is a ZIP container. Entry names are stored uncompressed in the local
  // and central directory headers, so we can check them without unzipping.
  if (!bytes.subarray(0, 4).equals(ZIP_MAGIC)) {
    return { ok: false, error: "This file isn't a valid Word (.docx) document." };
  }
  const names = bytes.toString("latin1");
  if (!names.includes("[Content_Types].xml") || !names.includes("word/document.xml")) {
    return { ok: false, error: "This file isn't a valid Word (.docx) document." };
  }
  if (names.includes("vbaProject.bin") || names.includes("macroEnabled")) {
    return { ok: false, error: "Documents containing macros can't be accepted." };
  }
  return { ok: true, ext, mimeType: ALLOWED_DOCUMENTS.docx };
}

/**
 * Display-only filename: strips paths, control and shell-significant
 * characters. Storage keys are generated separately and never derived from it.
 */
export function sanitizeFilename(name: string, ext: DocumentExt): string {
  const base = name
    .split(/[\\/]/)
    .pop()!
    .replace(/\.[A-Za-z0-9]{1,8}$/, "")
    .replace(/[\u0000-\u001f\u007f"<>:|?*%;`$]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 80);
  return `${base || "document"}.${ext}`;
}

// ─── Passport photographs ────────────────────────────────────────────────────

export const ALLOWED_IMAGES = { jpg: "image/jpeg", png: "image/png" } as const;
export type ImageExt = "jpg" | "png";

export type ImageResult =
  | { ok: true; ext: ImageExt; mimeType: string; bytes: Buffer; width: number; height: number }
  | { ok: false; error: string };

const JPEG_SOI = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MIN_SIDE = 150;
const MAX_SIDE = 12_000;

/**
 * Validates a JPEG/PNG by its bytes and returns a cleaned copy with metadata
 * removed. Phone photos often carry GPS location, device and timestamp data
 * (EXIF/XMP); we drop all of it except the orientation flag, which browsers
 * need to display the photo upright.
 */
export function validateImage(bytes: Buffer, filename: string, maxBytes: number): ImageResult {
  if (bytes.length === 0) return { ok: false, error: "The file is empty." };
  if (bytes.length > maxBytes) {
    return { ok: false, error: `The photo is too large. The maximum size is ${Math.floor(maxBytes / (1024 * 1024))} MB.` };
  }
  const ext = extensionOf(filename);
  const claimed = ext === "jpeg" || ext === "jpg" ? "jpg" : ext === "png" ? "png" : null;
  if (!claimed) return { ok: false, error: "Upload a JPEG or PNG photo." };
  const isJpeg = bytes.subarray(0, 3).equals(JPEG_SOI);
  const isPng = bytes.subarray(0, 8).equals(PNG_SIG);
  if ((claimed === "jpg" && !isJpeg) || (claimed === "png" && !isPng)) {
    return { ok: false, error: "This file isn't a valid JPEG or PNG image." };
  }
  const cleaned = isJpeg ? cleanJpeg(bytes) : cleanPng(bytes);
  if (!cleaned) return { ok: false, error: "This image couldn't be read. Please try a different photo." };
  const { width, height } = cleaned;
  if (width < MIN_SIDE || height < MIN_SIDE) {
    return { ok: false, error: `The photo is too small. Use an image at least ${MIN_SIDE}×${MIN_SIDE} pixels.` };
  }
  if (width > MAX_SIDE || height > MAX_SIDE) return { ok: false, error: "The photo's dimensions are too large." };
  return { ok: true, ext: claimed, mimeType: ALLOWED_IMAGES[claimed], bytes: cleaned.bytes, width, height };
}

/** Reads the EXIF orientation (1–8) from an APP1 segment body, if present. */
function exifOrientation(seg: Buffer): number | null {
  if (seg.length < 14 || seg.toString("latin1", 0, 6) !== "Exif\0\0") return null;
  const tiff = seg.subarray(6);
  const le = tiff.toString("latin1", 0, 2) === "II";
  if (!le && tiff.toString("latin1", 0, 2) !== "MM") return null;
  const u16 = (o: number) => (le ? tiff.readUInt16LE(o) : tiff.readUInt16BE(o));
  const u32 = (o: number) => (le ? tiff.readUInt32LE(o) : tiff.readUInt32BE(o));
  try {
    const ifd = u32(4);
    const count = u16(ifd);
    for (let i = 0; i < count; i++) {
      const entry = ifd + 2 + i * 12;
      if (u16(entry) === 0x0112) {
        const v = u16(entry + 8);
        return v >= 1 && v <= 8 ? v : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/** A minimal APP1 segment carrying only the orientation tag. */
function orientationSegment(orientation: number): Buffer {
  const body = Buffer.from([
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // "Exif\0\0"
    0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08, // big-endian TIFF header, IFD at 8
    0x00, 0x01, // one entry
    0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, orientation, 0x00, 0x00, // Orientation SHORT
    0x00, 0x00, 0x00, 0x00, // no next IFD
  ]);
  const len = Buffer.alloc(2);
  len.writeUInt16BE(body.length + 2);
  return Buffer.concat([Buffer.from([0xff, 0xe1]), len, body]);
}

const SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

function cleanJpeg(src: Buffer): { bytes: Buffer; width: number; height: number } | null {
  const out: Buffer[] = [src.subarray(0, 2)]; // SOI
  let pos = 2;
  let width = 0;
  let height = 0;
  let orientation: number | null = null;
  let headerEnd = 1; // index in `out` after which to insert the orientation segment
  while (pos + 4 <= src.length) {
    if (src[pos] !== 0xff) return null;
    const marker = src[pos + 1]!;
    if (marker === 0xff) {
      pos += 1; // fill byte
      continue;
    }
    if (marker === 0xd9) break; // EOI before image data — malformed
    if (marker === 0xda) {
      // Start of scan: the rest is image data up to EOI; copy verbatim.
      out.push(src.subarray(pos));
      if (!width || !height) return null;
      if (orientation && orientation !== 1) out.splice(headerEnd, 0, orientationSegment(orientation));
      return { bytes: Buffer.concat(out), width, height };
    }
    const len = src.readUInt16BE(pos + 2);
    if (len < 2 || pos + 2 + len > src.length) return null;
    const segment = src.subarray(pos, pos + 2 + len);
    const body = src.subarray(pos + 4, pos + 2 + len);
    if (marker === 0xe1) {
      orientation ??= exifOrientation(body); // EXIF/XMP: keep only the orientation value
    } else if ((marker >= 0xe2 && marker <= 0xef) || marker === 0xfe) {
      // Other APPn (incl. ICC/Photoshop) and comments: dropped.
    } else {
      if (marker === 0xe0) headerEnd = out.length + 1;
      if (SOF.has(marker) && body.length >= 5) {
        height = body.readUInt16BE(1);
        width = body.readUInt16BE(3);
      }
      out.push(segment);
    }
    pos += 2 + len;
  }
  return null;
}

const PNG_DROP = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"]);

function cleanPng(src: Buffer): { bytes: Buffer; width: number; height: number } | null {
  const out: Buffer[] = [src.subarray(0, 8)];
  let pos = 8;
  let width = 0;
  let height = 0;
  while (pos + 12 <= src.length) {
    const len = src.readUInt32BE(pos);
    const type = src.toString("latin1", pos + 4, pos + 8);
    const end = pos + 12 + len;
    if (end > src.length) return null;
    if (type === "IHDR" && len >= 8) {
      width = src.readUInt32BE(pos + 8);
      height = src.readUInt32BE(pos + 12);
    }
    if (!PNG_DROP.has(type)) out.push(src.subarray(pos, end));
    pos = end;
    if (type === "IEND") return width && height ? { bytes: Buffer.concat(out), width, height } : null;
  }
  return null;
}

export function sanitizeImageName(name: string, ext: ImageExt): string {
  return sanitizeFilename(name, "pdf").replace(/\.pdf$/, `.${ext}`);
}
