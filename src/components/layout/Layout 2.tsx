import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col relative selection:bg-amber-500/30 selection:text-foreground">
      <div className="paper-texture" />
      <Navbar />
      <main className="flex-1 w-full relative z-10 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}
