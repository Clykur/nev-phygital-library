import { cn } from "@/lib/utils";

/**
 * Uppercase kicker (Hub portal / Neev / student) — same slate as marketing `home-kicker` and profile pages.
 * Use with `text-[10px] font-semibold uppercase tracking-[0.35em]` or `tracking-[0.22em]`.
 */
export const PORTAL_KICKER_COLOR = "text-[#64748B] dark:text-muted-foreground";

/** Inline text link in portal copy — primary blue, not amber. */
export const PORTAL_INLINE_LINK = cn(
  "font-medium text-primary underline-offset-2 hover:underline",
);

/** Shared horizontal rhythm for hub desk, student shell, and public portal pages. */
export const PORTAL_PAGE_GUTTER_X = "px-4 sm:px-6 lg:px-8";

/** Centered content column (max 80rem). */
export const PORTAL_PAGE_MAX_WIDTH = "mx-auto w-full max-w-7xl";

/** Full-width public / unauthenticated layouts. Logged-in shell applies the same gutters in `StudentAppShell`. */
export const PORTAL_PAGE_CONTAINER = cn(PORTAL_PAGE_MAX_WIDTH, PORTAL_PAGE_GUTTER_X);

/** Section/card surface — matches hub overview panels and activity blocks. */
export const PORTAL_PANEL_SURFACE =
  "rounded-none border border-border/50 bg-card/60 shadow-sm backdrop-blur-sm dark:border-white/[0.06] dark:bg-card/40";

/** Border, radius, shadow — use for search bars, dashed empty states, etc. */
export const STUDENT_CARD_CHROME =
  "rounded-none border border-border/90 bg-card shadow-md ring-1 ring-black/[0.04] dark:ring-white/[0.06]";

/** Same as chrome plus clip for media tiles and full-bleed headers */
export const STUDENT_CARD_SURFACE = cn(STUDENT_CARD_CHROME, "overflow-hidden");
