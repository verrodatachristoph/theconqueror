/**
 * Client-side image downscaling/compression. If a picture is larger than
 * `maxBytes`, it's redrawn on a canvas (capped dimension) and re-encoded as
 * JPEG, lowering quality/size until it fits. Non-images or already-small
 * files pass through untouched. Safe to call on every selected file.
 */
function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function compressImage(
  file: File,
  maxBytes = 1_000_000,
  maxDim = 2200,
): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= maxBytes) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // formats the browser can't decode (e.g. some HEIC) — leave as is
  }

  let dim = maxDim;
  for (let attempt = 0; attempt < 5; attempt++) {
    const scale = Math.min(1, dim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);

    let quality = 0.85;
    let blob = await toBlob(canvas, quality);
    while (blob && blob.size > maxBytes && quality > 0.4) {
      quality -= 0.12;
      blob = await toBlob(canvas, quality);
    }
    if (blob && blob.size <= maxBytes) {
      bitmap.close();
      const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
      return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
    }
    dim = Math.round(dim * 0.75); // still too big — shrink dimensions and retry
  }

  bitmap.close();
  return file;
}
