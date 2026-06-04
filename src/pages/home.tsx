import { Link } from "wouter";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, BookOpen, Network, ShieldCheck, ChevronDown,
  Check
} from "lucide-react";
import { Container } from "@/components/home/Container";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const viewportOnce = { once: true, margin: "-20px", amount: 0.1 } as const;

const SHOWCASE_BOOKS = [
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1614849963640-9cc74b2a826f?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop",
];
const titleWords = ["Your", "phygital", "network,"];
const highlightWords = ["upgraded."];

const wordAnimation = {
  hidden: {
    opacity: 0,
    y: 40,
    rotateX: -90,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export default function Home() {
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const lotusRef = useRef<HTMLDivElement>(null);

  // Carousel State
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const { scrollYProgress: lotusProgress } = useScroll({
    target: lotusRef,
    offset: ["start end", "end start"]
  });

  const leftX = useTransform(lotusProgress, [0.1, 0.45], [0, -420]);
  const rightX = useTransform(lotusProgress, [0.1, 0.45], [0, 420]);
  const leftRotate = useTransform(lotusProgress, [0.1, 0.45], [0, -5]);
  const rightRotate = useTransform(lotusProgress, [0.1, 0.45], [0, 5]);
  const centerScale = useTransform(lotusProgress, [0.1, 0.45], [0.8, 1]);
  const centerOpacity = useTransform(lotusProgress, [0.1, 0.3], [0, 1]);
  const outerOpacity = useTransform(lotusProgress, [0.1, 0.35], [0, 1]);

  // HERO_BG_IMAGES removed in favor of video hero

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

  return (
    <div className="w-full bg-[#FAFAFA] font-sans selection:bg-primary/20 selection:text-primary">

      {/* 1. HERO SECTION */}
      <section id="hero" ref={heroRef} className="relative min-h-[100dvh] flex flex-col justify-center items-center overflow-hidden bg-slate-900">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          >
            <source src="/14543425-uhd_3840_2160_24fps.mp4" type="video/mp4" />
          </video>
          {/* Overlay for contrast */}
          <div className="absolute inset-0 bg-slate-950/40" />
        </div>

        <Container className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center"
          >
            <h1 className="flex flex-col items-center">
              <motion.span
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="text-[120px] md:text-[220px] font-black leading-none tracking-tighter text-primary drop-shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]"
              >
                Neev
              </motion.span>
              <motion.span
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="mt-[-10px] md:mt-[-30px] text-2xl md:text-5xl font-[var(--font-display)] italic tracking-[0.2em] md:tracking-[0.3em] text-white uppercase"
              >
                Phygital Library
              </motion.span>
            </h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-20 flex flex-col items-center gap-6"
            >
              <div className="h-px w-24 bg-white/20" />
              <p className="text-white/60 uppercase tracking-[0.4em] text-[10px] font-bold">Bridging Physical & Digital</p>
            </motion.div>
          </motion.div>
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
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/50"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Scroll to explore</span>
          <ChevronDown className="h-6 w-6" />
        </motion.div>
      </section>

      {/* INTRO SECTION */}
      <section className="relative bg-white pt-20 pb-12 md:pt-32 md:pb-24">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left Column: Typography & CTA */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="max-w-2xl"
            >
              <motion.h1
                className="mt-4 hero-title text-foreground font-bold"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="flex flex-wrap gap-x-3 gap-y-1 sm:gap-x-4 sm:gap-y-2">
                  {titleWords.map((word, i) => (
                    <motion.span
                      key={word}
                      custom={i}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={wordAnimation}
                      className="inline-block font-[var(--font-display)]"
                    >
                      {word}
                    </motion.span>
                  ))}

                  {highlightWords.map((word, i) => (
                    <motion.span
                      key={word}
                      custom={i + titleWords.length}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={wordAnimation}
                      className="inline-block font-[var(--font-display)] text-primary"
                    >
                      {word}
                    </motion.span>
                  ))}
                </div>
              </motion.h1>

              <motion.p
                variants={{
                  hidden: {
                    opacity: 0,
                    y: 30,
                    filter: "blur(10px)",
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    transition: {
                      delay: 0.45,
                      duration: 1,
                      ease: [0.22, 1, 0.36, 1],
                    },
                  },
                }}
                initial="hidden"
                animate="visible"
                className="mt-6 max-w-xl body-scale text-muted-foreground"
              >
                Neev upgrades campus spaces into premium discovery hubs.
                Experience seamless physical borrowing powered by smart
                routing and community intelligence.
              </motion.p>

              <motion.div variants={stagger} className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <motion.div variants={fadeUp} className="w-full sm:w-auto">
                  <Link href="/login" className="magnetic-btn flex w-full items-center justify-center gap-2 rounded-none bg-primary px-6 py-3 small-scale font-bold text-white shadow-md transition-all hover:bg-primary hover:-translate-y-0.5">
                    Explore Network <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
                <motion.div variants={fadeUp} className="w-full sm:w-auto">
                  <Link href="/colleges" className="magnetic-btn flex w-full items-center justify-center gap-2 rounded-none border border-border bg-white px-6 py-3 small-scale font-bold text-foreground shadow-sm transition-all hover:border-border hover:bg-muted hover:-translate-y-0.5">
                    Partner With Us
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-12 flex items-center gap-6 border-t border-border pt-8">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-7 w-7 rounded-full border-2 border-white bg-muted/50 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="small-scale">
                    <p className="font-bold text-foreground">12k+</p>
                    <p className="caption-scale text-muted-foreground">Active Readers</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-muted/50" />
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-bold text-foreground small-scale">Verified</p>
                    <p className="caption-scale text-muted-foreground">Campus Hubs</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              variants={fadeUp}
              className="relative block mt-12 lg:mt-0 h-[400px] sm:h-[500px] w-full perspective-1000"
            >
              {/* Book Stack Wrapper */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                {/* Decorative Book Stack */}
                <motion.div
                  animate={{ y: [0, -10, 0], rotateX: [10, 11, 10], rotateY: [-15, -13, -15] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="relative w-[280px] h-[380px] rounded-none shadow-xl overflow-visible border border-border bg-white"
                >
                  <img
                    src="/literary_poet_portrait.png"
                    alt="Poet Portrait"
                    className="w-full h-full object-cover opacity-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent" />

                  {/* Floating UI Card */}
                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1,
                    }}
                    className="absolute -top-6 -left-14 bento-card p-3 flex items-center gap-2.5 w-[160px] z-30 shadow-2xl bg-white border-border"
                  >
                    <div className="h-8 w-8 rounded-none flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.15em]">AVAILABLE NOW</p>
                      <p className="flex items-baseline gap-1 text-[15px] font-bold text-foreground leading-none">
                        <span className="text-primary">12,450+</span>
                        <span>Titles</span>
                      </p>
                    </div>
                  </motion.div>

                  {/* Floating UI Card 2 */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute -bottom-8 -right-10 bento-card p-3 flex items-center gap-2.5 w-[160px] z-30 shadow-2xl bg-white border-border"
                  >
                    <div className="h-8 w-8 rounded-none flex items-center justify-center">
                      <Network className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Hub Network</p>
                      <p className="small-scale font-bold text-foreground leading-none">Connected</p>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* FLOATING FEATURE CARDS */}
      <section className="relative overflow-hidden py-24 md:py-32 bg-[#FAFAFA]">
        <Container>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="flex flex-col items-center"
          >
            {/* Heading */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col items-center text-center"
            >
              {/* Title */}
              <motion.div
                variants={fadeUp}
                className="mb-8 mt-8 font-[var(--font-display)] text-foreground text-center"
              >
                <h2 className="h2-scale">
                  Borrow, buy, and exchange <span className="text-primary">locally.</span>
                </h2>
              </motion.div>

              {/* Paragraph */}
              <p className="mt-6 max-w-2xl body-scale leading-relaxed text-muted-foreground">
                Discover curated libraries, intelligent recommendations,
                and premium campus reading experiences.
              </p>
            </motion.div>

            {/* LOTUS BLOOM CARDS */}
            <div ref={lotusRef} className="w-full mt-8 md:mt-0">
              {/* DESKTOP BLOOM VIEW */}
              <div className="hidden md:flex relative items-center justify-center w-full min-h-[500px] overflow-hidden">

                {/* LEFT CARD */}
                <motion.div
                  style={{
                    x: leftX,
                    rotate: leftRotate,
                    opacity: outerOpacity,
                  }}
                  transition={{
                    duration: 1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{
                    y: -15,
                    rotate: -12,
                    scale: 1.03,
                  }}
                  className="
        absolute
        w-[240px]
        h-[380px]
        rounded-none
        overflow-hidden
        border border-primary/10
        shadow-md
        bg-white
        z-10
      "
                >
                  <img
                    src={SHOWCASE_BOOKS[4]}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="rounded-none bg-white/90 backdrop-blur-xl p-5">
                      <h3 className="h3-scale text-foreground mb-2.5">
                        The Explorers
                      </h3>

                      <p className="body-scale text-muted-foreground">
                        Discover curated libraries and premium reading spaces.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* CENTER CARD */}
                <motion.div
                  style={{
                    scale: centerScale,
                    opacity: centerOpacity,
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.15,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{
                    y: -20,
                    scale: 1.05,
                  }}
                  className="
        absolute
        w-[280px]
        h-[460px]
        rounded-none
        overflow-hidden
        border border-primary/10
        shadow-lg
        bg-white
        z-30
      "
                >
                  <img
                    src={SHOWCASE_BOOKS[5]}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="rounded-none bg-white/90 backdrop-blur-xl p-6">
                      <h3 className="h3-scale text-foreground mb-3">
                        The Knowledge Builder
                      </h3>

                      <p className="body-scale text-muted-foreground">
                        Intelligent discovery, reading analytics,
                        and seamless library management.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* RIGHT CARD */}
                <motion.div
                  style={{
                    x: rightX,
                    rotate: rightRotate,
                    opacity: outerOpacity,
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{
                    y: -15,
                    rotate: -12,
                    scale: 1.03,
                  }}
                  className="
        absolute
        w-[240px]
        h-[380px]
        rounded-none
        overflow-hidden
        border border-primary/10
        shadow-md
        bg-white
        z-10
      "
                >
                  <img
                    src={SHOWCASE_BOOKS[6]}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="rounded-none bg-white/90 backdrop-blur-xl p-5">
                      <h3 className="h3-scale text-foreground mb-2.5">
                        The Readers
                      </h3>

                      <p className="body-scale text-muted-foreground">
                        Build habits, share highlights,
                        and grow your reading network.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* MOBILE CAROUSEL VIEW */}
              <div className="block md:hidden w-full">
                <Carousel
                  setApi={setApi}
                  opts={{
                    align: "center",
                    loop: true,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-1 md:-ml-4">
                    {/* CARD 1 */}
                    <CarouselItem className="pl-1 basis-[90%] sm:basis-[85%]">
                      <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="relative h-[420px] rounded-none overflow-hidden border border-primary/10 shadow-md bg-white"
                      >
                        <img
                          src={SHOWCASE_BOOKS[4]}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="rounded-none bg-white/90 backdrop-blur-xl p-5">
                            <h3 className="h3-scale text-foreground mb-2.5">The Explorers</h3>
                            <p className="body-scale text-muted-foreground">Discover curated libraries and premium reading spaces.</p>
                          </div>
                        </div>
                      </motion.div>
                    </CarouselItem>

                    {/* CARD 2 */}
                    <CarouselItem className="pl-1 basis-[90%] sm:basis-[85%]">
                      <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="relative h-[420px] rounded-none overflow-hidden border border-primary/10 shadow-md bg-white"
                      >
                        <img
                          src={SHOWCASE_BOOKS[5]}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <div className="rounded-none bg-white/90 backdrop-blur-xl p-6">
                            <h3 className="h3-scale text-foreground mb-3">The Knowledge Builder</h3>
                            <p className="body-scale text-muted-foreground">Intelligent discovery, reading analytics, and seamless library management.</p>
                          </div>
                        </div>
                      </motion.div>
                    </CarouselItem>

                    {/* CARD 3 */}
                    <CarouselItem className="pl-1 basis-[90%] sm:basis-[85%]">
                      <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="relative h-[420px] rounded-none overflow-hidden border border-primary/10 shadow-md bg-white"
                      >
                        <img
                          src={SHOWCASE_BOOKS[6]}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="rounded-none bg-white/90 backdrop-blur-xl p-5">
                            <h3 className="h3-scale text-foreground mb-2.5">The Readers</h3>
                            <p className="body-scale text-muted-foreground">Build habits, share highlights, and grow your reading network.</p>
                          </div>
                        </div>
                      </motion.div>
                    </CarouselItem>
                  </CarouselContent>
                </Carousel>

                {/* Carousel Indicators */}
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: count }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => api?.scrollTo(i)}
                      className={cn(
                        "h-1.5 rounded-none transition-all duration-300",
                        current === i + 1
                          ? "w-8 bg-primary"
                          : "w-2 bg-slate-300 hover:bg-slate-400"
                      )}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* 3. ANIMATED BOOK SHOWCASE */}
      <section className="py-16 overflow-hidden bg-white border-y border-border">
        <motion.div
          variants={fadeUp}
          className="mb-8 font-[var(--font-display)] text-foreground text-center"
        >
          <h2 className="h2-scale">
            Trending at your <span className="text-primary">hubs</span>
          </h2>
        </motion.div>

        {/* Infinite Scroll Container */}
        <div className="relative w-full flex overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-white to-transparent pointer-events-none" />

          <motion.div
            className="flex gap-8 px-4"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ ease: "linear", duration: 30, repeat: Infinity }}
            style={{ width: "fit-content" }}
          >
            {/* Duplicate list for seamless looping */}
            {[...SHOWCASE_BOOKS, ...SHOWCASE_BOOKS, ...SHOWCASE_BOOKS].map((src, idx) => (
              <div
                key={idx}
                className="group relative w-[160px] h-[230px] shrink-0 rounded-none overflow-hidden shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md cursor-pointer"
              >
                <img src={src} alt="Book Mockup" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <p className="text-white font-bold small-scale truncate">Premium Title</p>
                  <p className="text-white/80 caption-scale">Available at 3 Hubs</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PREMIUM STORYTELLING SECTION */}
      <section className="py-16 md:py-20 bg-[#FAFAFA] overflow-hidden">
        <Container>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05 }}
          >

            {/* HERO HEADING */}
            <motion.div
              variants={fadeUp}
              className="text-center mb-16 font-[var(--font-display)] text-foreground"
            >
              <h2 className="h2-scale">
                A smarter way to <span className="text-primary">access books.</span>
              </h2>
            </motion.div>

            {/* FEATURE GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-20 lg:gap-24 items-start">

              {/* LEFT COLUMN */}
              <motion.div
                variants={fadeUp}
                className="space-y-6"
              >
                <div>

                  <h3 className="h3-scale text-primary mb-6">
                    Smart Discovery
                  </h3>

                  <p className="body-scale text-muted-foreground leading-relaxed">
                    Discover books, research material,
                    and community insights naturally through
                    intelligent campus-driven recommendations.
                  </p>
                </div>

                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="
              relative
              rounded-none
            "
                >
                  <img
                    src="/images/college_project-rafiki.png"
                    alt=""
                    className="w-full h-[240px] md:h-[320px] object-contain"
                  />
                </motion.div>
              </motion.div>

              {/* CENTER COLUMN */}
              <motion.div
                variants={fadeUp}
                className="flex flex-col space-y-6 lg:pt-5"
              >
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="
              order-2
              lg:order-1
              relative
              rounded-none
            "
                >
                  <img
                    src="/images/Collabration.png"

                    alt=""
                    className="w-full h-[220px] md:h-[280px] object-contain"
                  />
                </motion.div>

                <div className="order-1 lg:order-2">

                  <h3 className="h3-scale text-primary mb-6">
                    Collaborative Knowledge
                  </h3>

                  <p className="body-scale text-muted-foreground leading-relaxed">
                    Join reading communities, campus discussions,
                    and peer-powered discovery experiences that
                    make learning feel alive.
                  </p>
                </div>
              </motion.div>

              {/* RIGHT COLUMN */}
              <motion.div
                variants={fadeUp}
                className="space-y-6"
              >
                <div>
                  <h3 className="h3-scale text-primary mb-6">
                    Real Campus Experience
                  </h3>

                  <p className="body-scale text-muted-foreground leading-relaxed">
                    Seamlessly connect online discovery
                    with trusted physical library hubs and
                    premium student pickup experiences.
                  </p>
                </div>

                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="
              relative
              rounded-none
            "
                >
                  <img
                    src="/images/Library-rafiki.png"
                    alt=""
                    className="w-full h-[240px] md:h-[320px] object-contain"
                  />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </Container>
      </section>

      <section id="roadmap" className="py-12 md:py-24 bg-[#FAFAFA] overflow-hidden relative">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="group rounded-none border-y border-border bg-white py-16 md:py-24 shadow-sm relative overflow-hidden transition-all duration-500 hover:shadow-md hover:border-primary/10"
        >
          {/* Background Accents */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[140px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4 group-hover:bg-primary/10 transition-colors duration-700" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/20 blur-[100px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/4" />

          <Container className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
              <div className="lg:col-span-5">
                <motion.div
                  variants={fadeUp}
                  className="font-[var(--font-display)] text-foreground"
                >
                  <h2 className="h2-scale">
                    Growing across <span className="text-primary">campuses.</span>
                  </h2>
                </motion.div>
              </div>

              <motion.div variants={fadeUp} className="lg:col-span-7 space-y-8">
                <p className="body-scale text-muted-foreground leading-relaxed text-lg max-w-2xl">
                  We grow through pilots: partner hubs, real desk operations, and reader adoption before we chase a noisy national launch.
                  Metrics vary by campus; we publish what we can stand behind.
                </p>

                <ul className="grid grid-cols-1 gap-6">
                  {[
                    "Rolling onboarding with institutions that fit our ops bar.",
                    "Marketplace and hub flows in active iteration with early readers.",
                    "Room to collaborate if you are a student body, library lead, or administrator."
                  ].map((text, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-4 group/item"
                    >
                      <div className="mt-1.5 h-1.5 w-1.5 bg-primary shrink-0 transition-transform duration-300" />
                      <span className="small-scale text-muted-foreground leading-snug">
                        {text}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </Container>
        </motion.div>
      </section>

      {/* PREMIUM PRICING SECTION */}
      <section className="relative overflow-hidden py-20 bg-[#FAFAFA]">

        {/* Ambient Glow */}
        <div className="
    absolute
    top-0
    left-1/2
    -translate-x-1/2
    w-[700px]
    h-[400px]
    bg-primary/5
    blur-[120px]
    rounded-full
    pointer-events-none
  " />

        <Container className="relative z-10">

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >

            {/* Heading */}
            <motion.div
              variants={fadeUp}
              className="max-w-4xl mx-auto text-center mb-1"
            >
              <motion.div
                variants={fadeUp}
                className="font-[var(--font-display)] text-foreground"
              >
                <h2 className="h2-scale">
                  Flexible plans for <span className="text-primary">students</span>
                </h2>
              </motion.div>

              <p className="
          mt-8
          max-w-3xl
          mx-auto
          body-scale
          text-muted-foreground
        ">
                Premium membership for predictable access.
                Flexible retail and peer-to-peer exchange
                when ownership matters more.
              </p>
            </motion.div>

            {/* Pricing Grid */}
            <div className="
        grid
        grid-cols-1
        lg:grid-cols-2
        rounded-none
        overflow-hidden
        border
        border-slate-200/60
        bg-white
        shadow-md
      ">

              {/* LEFT PLAN */}
              <motion.div
                variants={fadeUp}
                className="
            relative
            overflow-hidden
            p-8
            md:p-10
            border-b
            lg:border-b-0
            lg:border-r
            border-border
          "
              >

                {/* Glow */}
                <div className="
            absolute
            top-0
            right-0
            w-72
            h-72
            bg-primary/5
            blur-[100px]
            rounded-full
          " />

                <div className="relative z-10">

                  <div className="
              inline-flex
              rounded-none
              bg-primary/10
              px-3
              py-1
              caption-scale
              font-bold
              uppercase
              tracking-widest
              text-primary
            ">
                    Premium Membership
                  </div>

                  <div className="mt-10 flex items-end gap-2">
                    <span className="
                h1-scale
                text-foreground
              ">
                      ₹199
                    </span>

                    <span className="
                small-scale
                text-muted-foreground
                mb-2
              ">
                      /month
                    </span>
                  </div>

                  <div className="
              mt-3
              inline-flex
              rounded-none
              border
              border-border
              px-3
              py-1
              small-scale
              font-medium
              text-muted-foreground
            ">
                    or ₹999 / year
                  </div>

                  <p className="
              mt-6
              small-scale
              text-muted-foreground
              max-w-md
            ">
                    Borrow from premium inventory,
                    unlock intelligent recommendations,
                    and access the peer-to-peer lane
                    with priority routing.
                  </p>

                  {/* Features */}
                  <div className="mt-10 space-y-5">

                    {[
                      "Unlimited smart discovery",
                      "Priority campus routing",
                      "Extended borrowing windows",
                      "Premium community access",
                    ].map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-4"
                      >
                        <div className="
                    flex
                    h-6
                    w-6
                    items-center
                    justify-center
                    rounded-none
                  ">
                          <Check className="h-4 w-4 text-primary" />
                        </div>

                        <span className="text-muted-foreground small-scale font-medium">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link
                    href="/login"
                    className="
                mt-10
                inline-flex
                items-center
                gap-2
                rounded-none
                bg-primary
                px-6
                py-3
                small-scale
                font-bold
                text-white
                shadow-md
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:bg-primary
              "
                  >
                    Start Membership
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                </div>
              </motion.div>

              {/* RIGHT PLAN */}
              <motion.div
                variants={fadeUp}
                className="
            relative
            overflow-hidden
            p-8
            md:p-10
            bg-gradient-to-b
            from-white
            to-slate-50
          "
              >

                <div className="relative z-10">

                  <div className="
              inline-flex
              rounded-none
              bg-primary
              px-3
              py-1
              caption-scale
              font-bold
              uppercase
              tracking-widest
              text-white
            ">
                    Retail & Peer-to-Peer
                  </div>

                  <h3 className="
              mt-10
              h3-scale
              text-foreground
            ">
                    Pay per title.
                    <br />
                    No subscription.
                  </h3>

                  <p className="
              mt-6
              small-scale
              text-muted-foreground
              max-w-md
            ">
                    Buy, exchange, or resell books directly.
                    Keep transactions local, secure,
                    and connected to trusted campus hubs.
                  </p>

                  {/* Visual Stats */}
                  <div className="
              mt-12
              grid
              grid-cols-2
              gap-5
            ">

                    {[
                      {
                        value: "0%",
                        label: "Forced Lock-in",
                      },
                      {
                        value: "24h",
                        label: "Avg Transfer Time",
                      },
                      {
                        value: "100%",
                        label: "Verified Exchanges",
                      },
                      {
                        value: "50+",
                        label: "Connected Hubs",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="
                    rounded-none
                    border
                    border-slate-200/60
                    bg-white
                    p-5
                  "
                      >
                        <div className="
                    h2-scale
                    text-foreground
                  ">
                          {item.value}
                        </div>

                        <div className="
                    mt-2
                    small-scale
                    text-muted-foreground
                  ">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Secondary CTA */}
                  <Link
                    href="/marketplace"
                    className="
                mt-10
                inline-flex
                items-center
                gap-2
                rounded-md
                border
                border-border
                bg-white
                px-6
                py-3
                small-scale
                font-bold
                text-foreground
                transition-all
                duration-300
                hover:border-border
                hover:bg-muted
              "
                  >
                    Explore Marketplace
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                </div>
              </motion.div>
            </div>

          </motion.div>
        </Container>
      </section>
      {/* PREMIUM FAQ SECTION */}
      <section className="relative overflow-hidden bg-[#FAFAFA] py-16 md:py-24">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 sm:px-6 lg:px-8"
        >
          {/* Heading */}
          <motion.div
            variants={fadeUp}
            className="mb-8 font-[var(--font-display)] text-foreground text-center"
          >
            <h2 className="h2-scale">
              Common questions
            </h2>

            <p
              className="
      mx-auto mt-4 max-w-2xl
      body-scale text-muted-foreground
    "
            >
              Everything you need to know about the Neev ecosystem,
              campus hubs, premium memberships, and smart discovery.
            </p>
          </motion.div>

          {/* FAQ Accordion */}
          <motion.div
            variants={fadeUp}
            className="mx-auto w-full max-w-5xl"
          >
            <Accordion
              type="single"
              collapsible
              className="border-t border-border"
            >
              {[
                {
                  q: "Is Neev a college or a university?",
                  a: "Neev is a technology and logistics ecosystem designed to modernize access to books and knowledge through connected campus hubs.",
                },
                {
                  q: "What happens if a book isn't available nearby?",
                  a: "Our routing engine intelligently searches connected hubs and partner inventory to locate and transfer books efficiently.",
                },
                {
                  q: "How do campus hubs work?",
                  a: "Partner colleges provide trusted pickup spaces where students can borrow, exchange, reserve, and return books seamlessly.",
                },
                {
                  q: "Can students exchange books directly?",
                  a: "Yes. Neev supports secure peer-to-peer exchanges through verified campus networks and managed handoff systems.",
                },
                {
                  q: "What does Premium membership include?",
                  a: "Premium unlocks advanced analytics, extended borrowing periods, priority discovery access, and curated reading experiences.",
                },
              ].map((item, i) => (
                <AccordionItem
                  key={String(i)}
                  value={`item-${i}`}
                  className="border-b border-border"
                >
                  <AccordionTrigger
                    className="
            group
            px-0 py-4
            transition-all duration-300
            hover:no-underline
            md:py-5
          "
                  >
                    <div className="flex w-full items-center justify-between gap-4">
                      <motion.div
                        variants={fadeUp}
                        className="text-foreground"
                      >
                        <h3 className="text-2xl">
                          {item.q}
                        </h3>
                      </motion.div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent
                    className="
            pb-5 pr-8
            small-scale text-muted-foreground
            md:pb-6 md:pr-16
          "
                  >
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </motion.div>
      </section>

      {/* PREMIUM FINAL CTA */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-[#07111F]">

        {/* Ambient Background */}
        <div className="
    absolute
    inset-0
    bg-primary
  " />

        <div className="
    absolute
    top-0
    left-1/2
    -translate-x-1/2
    w-[900px]
    h-[500px]
    bg-blue-500/20
    blur-[140px]
    rounded-full
    pointer-events-none
  " />

        <div className="
    absolute
    bottom-0
    right-0
    w-[500px]
    h-[500px]
    bg-cyan-400/10
    blur-[120px]
    rounded-full
    pointer-events-none
  " />

        {/* Noise Texture */}
        <div className="
    absolute
    inset-0
    opacity-[0.03]
    mix-blend-soft-light
    bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PScwIDAgMjAwIDIwMCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48ZmlsdGVyIGlkPSdub2lzZUZpbHRlcic+PGZlVHVyYnVsZW5jZSB0eXBlPSdmcmFjdGFsTm9pc2UnIGJhc2VGcmVxdWVuY3k9JzAuNjUnIG51bU9jdGF2ZXM9JzMnIHN0aXRjaFRpbGVzPSdzdGl0Y2gnLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyBmaWx0ZXI9J3VybCgjbm9pc2VGaWx0ZXIpJy8+PC9zdmc+')]
  " />

        <Container className="relative z-10">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="max-w-6xl mx-auto text-center"
          >
            <motion.h2
              variants={fadeUp}
              className="
    mx-auto
    max-w-4xl
    font-[var(--font-display)]
    h1-scale
    text-white
  "
            >
              Join the phygital network.
            </motion.h2>

            {/* Subtext */}
            <motion.p
              variants={fadeUp}
              className="
          mt-6
          max-w-2xl
          mx-auto
          small-scale
          text-slate-300
        "
            >
              Join the premium campus reading ecosystem built
              for faster access, lower semester costs,
              and intelligent discovery across connected libraries.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={stagger}
              className="
          mt-10
          flex
          flex-col
          sm:flex-row
          items-center
          justify-center
          gap-4
        "
            >

              {/* Primary */}
              <motion.div variants={fadeUp}>
                <Link
                  href="/login"
                  className="
              group
              inline-flex
              items-center
              gap-2
              rounded-none
              bg-white
              px-6
              py-3
              small-scale
              font-bold
              text-foreground
              shadow-lg
              transition-all
              duration-300
              hover:scale-105
              hover:bg-primary/10
            "
                >
                  Get Started Free

                  <div className="
              flex
              h-6
              w-6
              items-center
              justify-center
              rounded-none
              text-foreground
              transition-transform
              duration-300
              group-hover:translate-x-1
            ">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              </motion.div>

              {/* Secondary */}
              <motion.div variants={fadeUp}>
                <Link
                  href="/about"
                  className="
              inline-flex
              items-center
              gap-2
              rounded-none
              border
              border-white/10
              bg-white/5
              backdrop-blur-xl
              px-6
              py-3
              small-scale
              font-bold
              text-white
              transition-all
              duration-300
              hover:bg-white/10
            "
                >
                  Explore Ecosystem
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </Container>
      </section>

    </div>
  );
}
