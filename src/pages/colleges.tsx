import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Building2, CheckCircle2, Handshake, MapPin, ScanLine, ShieldCheck, Users, Zap, MessageSquare, ChevronDown, StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/home/Container";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const PAGE_TITLE = "Partner with Neev | Campus library hubs & textbook network";
const PAGE_DESCRIPTION =
  "Partner colleges run Neev study hubs with zero upfront capex: MoU-led pilots, upgraded library space, desk operations, and one app for borrowing, peer-to-peer exchanges, and retail pickup across India.";

const viewportOnce = { once: true, margin: "-20px", amount: 0.1 } as const;

const PILOT_STEPS = [
  {
    icon: {
      static: "https://cdn-icons-png.flaticon.com/512/5977/5977590.png",
      animated: "https://cdn-icons-gif.flaticon.com/19018/19018030.gif",
    },
    title: "MoU and success criteria",
    body: "Single-hub pilot, roles, data handling, and what a green light means before adding capacity.",
  },
  {
    icon: {
      static: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
      animated: "https://cdn-icons-gif.flaticon.com/8722/8722412.gif",
    },
    title: "Space upgrade and desk design",
    body: "Shelving, signage, and handoff zone co-built with facilities and library leadership.",
  },
  {
    icon: {
      static: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
      animated: "https://cdn-icons-gif.flaticon.com/19021/19021674.gif",
    },
    title: "Go live in the app",
    body: "Your hub appears in routing. Students see stock, membership, and pickup slots like at other nodes.",
  },
  {
    icon: {
      static: "https://cdn-icons-png.flaticon.com/512/2991/2991112.png",
      animated: "https://cdn-icons-gif.flaticon.com/17626/17626904.gif",
    },
    title: "Operate and review",
    body: "Staff workflows for intake, pickup, and exceptions, then a joint review before expanding the footprint.",
  },
];

function useCollegesSeo() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = PAGE_TITLE;

    const headNodes: HTMLElement[] = [];
    const appendMeta = (attrs: Record<string, string>) => {
      const el = document.createElement("meta");
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      el.setAttribute("data-neev-page", "colleges");
      document.head.appendChild(el);
      headNodes.push(el);
    };

    appendMeta({ name: "description", content: PAGE_DESCRIPTION });
    appendMeta({ property: "og:title", content: PAGE_TITLE });
    appendMeta({ property: "og:description", content: PAGE_DESCRIPTION });
    appendMeta({ property: "og:type", content: "website" });

    const path = "/colleges";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (origin) {
      appendMeta({ property: "og:url", content: `${origin}${path}` });
    }

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: origin ? `${origin}${path}` : undefined,
      isPartOf: {
        "@type": "WebSite",
        name: "Neev",
        description: "B2B2C library network for affordable textbooks and campus study hubs.",
      },
      about: {
        "@type": "EducationalOrganization",
        name: "Neev partner college library hub program",
        description: PAGE_DESCRIPTION,
      },
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-neev-page", "colleges");
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    headNodes.push(script);

    return () => {
      document.title = previousTitle;
      headNodes.forEach((n) => n.remove());
    };
  }, []);
}

export default function Colleges() {
  useCollegesSeo();
  const reduceMotion = useReducedMotion();
  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const yParallax = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacityParallax = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const { scrollYProgress: flowProgress } = useScroll({
    target: flowRef,
    offset: ["start center", "end center"]
  });

  const fadeUp = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 30 },
    visible: {
      opacity: 1, y: 0,
      transition: reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 300, damping: 25, mass: 0.8 },
    },
  };

  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.08, delayChildren: reduceMotion ? 0 : 0.1 } },
  };

  const card = "bento-card border border-primary/20 bg-surface p-6 md:p-8 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-1";

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thanks. We will reach out within two business days.");
    setPartnerDialogOpen(false);
  };

  return (
    <>
      <Dialog open={partnerDialogOpen} onOpenChange={setPartnerDialogOpen}>
        <DialogContent className="w-[calc(100%-32px)] sm:w-full max-h-[min(90vh,760px)] max-w-[440px] gap-0 overflow-y-auto rounded-2xl p-0">
          <div className="px-6 pb-8 pt-10 sm:px-8 sm:pb-10 sm:pt-11">
            <DialogHeader className="space-y-3 text-left">
              <p className="caption-scale font-bold uppercase tracking-[0.22em] text-foreground-muted">
                Partner colleges
              </p>
              <DialogTitle className="font-[var(--font-display)] h3-scale font-extrabold leading-tight tracking-tight text-foreground sm:text-[1.65rem]">
                Pilot a hub with Neev
              </DialogTitle>
              <DialogDescription className="body-scale leading-relaxed text-foreground-muted">
                Share a few details. Our partnerships team typically responds within two business days.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handlePartnerSubmit} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="collegeName" className="text-foreground small-scale">
                  Institution name
                </Label>
                <Input
                  id="collegeName"
                  name="institution"
                  placeholder="City Institute of Technology"
                  required
                  autoComplete="organization"
                  className="h-11 rounded-2xl border-border bg-background focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName" className="text-foreground small-scale">
                  Your name
                </Label>
                <Input
                  id="contactName"
                  name="name"
                  placeholder="Dr. Ananya Rao"
                  required
                  autoComplete="name"
                  className="h-11 rounded-2xl border-border bg-background focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="text-foreground small-scale">
                  Job role / title
                </Label>
                <Input
                  id="jobTitle"
                  name="jobTitle"
                  placeholder="Library Director"
                  required
                  autoComplete="organization-title"
                  className="h-11 rounded-2xl border-border bg-background focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground small-scale">
                  Work email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@college.edu"
                  required
                  autoComplete="email"
                  className="h-11 rounded-2xl border-border bg-background focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-foreground small-scale">
                  City and state
                </Label>
                <Input
                  id="city"
                  name="cityState"
                  placeholder="Bengaluru, Karnataka"
                  required
                  autoComplete="address-level2"
                  className="h-11 rounded-2xl border-border bg-background focus-visible:ring-primary"
                />
              </div>
              <Button type="submit" className="mt-2 h-11 w-full rounded-2xl font-bold small-scale">
                Submit
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <div className="w-full bg-background font-sans selection:bg-primary/20 selection:text-primary">
        {/* 1. HERO SECTION WITH VIDEO BACKGROUND */}
        <section id="hero" ref={heroRef} className="relative h-[100dvh] w-full overflow-hidden bg-primary">
          {/* Video Background */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/6344218-hd_2048_1080_25fps.mp4" type="video/mp4" />
          </video>

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-neutral-950/40 z-10" />

          <Container className="relative z-20 h-full flex items-center px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center w-full">
              {/* Left Column: Typography & CTA */}
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="max-w-2xl"
              >
                <motion.h1
                  variants={fadeUp}
                  className="mt-4 text-balance font-[var(--font-display)] hero-title font-bold text-on-media"
                >
                  Upgrade library space into a <br />

                  <span className="mt-4 inline-block bg-surface p-2 text-primary">
                    Neev study hub.
                  </span>
                </motion.h1>
                <motion.p
                  variants={fadeUp}
                  className="mt-6 body-scale text-on-media-muted max-w-xl"
                >
                  Start with zero upfront capex. We align on space, traffic, and operations, then scale when your institution is ready.
                </motion.p>

                <motion.div variants={stagger} className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <motion.div variants={fadeUp} className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      onClick={() => setPartnerDialogOpen(true)}
                      className="magnetic-btn flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-10 h-16 small-scale font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary hover:-translate-y-0.5"
                    >
                      Schedule a Conversation <ArrowRight className="h-5 w-5" />
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </Container>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 10 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-on-media-subtle"
          >
            <span className="caption-scale font-bold uppercase tracking-[0.2em]">Scroll to explore</span>
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </section>

        <section className="py-24 bg-surface border-y border-border overflow-hidden">
          <Container>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.18,
                  },
                },
              }}
            >
              {/* Center Heading */}
              <motion.div
                variants={fadeUp}
                className="max-w-4xl mx-auto text-center mb-20"
              >
                <motion.h2
                  variants={fadeUp}
                  className="mt-8 font-[var(--font-display)] text-foreground"
                >
                  <h2 className="h2-scale">
                    Turn Library Foot Traffic Into Student Engagement
                  </h2>
                </motion.h2>

                <p className="text-[1.05rem] md:text-[1.12rem] leading-[1.9] text-muted-foreground max-w-2xl mx-auto mt-10">
                  Neev helps libraries transform unused areas into modern discovery and
                  pickup hubs with streamlined desk workflows and accountable handoffs.
                </p>
              </motion.div>

              {/* Reveal Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                {[
                  {
                    accent: "bg-primary",
                    icon: "https://cdn-icons-gif.flaticon.com/6454/6454149.gif",
                    title: "Physical experience",
                    body: "Refresh underused stacks and desk workflows so the library feels current.",
                  },
                  {
                    accent: "bg-primary",
                    icon: "https://cdn-icons-gif.flaticon.com/19026/19026390.gif",
                    title: "Modern student flow",
                    body: "App-based discovery and desk handoff match retail expectations.",
                  },
                  {
                    accent: "bg-primary",
                    icon: "https://cdn-icons-gif.flaticon.com/7920/7920927.gif",
                    title: "Traceable handoffs",
                    body: "Desk-assisted pickup ensures condition and accountability stay visible.",
                  },
                ].map((item, index) => (
                  <motion.article
                    key={item.title}
                    variants={{
                      hidden: {
                        opacity: 0,
                        y: 80,
                      },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.7,
                          ease: [0.22, 1, 0.36, 1],
                          delay: index * 0.1,
                        },
                      },
                    }}
                    className="group relative bg-surface border border-border px-8 py-10 md:py-12 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
                  >
                    {/* Glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-50/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="flex items-center gap-5 mb-8">
                      {/* Icon */}
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
                        <img
                          src={item.icon}
                          alt={item.title}
                          className="h-12 w-12 object-contain transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>

                      {/* Title */}
                      <h3 className="text-[1.25rem] md:text-[1.35rem] font-bold tracking-[-0.03em] text-foreground leading-tight group-hover:text-primary transition-colors duration-500">
                        {item.title}
                      </h3>
                    </div>

                    {/* Body */}
                    <p className="text-[0.93rem] md:text-[0.98rem] uppercase tracking-[0.12em] leading-[1.8] text-muted-foreground group-hover:text-muted-foreground transition-colors duration-500">
                      {item.body}
                    </p>
                  </motion.article>
                ))}
              </div>
            </motion.div>
          </Container>
        </section>

        <section className="relative overflow-hidden bg-background py-24 md:py-32">
          <Container>
            {/* HEADER */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="mx-auto mb-20 md:mb-32 max-w-4xl text-center"
            >
              <motion.div
                variants={fadeUp}
                className="font-[var(--font-display)] text-foreground"
              >
                <h2 className="h2-scale">From MoU to first desk day.</h2>
              </motion.div>

              <motion.p
                variants={fadeUp}
                className="mx-auto mt-6 max-w-3xl body-scale text-muted-foreground"
              >
                Legal scope, infrastructure setup, onboarding,
                and launch operations aligned into one structured rollout.
              </motion.p>
            </motion.div>

            {/* FLOW */}
            <div className="relative mx-auto max-w-5xl">
              <div className="relative flex flex-col gap-6 md:gap-10">

                {PILOT_STEPS.map((step, idx) => {
                  const isEven = idx % 2 === 0;
                  const isHovered = hoveredIdx === idx;

                  return (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      className={`relative flex w-full ${isEven ? 'justify-start' : 'justify-end'}`}
                    >
                      {/* HAND-DRAWN ARROWS (Desktop only) */}
                      {idx < PILOT_STEPS.length - 1 && (
                        <div className={`absolute hidden md:block pointer-events-none z-0`}
                          style={{
                            top: '65%',
                            left: isEven ? '45%' : 'auto',
                            right: !isEven ? '45%' : 'auto',
                            width: '300px',
                            height: '140px'
                          }}>
                          <svg width="100%" height="100%" viewBox="0 0 300 140" fill="none">
                            <defs>
                              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                              </filter>
                            </defs>
                            <motion.path
                              d={isEven
                                ? "M 10 20 C 150 20, 150 120, 290 120" // Left to Right
                                : "M 290 20 C 150 20, 150 120, 10 120" // Right to Left
                              }
                              stroke="var(--primary)"
                              strokeWidth={hoveredIdx !== null && idx < hoveredIdx ? "3.5" : "2.5"}
                              strokeDasharray="6 4"
                              strokeLinecap="round"
                              animate={{
                                pathLength: 1,
                                opacity: hoveredIdx !== null && idx < hoveredIdx ? 1 : 0.25,
                                strokeDashoffset: hoveredIdx !== null && idx < hoveredIdx ? [-20, 0] : 0,
                                filter: hoveredIdx !== null && idx < hoveredIdx ? "url(#glow)" : "none"
                              }}
                              transition={{
                                strokeDashoffset: { duration: 1, repeat: Infinity, ease: "linear" },
                                opacity: { duration: 0.3 },
                                strokeWidth: { duration: 0.3 }
                              }}
                              className="filter blur-[0.2px]"
                            />
                            {/* Scribble effect path */}
                            <motion.path
                              d={isEven
                                ? "M 12 22 C 148 18, 152 122, 288 118"
                                : "M 288 22 C 152 18, 148 122, 12 118"
                              }
                              stroke="var(--primary)"
                              strokeWidth="1"
                              strokeDasharray="3 7"
                              strokeLinecap="round"
                              animate={{
                                pathLength: 1,
                                opacity: hoveredIdx !== null && idx < hoveredIdx ? 0.6 : 0.15
                              }}
                            />
                            {/* Arrowhead */}
                            <motion.path
                              d={isEven
                                ? "M 280 110 L 290 120 L 280 130"
                                : "M 20 110 L 10 120 L 20 130"
                              }
                              stroke="var(--primary)"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              animate={{
                                opacity: hoveredIdx !== null && idx < hoveredIdx ? 1 : 0.3,
                                scale: hoveredIdx !== null && idx < hoveredIdx ? 1.2 : 1
                              }}
                            />
                          </svg>
                        </div>
                      )}

                      {/* CARD CONTENT */}
                      <div className="relative z-10 w-full md:w-[45%] group">
                        <div className={`relative bg-surface border p-6 md:p-8 transition-all duration-500 rounded-2xl overflow-hidden h-full
                          ${isHovered ? 'shadow-2xl border-primary/30 -translate-y-1' : 'border-primary/10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'}`}>

                          {/* Number Badge */}
                          <div className={`absolute top-0 ${isEven ? 'right-0' : 'left-0'} flex h-14 w-14 items-center justify-center transition-colors duration-500
                            ${isHovered ? 'bg-primary/10 text-primary/40' : 'bg-primary/5/50 text-primary/20'} text-3xl font-black leading-none`}>
                            {idx + 1}
                          </div>

                          {/* Icon Container */}
                          <div className="relative mb-6 flex h-16 w-16 items-center justify-center overflow-hidden">
                            <img
                              src={step.icon.animated}
                              alt={step.title}
                              className="h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-110"
                            />
                          </div>

                          {/* Text Content */}
                          <h3 className={`font-[var(--font-display)] text-lg font-bold mb-4 tracking-tight transition-colors duration-300
                            ${isHovered ? 'text-primary' : 'text-foreground'}`}>
                            {step.title}
                          </h3>
                          <p className={`leading-relaxed text-[0.92rem] md:text-sm transition-colors duration-300
                            ${isHovered ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.body}
                          </p>

                          {/* Hover Accent */}
                          <div className={`mt-8 h-1 bg-primary transition-all duration-500 
                            ${isHovered ? 'w-24' : 'w-10 opacity-30'}`} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </Container>
        </section>

        <section className="relative overflow-hidden bg-primary py-24 md:py-32">
          <div className="absolute top-0 left-0 w-96 h-96 bg-overlay-glass blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-overlay-glass blur-[80px] rounded-full pointer-events-none" />

          <Container>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              className="relative z-10 max-w-4xl mx-auto text-center"
            >
              <h2 className="font-[var(--font-display)] h1-scale text-on-media mb-8">
                Ready to talk about one pilot hub?
              </h2>
              <p className="body-scale text-on-media-muted mb-12 max-w-2xl mx-auto">
                We walk through space, staffing, and timelines, and only scale when your institution is comfortable.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Button
                  size="lg"
                  onClick={() => setPartnerDialogOpen(true)}
                  className="bg-surface text-primary hover:bg-muted h-16 px-10 rounded-2xl font-bold small-scale transition-all hover:-translate-y-1 shadow-xl"
                >
                  Schedule a Conversation
                  <span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
                <Link href="/about">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-overlay-glass-border bg-overlay-glass text-on-media hover:bg-overlay-glass h-16 px-10 rounded-2xl font-bold small-scale backdrop-blur-md transition-all hover:-translate-y-1"
                  >
                    Learn More About Neev
                  </Button>
                </Link>
              </div>
            </motion.div>
          </Container>
        </section>
      </div>
    </>
  );
}
