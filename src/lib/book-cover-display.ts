/**
 * Shared book cover art for the student app, hub desk, and super-admin views.
 * Use a public asset so the same placeholder appears everywhere.
 */
// IMPORTANT: must be absolute (not route-relative) so it works under /superadmin/*, /hub/*, etc.
export const BOOK_COVER_PLACEHOLDER_URL = "/book-cover-1.png";
export function hasBookCover(coverUrl: string | null | undefined): boolean {
  return Boolean(coverUrl?.trim());
}

export function bookCoverDisplayUrl(url: string | null | undefined): string {
  const normalized = url?.trim();

  if (!normalized) {
    return BOOK_COVER_PLACEHOLDER_URL;
  }

  return normalized;
}
