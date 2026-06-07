import type { QueryClient } from "@tanstack/react-query";

const BOUNTY_DEPENDENT_QUERY_KEYS = [
  ["bounty"],
  ["hub", "overview"],
  ["hub", "super-admin-overview"],
  ["admin"],
  ["superadmin"],
  ["hub", "books"],
  ["catalog", "books"],
  ["student-dashboard"],
  ["wallet"],
  ["notifications"],
  ["activity", "timeline"],
] as const;

/** Invalidate every Bounty consumer, then immediately refresh mounted screens. */
export async function refreshBountyQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all(
    BOUNTY_DEPENDENT_QUERY_KEYS.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey: [...queryKey], refetchType: "all" }),
    ),
  );
}
