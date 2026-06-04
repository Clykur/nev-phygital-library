import { Link, useLocation } from "wouter";
import { Youtube, Instagram, Linkedin, Facebook } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";

export function Footer() {
  const [location] = useLocation();

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-12 md:py-16">

        {/* TOP SECTION */}
        <div className="grid grid-cols-1 gap-12 md:gap-16 md:grid-cols-[1.4fr_0.7fr_0.7fr]">

          {/* LEFT COLUMN */}
          <div className="max-w-md">
            <Link
              href="/"
              onClick={handleLogoClick}
              className="inline-flex items-center"
            >
              <img
                src="/images/neev.png"
                alt="Neev Logo"
                className="h-16 w-auto mix-blend-multiply"
              />
            </Link>

            <p className="mt-6 pl-[28px] text-[15px] leading-8 text-[#64748B]">
              The modern student library network for
              quick access, reduced costs, and better reuse
              across hubs.
            </p>
          </div>

          {/* NAVIGATION */}
          <div>
            <p className="text-sm font-semibold tracking-wide text-foreground">
              NAVIGATION
            </p>

            <ul className="mt-6 space-y-4">
              <li>
                <Link
                  href="/"
                  className="text-[15px] text-[#334155] transition-colors hover:text-foreground"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  href="/marketplace"
                  className="text-[15px] text-[#334155] transition-colors hover:text-foreground"
                >
                  Marketplace
                </Link>
              </li>

              <li>
                <Link
                  href="/colleges"
                  className="text-[15px] text-[#334155] transition-colors hover:text-foreground"
                >
                  Colleges
                </Link>
              </li>

              <li>
                <Link
                  href="/about"
                  className="text-[15px] text-[#334155] transition-colors hover:text-foreground"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* TRUST */}
          <div>
            <p className="text-sm font-semibold tracking-wide text-foreground">
              TRUST
            </p>

            <ul className="mt-6 space-y-4">
              <li>
                <Link
                  href="#"
                  className="text-[15px] text-[#334155] transition-colors hover:text-foreground"
                >
                  Privacy
                </Link>
              </li>

              <li>
                <Link
                  href="#"
                  className="text-[15px] text-[#334155] transition-colors hover:text-foreground"
                >
                  Terms
                </Link>
              </li>

              <li>
                <Link
                  href="#"
                  className="text-[15px] text-[#334155] transition-colors hover:text-foreground"
                >
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="mt-12 md:mt-14 flex flex-col items-start justify-between gap-8 border-t border-border pt-8 md:flex-row md:items-center">

          <p className="text-sm text-[#64748B]">
            © {new Date().getFullYear()} Neev. All rights reserved.
          </p>

          {/* SOCIAL ICONS */}
          <div className="flex items-center gap-3">

            {[
              {
                icon: Instagram,
                href: "#",
              },
              {
                icon: Linkedin,
                href: "#",
              },
              {
                icon: Youtube,
                href: "#",
              },
              {
                icon: FaXTwitter,
                href: "#",
              },
              {
                icon: Facebook,
                href: "#",
              },
            ].map((item, i) => {
              const Icon = item.icon;

              return (
                <a
                  key={i}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    group
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    bg-white
                    text-muted-foreground
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:border-primary/20
                    hover:bg-primary
                    hover:text-white
                    hover:shadow-lg
                    hover:shadow-primary/20
                  "
                >
                  <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}