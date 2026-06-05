import React, { useState } from 'react';
import { ShieldCheck, Cpu, HardDrive, Zap, Compass, RefreshCw, BarChart2, Radio, CheckCircle } from 'lucide-react';

interface NeevOverviewProps {
  branch: string;
  setActiveTab: (tab: string) => void;
}

export const NeevOverview: React.FC<NeevOverviewProps> = ({ branch, setActiveTab }) => {
  const [selectedSpec, setSelectedSpec] = useState<number>(0);

  // In production, these stats should be fetched from the backend `/api/overview` endpoint
  // Currently, the backend does not expose a public endpoint for branch telemetry.
  // We document this limitation here and fallback to zeroed data until the endpoint is available.
  const stats = { activeUsers: 'N/A', booksCount: 'N/A', activeBorrows: 'N/A', dailyVisits: 'N/A', humidity: 'N/A', airQuality: 'N/A' };

  const specifications = [
    {
      title: "UHF RFID Book Tagging",
      subtitle: "Zero-Battery Passive Sensors",
      icon: Radio,
      desc: "Each physical book has a lightweight, bendable ultra-frequency smart label embedded inside its rear spine cover. Operates completely without internal power, harvesting energy during scan sweeps.",
      bulletPoints: [
        "Identifies book exact ID within 0.1s passing through main corridors",
        "Anti-theft gates automatically query book reservation states",
        "Interference-free overlapping scans can register 20 books inside a carry bag at once"
      ],
      color: "from-blue-500/10 to-blue-500/2"
    },
    {
      title: "Load-Sensing Intelligent Shelves",
      subtitle: "Weight Sensor & In-Situ Detection",
      icon: HardDrive,
      desc: "Custom-manufactured modular metal shelves fitted with precision dual-strain scale load-cells and local multiplexed nodes beneath reading tracks.",
      bulletPoints: [
        "Detects lifting actions instantaneous to within 3.5 grams accuracy",
        "Flags misplaced volume automatically (e.g. Science book resting on Fiction shelf B)",
        "Generates in-situ reading heatmaps indicating which chapters are opened on-shelf frequently"
      ],
      color: "from-indigo-500/10 to-indigo-500/2"
    },
    {
      title: "Real-Time Spatial Wayfinding",
      subtitle: "Interactive Vector Routing",
      icon: Compass,
      desc: "Synchronized routing engine which connects search queries to actual structural coordinates. Solves the 'lost inside aisles' fatigue.",
      bulletPoints: [
        "Binds shelf IDs into static absolute SVG nodes for clear drawing metrics",
        "Computes shortest-path calculations from main desks to desired targets",
        "Pairs nicely with automated local LEDs on shelf edges which pulse when the reader gets close"
      ],
      color: "from-amber-500/10 to-amber-500/2"
    },
    {
      title: "Generative AI Companion Nodes",
      subtitle: "Embedded Book-Sparks Modules",
      icon: Cpu,
      desc: "Integrated with Gemini's reasoning layers to create instant personalized e-companions. Fuses physical paper reading with micro-quizzes.",
      bulletPoints: [
        "Generates interactive flashcards and glossaries inside card wallets instantly",
        "Turns a photo of printed text margins into custom interactive study guides",
        "Saves dynamic progress across both digital screens and physical reading pages"
      ],
      color: "from-purple-500/10 to-purple-500/2"
    }
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      {/* Immersive Tag Line */}
      <section className="text-center max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary/10 border border-blue-900/60 rounded-full text-[10px] font-mono font-medium text-primary uppercase tracking-widest">
          <Zap className="w-3 h-3 text-primary animate-pulse" />
          <span>Neev Foundation Launch</span>
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
          Syllabus textbooks are heavy.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-slate-200 to-zinc-400">
            Let's give physical libraries a digital soul.
          </span>
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-light max-w-3xl mx-auto">
          Neev is India's premier Phygital (Physical + Digital) library integration suite. We enable colleges to onboard campuses seamlessly, calibrate dynamic weight-cell bookshelves, and equip students with wireless smart library cards for instant book discovery and AI-powered study guides.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setActiveTab('catalog')}
            className="px-6 py-2.5 bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl font-bold text-xs tracking-wide transition shadow shadow-white/5 flex items-center space-x-2"
          >
            <span>Explore Smart Catalog</span>
            <Compass className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className="px-6 py-2.5 bg-muted/50 hover:bg-muted text-muted-foreground border border-border/60 hover:border-border rounded-xl font-bold text-xs tracking-wide transition flex items-center space-x-2"
          >
            <span>View Shelf Wayfinder</span>
          </button>
        </div>
      </section>

      {/* Live Branch Telemetry Bento Grid */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">Live Branch Telemetry: {branch}</h2>
          <span className="h-px flex-1 bg-muted"></span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-muted/50/30 border border-border/60 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-mono text-muted-foreground/60 uppercase">Active Readers</span>
            <span className="text-2xl font-bold text-foreground mt-1 tracking-tight">{stats.activeUsers}</span>
            <span className="text-[9px] font-mono text-secondary mt-2">● Checked in now</span>
          </div>

          <div className="bg-muted/50/30 border border-border/60 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-mono text-muted-foreground/60 uppercase">Catalog Size</span>
            <span className="text-2xl font-bold text-foreground mt-1 tracking-tight">{stats.booksCount}</span>
            <span className="text-[9px] font-mono text-muted-foreground/60 mt-2">Physical + Digital</span>
          </div>

          <div className="bg-muted/50/30 border border-border/60 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-mono text-muted-foreground/60 uppercase">Physical Borrows</span>
            <span className="text-2xl font-bold text-primary mt-1 tracking-tight">{stats.activeBorrows}</span>
            <span className="text-[9px] font-mono text-primary mt-2">NFC Wallet Managed</span>
          </div>

          <div className="bg-muted/50/30 border border-border/60 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-mono text-muted-foreground/60 uppercase">Daily Entry Rate</span>
            <span className="text-2xl font-bold text-foreground mt-1 tracking-tight">{stats.dailyVisits}</span>
            <span className="text-[9px] font-mono text-muted-foreground/60 mt-2">Avg. visits / day</span>
          </div>

          <div className="bg-muted/50/30 border border-border/60 p-4 rounded-xl flex flex-col justify-between col-span-1">
            <span className="text-[10px] font-mono text-muted-foreground/60 uppercase">Vault Humidity</span>
            <span className="text-xl font-bold text-muted-foreground mt-1">{stats.humidity}</span>
            <span className="text-[9px] font-mono text-secondary mt-2">✓ Preservation Optimal</span>
          </div>

          <div className="bg-muted/50/30 border border-border/60 p-4 rounded-xl flex flex-col justify-between col-span-1">
            <span className="text-[10px] font-mono text-muted-foreground/60 uppercase">Air Metrics</span>
            <span className="text-xs font-mono font-medium text-amber-300 mt-2 leading-none">{stats.airQuality}</span>
            <span className="text-[9px] font-mono text-muted-foreground/60 mt-2">HEPA filtrated</span>
          </div>
        </div>
      </section>

      {/* Detailed Architecture Breakdown */}
      <section className="bg-muted/50/20 border border-border/60/80 rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">The Technical Framework</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Discover how Neev binds discrete hardware components into a unified software canvas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* List of tabs on the left */}
          <div className="flex flex-col space-y-2 md:col-span-1 border-r-0 md:border-r border-border/60 md:pr-4">
            {specifications.map((spec, index) => {
              const SpecIcon = spec.icon;
              const isSelected = selectedSpec === index;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedSpec(index)}
                  className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-muted text-foreground shadow-sm border border-border/50'
                      : 'text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50/40'
                  }`}
                >
                  <SpecIcon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground/60'}`} />
                  <span>{spec.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Detail Container on the right */}
          <div className="md:col-span-3 min-h-[220px] flex flex-col justify-between">
            <div className={`p-6 rounded-2xl bg-gradient-to-br ${specifications[selectedSpec].color} border border-border/60/40 relative overflow-hidden flex flex-col justify-between h-full`}>
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] font-mono uppercase font-bold text-primary tracking-wider">
                    {specifications[selectedSpec].subtitle}
                  </span>
                  <h3 className="text-base md:text-lg font-bold text-foreground mt-1 border-b border-border/60/60 pb-2">
                    {specifications[selectedSpec].title}
                  </h3>
                </div>
                
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                  {specifications[selectedSpec].desc}
                </p>

                {/* Sub Bullet listing */}
                <ul className="space-y-2 pt-2">
                  {specifications[selectedSpec].bulletPoints.map((bp, bpIdx) => (
                    <li key={bpIdx} className="flex items-start space-x-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <span>{bp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Watermark/Shadow tag */}
              <div className="absolute right-4 bottom-4 opacity-[0.03] select-none pointer-events-none">
                <Cpu className="w-32 h-32" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spatial Workflow Flowchart */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-muted/50/10 border border-border/60 p-6 rounded-2xl space-y-2">
          <div className="w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center text-xs font-mono font-bold text-primary border border-blue-800/60">01</div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">Active Scan/Discover</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Search physical checkouts from home or inside aisles. Click "Locate on Map" to initiate wayfinding and see accurate path lines mapped directly from your standing position to the exact shelf.
          </p>
        </div>

        <div className="bg-muted/50/10 border border-border/60 p-6 rounded-2xl space-y-2">
          <div className="w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center text-xs font-mono font-bold text-primary border border-indigo-800/60">02</div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">Frictionless Grabbing</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Lift the textbook from its tray. Micro-strain weight plates detect removal, notifying the local hub. Hover a standard smartphone to pair reading logs or check matching digital editions.
          </p>
        </div>

        <div className="bg-muted/50/10 border border-border/60 p-6 rounded-2xl space-y-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-mono font-bold text-primary border border-primary/40">03</div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">Walk Out NFC Checkout</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Walk past security thresholds with books in your bag. The dual UHF active gates log physical tag matches against your smartphone’s active ticket. Borrows check out instantly!
          </p>
        </div>
      </section>

    </div>
  );
};
