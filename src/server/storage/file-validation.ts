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
