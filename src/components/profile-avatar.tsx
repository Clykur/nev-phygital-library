import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ProfileAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { token, user } = useAuth();
  const [src, setSrc] = useState<string | null>(null);
  const bust = user?.profileImageUpdatedAt ?? null;

  useEffect(() => {
    if (!token || !bust) {
      setSrc(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(apiUrl("/api/auth/profile-image"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!cancelled) setSrc(null);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [token, bust]);

  const dim =
    size === "sm"
      ? "h-9 w-9 min-h-9 min-w-9 text-xs"
      : size === "lg"
        ? "h-24 w-24 min-h-24 min-w-24 text-2xl"
        : "h-11 w-11 min-h-11 min-w-11 text-sm";
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn("rounded-full object-cover ring-2 ring-border/60", dim, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-amber-500/15 font-semibold text-accent/80 ring-2 ring-border/60 dark:text-accent/20",
        dim,
        className,
      )}
      aria-hidden
    >
      {initial}
    </div>
  );
}
