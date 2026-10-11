export const MAX_RECEIPT_BYTES = 4 * 1024 * 1024;

/**
 * Phone photos are often 5-10 MB; shrink images in the browser so they fit the
 * 4 MB upload limit. PDFs and already-small files pass through unchanged.
 */
export async function prepareReceipt(file: File): Promise<File> {
  if (file.type === "application/pdf" || file.size <= 1.5 * 1024 * 1024) return file;
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
