/**
 * Shared book cover art for the student app, hub desk, and super-admin views.
 * Use a public asset so the same placeholder appears everywhere.
 */
// IMPORTANT: must be absolute (not route-relative) so it works under /superadmin/*, /hub/*, etc.
export const BOOK_COVER_PLACEHOLDER_URL = "/Book_Placeholder.jpg";

export function hasBookCover(coverUrl: string | null | undefined): boolean {
  return coverUrl != null && String(coverUrl).trim() !== "";
}

export function bookCoverDisplayUrl(url: string | null | undefined): string {
  return hasBookCover(url) ? url! : BOOK_COVER_PLACEHOLDER_URL;
}
