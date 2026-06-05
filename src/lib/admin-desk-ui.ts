import { cn } from "@/lib/utils";
import { PORTAL_KICKER_COLOR } from "@/lib/student-ui";

/** Matches hub book-requests + super admin overview filter chrome. */
export const ADMIN_STICKY_HEADER = cn(
  "sticky top-0 z-20 mb-8 border-b border-border bg-background/80 py-4 backdrop-blur-md",
);

export const ADMIN_EYEBROW = cn(
  "caption-scale font-semibold uppercase tracking-kicker",
  PORTAL_KICKER_COLOR,
);

export const ADMIN_PAGE_TITLE = cn("mt-1 h4-scale font-semibold text-foreground");

export const adminFilterLabel = "caption-scale text-foreground-muted";

export const adminSelectTrigger = cn(
  "mt-1 h-9 w-full rounded-xl border-border bg-surface body-scale",
);

export const adminSearchInput = cn(
  "mt-1 h-9 w-full rounded-xl border-border bg-surface body-scale",
);

export const adminPanel = cn(
  "rounded-xl border border-border bg-card/80 shadow-sm backdrop-blur-sm",
);
