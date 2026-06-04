/**
 * Match book request search ↔ titles the same way the API normalizes for dup detection.
 * (See api-server `normalizeBookTitle`.)
 */
export function normalizeBookTitle(title: string): string {
  try {
    return title
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  } catch {
    return title.trim().toLowerCase().replace(/\s+/g, " ");
  }
}

/**
 * True when the query matches the request title and/or staff notes.
 * - Collapses / Unicode-normalizes like stored titles (matches API dup checks)
 * - Splits the query on punctuation and spacing so "Dune, Part" matches `dune part`
 * - Every token must appear in the combined haystack (order-independent)
 * - Optional `extra` (e.g. hub name when listing all hubs) is included in the haystack
 */
export function bookRequestMatchesSearch(
  bookTitle: string | null | undefined,
  notes: string | null | undefined,
  rawQuery: string,
  extra: string | null | undefined = undefined,
): boolean {
  const q = normalizeBookTitle(rawQuery);
  if (!q) return true;

  const t = normalizeBookTitle(bookTitle ?? "");
  const n = normalizeBookTitle(notes ?? "");
  const x = normalizeBookTitle(extra ?? "");
  const haystack = [t, n, x].filter((s) => s.length > 0).join(" ").replace(/\s+/g, " ").trim();
  if (!haystack) return false;

  // Letters + numbers as tokens; strips punctuation that would break `includes` on normalized text
  const tokens = q.split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 0);
  if (tokens.length === 0) return false;

  return tokens.every((w) => haystack.includes(w));
}
