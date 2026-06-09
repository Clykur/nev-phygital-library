import { FaYoutube, FaInstagram, FaLinkedin, FaFacebook, FaXTwitter } from "react-icons/fa6";
import { Library } from "lucide-react";
import { useLocation } from "wouter";

interface FooterProps {
  setActiveTab?: (tab: string) => void;
  setLandingSegment?: (segment: "students" | "colleges") => void;
}

export function Footer({ setActiveTab, setLandingSegment }: FooterProps) {
  const [, setLocation] = useLocation();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1280px] px-6 py-6 md:py-6">
        {/* TOP SECTION */}
        <div className="grid grid-cols-1 gap-12 md:gap-16 md:grid-cols-[1.4fr_0.7fr_0.7fr]">
          {/* LEFT COLUMN */}
          <div className="max-w-md">
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => setActiveTab("overview")}
            >
              <div className="relative flex items-center justify-center w-8 h-8 bg-primary rounded-md shadow-sm transition-transform duration-300 group-hover:scale-105">
                <Library className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-display text-base font-bold tracking-tight text-foreground">
                  Neev
                </span>
              </div>
            </div>

            <p className="mt-6 pl-2 text-base leading-8 text-foreground-muted">
              The modern student library network for quick access, reduced costs, and better reuse
              across hubs.
            </p>
          </div>

          {/* NAVIGATION */}
          <div>
            <p className="text-sm font-semibold tracking-wide text-foreground">NAVIGATION</p>

            <ul className="mt-6 space-y-4">
              <li>
                <button
                  onClick={() => {
                    setActiveTab?.("landing");
                    setLandingSegment?.("students");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center space-x-2 text-base text-foreground-muted transition-colors hover:text-foreground"
                >
                  <span>Home</span>
                </button>
              </li>

              <li>
                <button
                  onClick={() => {
                    setLocation("/marketplace");
                    setActiveTab?.("catalog");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center space-x-2 text-base text-foreground-muted transition-colors hover:text-foreground"
                >
                  <span>Find a Book</span>
                </button>
              </li>

              <li>
                <button
                  onClick={() => {
                    setActiveTab?.("landing");
                    setLandingSegment?.("students");
                    setTimeout(
                      () =>
                        document
                          .getElementById("about-section")
                          ?.scrollIntoView({ behavior: "smooth" }),
                      100,
                    );
                  }}
                  className="flex items-center space-x-2 text-base text-foreground-muted transition-colors hover:text-foreground"
                >
                  <span>About</span>
                </button>
              </li>
            </ul>
          </div>

          {/* TRUST */}
          <div>
            <p className="text-sm font-semibold tracking-wide text-foreground">TRUST</p>

            <ul className="mt-6 space-y-4">
              <li>
                <button className="text-base text-foreground-muted transition-colors hover:text-foreground">
                  Privacy
                </button>
              </li>

              <li>
                <button className="text-base text-foreground-muted transition-colors hover:text-foreground">
                  Terms
                </button>
              </li>

              <li>
                <button className="text-base text-foreground-muted transition-colors hover:text-foreground">
                  Security
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="mt-5 md:mt-5 flex flex-col items-start justify-between gap-8 border-t border-border pt-2 md:flex-row md:items-center">
          <p className="text-sm text-foreground-muted">
            © {new Date().getFullYear()} Neev. All rights reserved.
          </p>

          {/* SOCIAL ICONS */}
          <div className="flex items-center gap-3">
            {[
              {
                icon: FaInstagram,
                href: "#",
              },
              {
                icon: FaLinkedin,
                href: "#",
              },
              {
                icon: FaYoutube,
                href: "#",
              },
              {
                icon: FaXTwitter,
                href: "#",
              },
              {
                icon: FaFacebook,
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
                  className="                    group
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    text-muted-foreground
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:border-primary/20
                    hover:bg-primary
                    hover:text-primary-foreground
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
