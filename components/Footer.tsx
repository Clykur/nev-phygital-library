import { FaYoutube, FaInstagram, FaLinkedin, FaFacebook, FaXTwitter } from "react-icons/fa6";
import { Library, BookOpen, Map as MapIcon, Info } from "lucide-react";

interface FooterProps {
  setActiveTab?: (tab: string) => void;
  setLandingSegment?: (segment: 'students' | 'colleges') => void;
}

export function Footer({ setActiveTab, setLandingSegment }: FooterProps) {
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab?.('landing');
    setLandingSegment?.('students');
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-12 md:py-16">

        {/* TOP SECTION */}
        <div className="grid grid-cols-1 gap-12 md:gap-16 md:grid-cols-[1.4fr_0.7fr_0.7fr]">

          {/* LEFT COLUMN */}
          <div className="max-w-md">
            <button
              onClick={handleLogoClick}
              className="inline-flex items-center"
            >
              <img
                src="/images/neev.png"
                alt="Neev Logo"
                className="h-16 w-auto mix-blend-multiply"
                onError={(e) => {
                  // Fallback if image missing
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="flex items-center space-x-1.5 ml-2">
                <Library className="w-6 h-6" />
                <span className="text-xl font-bold tracking-tight text-slate-900">Neev</span>
              </div>
            </button>

            <p className="mt-6 pl-2 text-[15px] leading-8 text-[#64748B]">
              The modern student library network for
              quick access, reduced costs, and better reuse
              across hubs.
            </p>
          </div>

          {/* NAVIGATION */}
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-900">
              NAVIGATION
            </p>

            <ul className="mt-6 space-y-4">
              <li>
                <button
                  onClick={() => {
                    setActiveTab?.('landing');
                    setLandingSegment?.('students');
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center space-x-2 text-[15px] text-[#334155] transition-colors hover:text-slate-900"
                >
                  <Library className="w-4 h-4" />
                  <span>Home</span>
                </button>
              </li>

              <li>
                <button
                  onClick={() => {
                    setActiveTab?.('catalog');
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center space-x-2 text-[15px] text-[#334155] transition-colors hover:text-slate-900"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Catalog</span>
                </button>
              </li>

              <li>
                <button
                  onClick={() => {
                    setActiveTab?.('map');
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center space-x-2 text-[15px] text-[#334155] transition-colors hover:text-slate-900"
                >
                  <MapIcon className="w-4 h-4" />
                  <span>Map</span>
                </button>
              </li>

              <li>
                <button
                  onClick={() => {
                    setActiveTab?.('landing');
                    setLandingSegment?.('students');
                    setTimeout(() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                  }}
                  className="flex items-center space-x-2 text-[15px] text-[#334155] transition-colors hover:text-slate-900"
                >
                  <Info className="w-4 h-4" />
                  <span>About</span>
                </button>
              </li>
            </ul>
          </div>

          {/* TRUST */}
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-900">
              TRUST
            </p>

            <ul className="mt-6 space-y-4">
              <li>
                <button
                  className="text-[15px] text-[#334155] transition-colors hover:text-slate-900"
                >
                  Privacy
                </button>
              </li>

              <li>
                <button
                  className="text-[15px] text-[#334155] transition-colors hover:text-slate-900"
                >
                  Terms
                </button>
              </li>

              <li>
                <button
                  className="text-[15px] text-[#334155] transition-colors hover:text-slate-900"
                >
                  Security
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="mt-12 md:mt-14 flex flex-col items-start justify-between gap-8 border-t border-slate-200 pt-8 md:flex-row md:items-center">

          <p className="text-sm text-[#64748B]">
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
                  className="
                    group
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    bg-white
                    text-slate-500
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
