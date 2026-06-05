import { cn } from "@/lib/utils";

/** Uppercase kicker — semantic muted foreground, standardized meta size. */
export const PORTAL_KICKER_COLOR = "text-foreground-muted";

/** Inline text link in portal copy. */
export const PORTAL_INLINE_LINK = cn(
  "font-medium text-primary underline-offset-2 hover:underline hover:text-primary-hover",
);

/** Shared horizontal rhythm for hub desk, student shell, and public portal pages. */
export const PORTAL_PAGE_GUTTER_X = "px-4 sm:px-6 lg:px-8";

/** Centered content column (max 80rem). */
export const PORTAL_PAGE_MAX_WIDTH = "mx-auto w-full max-w-7xl";

/** Full-width public / unauthenticated layouts. */
export const PORTAL_PAGE_CONTAINER = cn(PORTAL_PAGE_MAX_WIDTH, PORTAL_PAGE_GUTTER_X);

/** Section/card surface — hub overview panels and activity blocks. */
export const PORTAL_PANEL_SURFACE = cn(
  "rounded-xl border border-border bg-card/80 shadow-sm backdrop-blur-sm",
);

/** Border, radius, shadow — search bars, dashed empty states, etc. */
export const STUDENT_CARD_CHROME = cn(
  "rounded-xl border border-border bg-card shadow-sm",
);

/** Same as chrome plus clip for media tiles and full-bleed headers */
export const STUDENT_CARD_SURFACE = cn(STUDENT_CARD_CHROME, "overflow-hidden");
