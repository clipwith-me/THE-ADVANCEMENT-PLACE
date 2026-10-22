import sharp from "sharp";

/**
 * Re-encodes an uploaded image for the public website: applies the camera's
 * orientation, scales it down to `maxSide` pixels and saves a compressed
 * JPEG. Professional photos are often 5–20 MB; visitors on mobile data get a
 * few hundred KB instead. Re-encoding also drops all metadata (GPS, camera).
 * Call only after validateImage() has checked the file's type and size.
 */
export async function toWebJpeg(input: Buffer, maxSide: number): Promise<{ bytes: Buffer; width: number; height: number }> {
  const { data, info } = await sharp(input, { failOn: "error" })
    .rotate()
    .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" }) // transparent PNGs → white, as JPEG has no alpha
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  return { bytes: data, width: info.width, height: info.height };
}
