// Fetch an image and convert it to a base64 data URL so it can be sent inline
// to the model (data URIs avoid the server needing to fetch — and reach — the
// original, possibly auth-gated, URL). Fetching cross-origin works because the
// extension holds broad host permissions.

const MAX_BYTES = 6_000_000; // skip very large images to keep payloads sane

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

export async function toDataUrl(src: string): Promise<string | null> {
  if (src.startsWith('data:')) return src;
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/') || blob.size > MAX_BYTES) return null;
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}
