import { apiFetch } from "@/lib/api";

export type RecentlyViewedPayload =
  | { bookId: string; listingId?: never }
  | { listingId: string; bookId?: never };

export async function recordRecentlyViewed(
  payload: RecentlyViewedPayload,
  token: string,
): Promise<void> {
  await apiFetch<void>("/api/student/recently-viewed", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}
