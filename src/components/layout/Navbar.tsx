import { Link, useLocation } from "wouter";
import {
  Menu,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isHome = location === "/";
  const isColleges = location === "/colleges";
  const isAbout = location === "/about";
  const hasHero = isHome || isColleges || isAbout;
  
  const [showNav, setShowNav] = useState(!hasHero);

  useEffect(() => {
    if (!hasHero) {
      setShowNav(true);
      return;
    }
    const update = () => {
      setShowNav(window.scrollY > window.innerHeight * 0.92);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [hasHero]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Marketplace", path: "/marketplace" },
    { name: "Colleges", path: "/colleges" },
    { name: "About", path: "/about" },
  ];

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b bg-white transition-[transform,opacity,visibility] duration-300 ease-out motion-reduce:transition-none",
        showNav ? "translate-y-0 border-border opacity-100 visible" : "pointer-events-none -translate-y-full border-transparent opacity-0 invisible",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-6">
        <Link href="/" onClick={handleLogoClick} className="flex items-center gap-3">
          <img src="/images/neev.png" alt="Neev Logo" className="h-15 w-30 mix-blend-multiply" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {navLinks.map((link) => {
            const isActive = location === link.path || (link.path !== "/" && location.startsWith(link.path));
            return (
              <Link
                key={link.path}
                href={link.path}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "text-sm md:text-base font-medium transition-colors",
                  isActive ? "font-semibold text-primary" : "text-[#334155] hover:text-foreground",
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex">
            <Button asChild size="default">
              <Link href="/login">Get Started</Link>
            </Button>
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="md:hidden inline-flex h-11 w-11 items-center justify-center border border-border bg-white text-foreground"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-l border-border flex flex-col pt-12">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">Site links and account</SheetDescription>
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => {
                  const isActive =
                    location === link.path || (link.path !== "/" && location.startsWith(link.path));
                  return (
                    <Link
                      key={link.path}
                      href={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "text-xl font-bold transition-colors",
                        isActive ? "text-primary" : "text-foreground",
                      )}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>
              <div className="mt-auto flex flex-col gap-4 border-t border-border pt-10 pb-6">
                <Button asChild size="lg" className="h-14 text-base font-bold" onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/login">Get Started</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}