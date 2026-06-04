import { cn } from "@/lib/utils";
import { PORTAL_KICKER_COLOR } from "@/lib/student-ui";

/** Matches hub book-requests + super admin overview filter chrome. */
export const ADMIN_STICKY_HEADER = cn(
  "sticky top-0 z-20 mb-8 border-b border-border/30 bg-background/80 py-4 backdrop-blur-md",
);

export const ADMIN_EYEBROW = cn(
  "text-[10px] font-semibold uppercase tracking-[0.35em]",
  PORTAL_KICKER_COLOR,
);

export const ADMIN_PAGE_TITLE = cn("mt-1 font-serif text-lg font-light text-foreground");

export const adminFilterLabel = "text-[10px] text-muted-foreground";

export const adminSelectTrigger = cn(
  "mt-1 h-9 w-full rounded-none border-border/60 bg-background/80 text-sm",
);

export const adminSearchInput = cn(
  "mt-1 h-9 w-full rounded-none border-border/60 bg-background/80 text-sm",
);

export const adminPanel = cn(
  "rounded-none border border-border/50 bg-card/60 shadow-sm backdrop-blur-sm dark:border-white/[0.06] dark:bg-card/40",
);
