import { deflateSync } from "node:zlib";

/**
 * Test images built at runtime (no binary fixtures, never a real person).
 * Shared by unit/integration tests and the Playwright suite.
 */

/** A real, decodable PNG filled with one colour, optionally with extra chunks. */
export function solidPng(width: number, height: number, rgb: [number, number, number] = [0x1d, 0x4e, 0xa8], extra: Buffer[] = []): Buffer {
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3).map((_, i) => rgb[i % 3]!)]);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    ...extra,
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Plain brand-blue 200×240 placeholder used as a "passport photo" in tests. */
export function placeholderPhoto(): Buffer {
  return solidPng(200, 240);
}

export function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function crc32(buf: Buffer): number {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function segment(marker: number, body: Buffer): Buffer {
  const len = Buffer.alloc(2);
  len.writeUInt16BE(body.length + 2);
  return Buffer.concat([Buffer.from([0xff, marker]), len, body]);
}

/** EXIF APP1 body (big-endian) with an orientation tag and a fake GPS marker string. */
export function exifBody(orientation: number, secret = "GPS 7.1557N 3.3451E Phone-Model-X"): Buffer {
  const tiff = Buffer.from([
    0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08,
    0x00, 0x01,
    0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, orientation, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ]);
  return Buffer.concat([Buffer.from("Exif\0\0", "latin1"), tiff, Buffer.from(secret, "latin1")]);
}

/**
 * A structurally valid JPEG (markers, frame header, scan) for validation tests.
 * Not decodable pixel data — only the container is exercised.
 */
export function sampleJpeg(width = 300, height = 400, opts: { orientation?: number; xmp?: string; comment?: string } = {}): Buffer {
  const sof = Buffer.alloc(15);
  sof[0] = 8;
  sof.writeUInt16BE(height, 1);
  sof.writeUInt16BE(width, 3);
  sof.set([3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1], 5);
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    segment(0xe0, Buffer.from("JFIF\0\x01\x01\0\0\x01\0\x01\0\0", "latin1")),
    ...(opts.orientation ? [segment(0xe1, exifBody(opts.orientation))] : []),
    ...(opts.xmp ? [segment(0xe1, Buffer.from(`http://ns.adobe.com/xap/1.0/\0${opts.xmp}`, "latin1"))] : []),
    ...(opts.comment ? [segment(0xfe, Buffer.from(opts.comment, "latin1"))] : []),
    segment(0xc0, sof),
    segment(0xda, Buffer.from([1, 1, 0, 0, 0x3f, 0])),
    Buffer.from([0x12, 0x34, 0x56, 0xff, 0xd9]),
  ]);
}

/** A real, decodable JPEG (sampleJpeg() is structural only and can't be resized). */
export async function decodableJpeg(width: number, height: number): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp(solidPng(width, height)).jpeg().toBuffer();
}
