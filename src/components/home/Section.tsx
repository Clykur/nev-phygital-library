import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("py-10 md:py-14", className)}>
      {children}
    </section>
  );
}
