import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06] bg-[#050505] text-[#f4f1ea]">
      <div
        className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_55%_40%_at_20%_100%,rgba(212,175,55,0.06),transparent),radial-gradient(ellipse_45%_35%_at_90%_0%,rgba(56,189,248,0.04),transparent)]"
        aria-hidden
      />
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-16 pb-20 pt-20 lg:grid-cols-12 lg:gap-12 lg:pb-24 lg:pt-24">
          <div className="lg:col-span-5">
            <Link href="/" className="group mb-8 inline-flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center text-accent transition-colors group-hover:text-amber-300">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
                  <path
                    d="M4 19.5V4.5C4 3.67157 4.67157 3 5.5 3H10.5C11.3284 3 12 3.67157 12 4.5V19.5C12 20.3284 11.3284 21 10.5 21H5.5C4.67157 21 4 20.3284 4 19.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 4.5C12 3.67157 12.6716 3 13.5 3H18.5C19.3284 3 20 3.67157 20 4.5V19.5C20 20.3284 19.3284 21 18.5 21H13.5C12.6716 21 12 20.3284 12 19.5V4.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M12 4.5V19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-serif text-xl font-medium tracking-[-0.02em] sm:text-2xl">
                Phygital <span className="font-light text-accent">Library</span>
              </span>
            </Link>
            <div className="max-w-sm border-l border-white/15 pl-6">
              <p className="text-[15px] leading-[1.75] text-muted-foreground">
                The modern library network for the next generation of students.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7 lg:gap-8">
            <div>
              <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">Platform</p>
              <ul className="space-y-3.5 text-[15px]">
                <li>
                  <Link href="/student" className="text-slate-300 transition-colors hover:text-accent">
                    For Students
                  </Link>
                </li>
                <li>
                  <Link href="/colleges" className="text-slate-300 transition-colors hover:text-accent">
                    For Colleges
                  </Link>
                </li>
                <li>
                  <Link href="/marketplace" className="text-slate-300 transition-colors hover:text-accent">
                    Discover
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">Company</p>
              <ul className="space-y-3.5 text-[15px]">
                <li>
                  <Link href="/about" className="text-slate-300 transition-colors hover:text-accent">
                    About Us
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-slate-300 transition-colors hover:text-accent">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@phygitallibrary.com" className="text-slate-300 transition-colors hover:text-accent">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">Connect</p>
              <ul className="space-y-3.5 text-[15px]">
                <li>
                  <a href="#" className="text-slate-300 transition-colors hover:text-accent">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-300 transition-colors hover:text-accent">
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-300 transition-colors hover:text-accent">
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-stretch justify-between gap-6 border-t border-white/10 py-10 md:flex-row md:items-center">
          <p className="text-center text-[13px] text-muted-foreground md:text-left">
            © {new Date().getFullYear()} Neev. All rights reserved.
          </p>
          <div className="flex justify-center gap-10 text-[13px] text-muted-foreground md:justify-end">
            <Link href="#" className="transition-colors hover:text-slate-300">
              Privacy
            </Link>
            <Link href="#" className="transition-colors hover:text-slate-300">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
