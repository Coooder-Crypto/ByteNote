/**
 * Deterministically map a string to a palette color.
 */
export function hashStringToColor(id: string, palette: string[]) {
  if (!id || palette.length === 0) return palette[0] ?? "#000000";
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % palette.length;
  return palette[idx];
}
