/**
 * fetchUrlAsFile — turn a pasted media URL into an uploadable File.
 *
 * Both import-from-URL surfaces need the identical four steps (fetch, check
 * status, derive a filename, wrap in a File), and they had them written once:
 * the fullpage manager imported, the picker modal said "Import from URL —
 * coming soon" beside a working implementation one folder away. One writer,
 * so a fix to the naming or the status check reaches both.
 *
 * Throws on a non-OK response or a network failure — callers own the toast,
 * because what "failed" should say differs between the two surfaces.
 *
 * @license BSD-3-Clause
 */

/**
 * http/https only — a data: or blob: URL is already local, and file:// cannot
 * be read. Both import surfaces gate their button on this, so "what counts as
 * a usable URL" cannot drift between them.
 */
export function isFetchableUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function fetchUrlAsFile(url: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  // `image/png` → `png`. A blob with no type at all still needs an extension
  // or the filename reads as a directory to the upload path.
  const ext = blob.type.split("/")[1] || "bin";
  // Strip the query string: `photo.jpg?w=800&token=…` is not a filename.
  const name = url.split("/").pop()?.split("?")[0] || `imported.${ext}`;
  return new File([blob], name, { type: blob.type });
}
