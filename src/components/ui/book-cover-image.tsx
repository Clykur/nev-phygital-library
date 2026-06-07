import { useEffect, useMemo, useState } from "react";
import {
  BOOK_COVER_PLACEHOLDER_URL,
  bookCoverDisplayUrl,
} from "@/lib/book-cover-display";
import { cn } from "@/lib/utils";

interface BookCoverImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function BookCoverImage({
  src,
  alt,
  className,
  priority,
}: BookCoverImageProps) {
  const resolvedSrc = useMemo(
    () => bookCoverDisplayUrl(src),
    [src]
  );

  const [imageSrc, setImageSrc] = useState(resolvedSrc);

  useEffect(() => {
    setImageSrc(resolvedSrc);
  }, [resolvedSrc]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={cn(
        "h-full w-full object-cover bg-muted",
        className
      )}
      onError={(e) => {
        const img = e.currentTarget;

        if (img.src !== BOOK_COVER_PLACEHOLDER_URL) {
          img.onerror = null;
          setImageSrc(BOOK_COVER_PLACEHOLDER_URL);
        }
      }}
    />
  );
}