import { useMemo } from "react";
import { BOOK_COVER_PLACEHOLDER_URL, bookCoverDisplayUrl } from "@/lib/book-cover-display";
import { cn } from "@/lib/utils";

export function BookCoverImage({
  src,
  alt,
  className,
  priority,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** When true, avoids lazy loading for above-the-fold covers. */
  priority?: boolean;
}) {
  const resolvedSrc = useMemo(() => bookCoverDisplayUrl(src), [src]);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={cn("h-full w-full object-cover", className)}
      onError={(e) => {
        const el = e.currentTarget;
        if (el.src !== BOOK_COVER_PLACEHOLDER_URL) el.src = BOOK_COVER_PLACEHOLDER_URL;
      }}
    />
  );
}

