import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type CarouselImage = { src: string; alt: string };

export function ImageCarousel({
  images,
  className,
  autoAdvanceMs = 4500,
  minimal = false,
  full = false,
}: {
  images: CarouselImage[];
  className?: string;
  autoAdvanceMs?: number;
  /** Lighter chrome for hero and editorial layouts */
  minimal?: boolean;
  /** Full height mode for backgrounds */
  full?: boolean;
}) {
  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (safeImages.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % safeImages.length);
    }, autoAdvanceMs);
    return () => window.clearInterval(id);
  }, [autoAdvanceMs, safeImages.length]);

  if (safeImages.length === 0) return null;

  const current = safeImages[Math.min(index, safeImages.length - 1)];

  return (
    <div className={cn("w-full h-full", className)}>
      <div
        className={cn(
          "relative overflow-hidden bg-muted/50 h-full",
          !minimal && "border border-border",
        )}
      >
        {!minimal && <div className="h-1 w-full bg-primary" aria-hidden />}
        <img
          src={current.src}
          alt={current.alt}
          className={cn(
            "w-full object-cover transition-opacity duration-1000",
            full ? "h-full" : minimal ? "h-52 md:h-64 lg:h-[17.5rem]" : "h-56 md:h-60"
          )}
          loading="lazy"
        />
        {safeImages.length > 1 && !full && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
            {safeImages.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  minimal ? "h-1 w-8 border-0" : "h-2 w-2 border border-border bg-white",
                  minimal
                    ? i === index
                      ? "bg-primary"
                      : "bg-[#CBD5E1]"
                    : i === index
                      ? "bg-[#2563EB] border-[#2563EB]"
                      : "bg-white",
                )}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        )}
        {safeImages.length > 1 && !full && (
          <div className="absolute right-3 top-3 flex gap-1">
            <button
              type="button"
              className={cn(
                "flex items-center justify-center border border-border bg-white text-foreground",
                minimal ? "h-8 w-8 text-lg leading-none" : "h-10 w-10",
              )}
              aria-label="Previous slide"
              onClick={() => setIndex((i) => (i - 1 + safeImages.length) % safeImages.length)}
            >
              ‹
            </button>
            <button
              type="button"
              className={cn(
                "flex items-center justify-center border border-border bg-white text-foreground",
                minimal ? "h-8 w-8 text-lg leading-none" : "h-10 w-10",
              )}
              aria-label="Next slide"
              onClick={() => setIndex((i) => (i + 1) % safeImages.length)}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
