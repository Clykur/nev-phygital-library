import React, { useState } from 'react';
import { ShieldAlert, Award, Calendar, BookOpen, Clock, HardDrive, ThumbsUp, Check, Key, Map, Compass, Navigation, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { apiFetch } from '../lib/api';
import { useQuery } from '@tanstack/react-query';

interface ActiveCheckout {
  id: string;
  bookId: string;
  title: string;
  author: string;
  dateBorrowed: string;
  dueDate: string;
  daysRemaining: number;
}


export const NeevMember: React.FC = () => {
  const { user, token } = useAuth();
  const xp = 1200; // Mocked for now, backend doesn't have xp natively yet
  const currentLevel = Math.floor(xp / 1000) + 1;
  const levelXpProgress = xp % 1000;

  // Geofencing Reference Protection States
  const [geofenceBreached, setGeofenceBreached] = useState(false);
  const [checkingGps, setCheckingGps] = useState(false);
  
  const levelNames = [
    "Novice Reader",
    "Aisle Voyager",
    "Lit Wrangler",
    "Curious Scholar",
    "Polymath",
    "Sovereign Sage"
  ];
  const activeLevelName = levelNames[Math.min(currentLevel - 1, levelNames.length - 1)];

  const achievements = [
    { title: "Midnight Oil", desc: "Digital checkouts or summaries reading after 11:00 PM.", xp: 150, icon: Clock, unlocked: xp > 800 },
    { title: "Archivist Ally", desc: "Physically borrowed and returned 3 separate disciplines safely.", xp: 300, icon: BookOpen, unlocked: xp > 1500 },
    { title: "Quantum Sage", desc: "Located books and completed micro-takeaways review loops.", xp: 450, icon: Award, unlocked: xp > 2500 },
    { title: "Zero Fine Protocol", desc: "Maintained a spotless return rating spanning 3 months.", xp: 600, icon: ThumbsUp, unlocked: xp > 3500 }
  ];

  // Credit value calculator of active borrowed textbooks
  const getBookCreditValue = (title: string): number => {
    const cleanTitle = title.toLowerCase();
    if (cleanTitle.includes("data-intensive") || cleanTitle.includes("algorithms") || cleanTitle.includes("deep learning")) {
      return 1500;
    }
    if (cleanTitle.includes("thermodynamics") || cleanTitle.includes("electromagnetics") || cleanTitle.includes("structural")) {
      return 1200;
    }
    if (cleanTitle.includes("operating systems") || cleanTitle.includes("cosmos")) {
      return 1000;
    }
    return 800; // Baseline standard credits e.g. Meditations, Dune
  };

  const { data: backendBooksPayload } = useQuery({
    queryKey: ['catalog', 'books'],
    queryFn: () => apiFetch<{ books: any[] }>('/api/catalog/books', { token: token || undefined })
  });

  const backendBooks = backendBooksPayload?.books || [];
  const activeCheckouts: ActiveCheckout[] = backendBooks
    .filter((b: any) => b.borrowerUserId === user?.userId && b.status === 'checked_out')
    .map((b: any) => ({
      id: b.id,
      bookId: b.id,
      title: b.title,
      author: b.author || "Peer/Hub Listing",
      dateBorrowed: b.updatedAt ? new Date(b.updatedAt).toLocaleDateString() : 'Recent',
      dueDate: b.dueAt ? new Date(b.dueAt).toLocaleDateString() : 'N/A',
      daysRemaining: b.dueAt ? Math.max(0, Math.ceil((new Date(b.dueAt).getTime() - Date.now()) / (1000 * 3600 * 24))) : 0
    }));

  const totalBorrowedValue = activeCheckouts.reduce((sum, checkout) => sum + getBookCreditValue(checkout.title), 0);
  const availableCredits = 5000 - totalBorrowedValue;

  const [prevCheckoutsCount, setPrevCheckoutsCount] = useState(activeCheckouts.length);
  const [flashCreditFull, setFlashCreditFull] = useState(false);

  React.useEffect(() => {
    if (activeCheckouts.length < prevCheckoutsCount) {
      // Book was returned! Flash the credit bar
      setFlashCreditFull(true);
      const timer = setTimeout(() => setFlashCreditFull(false), 2200);
      setPrevCheckoutsCount(activeCheckouts.length);
      return () => clearTimeout(timer);
    } else {
      setPrevCheckoutsCount(activeCheckouts.length);
    }
  }, [activeCheckouts.length, prevCheckoutsCount]);

  const handleReturnBook = async (checkoutId: string, bookId: string) => {
    try {
      await apiFetch(`/api/books/${bookId}/return`, {
        method: 'POST',
        token: token || undefined
      });
      // Will refetch via react-query cache invalidation or just depend on polling
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-[20px] duration-500">
      
      {/* Wallet glowing member card and XP progression */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Apple wallet styled NFC card */}
        <div className="relative aspect-[1.586/1] w-full rounded-2xl bg-gradient-to-tr from-primary via-indigo-900 to-slate-900 border border-indigo-400/40 p-6 shadow-2xl flex flex-col justify-between overflow-hidden group">
          
          {/* Glowing particle background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-700 pointer-events-none"></div>
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-accent/20 rounded-full blur-xl pointer-events-none"></div>

          {/* Micro structural text markings */}
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono tracking-widest text-primary/20 uppercase font-semibold">Neev Phygital System</span>
              <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">MEMBER TESSERAWALLET</h3>
            </div>
            
            {/* NFC Wireless logo drawing */}
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary/20 fill-none stroke-current" strokeWidth="2" strokeLinecap="round">
                <path d="M5 8c0-1.66 1.34-3 3-3h8c1.66 0 3 1.34 3 3v8c0 1.66-1.34 3-3 3H8c-1.66 0-3-1.34-3-3V8z" />
                <path d="M12 9v6" />
                <path d="M9 12h6" />
              </svg>
            </div>
          </div>

          <div className="space-y-1 z-10">
            <p className="text-xs font-semibold text-muted-foreground">{user?.name || "Member"}</p>
            <p className="text-[10px] font-mono text-foreground/70">CARD ID: NEEV-{user?.userId?.substring(0,8).toUpperCase() || 'NEW'}</p>
          </div>

          {/* Barcode representation */}
          <div className="flex items-end justify-between border-t border-white/10 pt-4 z-10">
            {/* Simulated bar lines */}
            <div className="h-8 w-28 flex gap-[1.5px] items-center bg-white/95 p-1 rounded-sm">
              {[2,1,3,1,2,4,1,2,3,1,2,1,4,1,3,2,1,2].map((w, idx) => (
                <div key={idx} className="h-full bg-black shrink-0" style={{ width: `${w}px` }}></div>
              ))}
            </div>

            <span className="text-[9px] font-mono text-primary/20 uppercase">Level {currentLevel} Member</span>
          </div>

        </div>

        {/* Elastic Credit Buffer Bar (Credit card style limit representation) */}
        <div className={`bg-zinc-90 w-full border rounded-2xl p-5 space-y-4 transition-all duration-500 relative overflow-hidden ${
          flashCreditFull 
            ? 'border-secondary ring-2 ring-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.2)] bg-emerald-950/10' 
            : 'border-border/60 bg-muted/50/40'
        }`}>
          {flashCreditFull && (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-secondary/90 border border-secondary/30 text-secondary text-[9px] font-bold font-mono rounded animate-pulse">
              ✔ RECONCILED OK
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground/60 uppercase font-bold block">Neev Elastic Kiosk Credit Buffer</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-mono font-extrabold text-foreground">
                ₹{availableCredits.toLocaleString()} <span className="text-xs text-muted-foreground font-sans font-normal">Available</span>
              </span>
              <span className="text-xs text-muted-foreground/60 font-mono">5,000 Total Buffer Limit</span>
            </div>
          </div>

          {/* Elastic bar - showing spent credits from left, available is remaining space */}
          <div className="w-full h-3 bg-background border border-border rounded-lg overflow-hidden flex relative">
            {/* Spent/Blocked Credits segment */}
            <div 
              className="h-full bg-muted transition-all duration-700 border-r border-border" 
              style={{ width: `${(totalBorrowedValue / 5000) * 100}%` }}
            ></div>
            {/* Active Elastic Available credit buffer segment page space */}
            <div 
              className={`h-full bg-gradient-to-r from-primary via-primary to-primary transition-all duration-700 ${
                flashCreditFull ? 'animate-pulse bg-gradient-to-r from-secondary to-secondary' : ''
              }`} 
              style={{ width: `${(availableCredits / 5000) * 100}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded bg-muted border border-border block animate-pulse"></span>
              <span className="text-muted-foreground/50 uppercase">Blocked: {totalBorrowedValue} CR</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded block ${flashCreditFull ? 'bg-secondary animate-ping' : 'bg-primary'}`}></span>
              <span className={`${flashCreditFull ? 'text-secondary font-bold' : 'text-primary'} uppercase transition-all`}>
                Elastic Buffer: {availableCredits} CR
              </span>
            </div>
          </div>

          <div className="bg-background/50 rounded-lg p-2.5 border border-border/60 text-[10px] text-muted-foreground/60 leading-relaxed font-mono">
            <span>Available = 5000 - &Sigma;(Borrowed Assets Value)</span>
          </div>
        </div>

        {/* Level Progression Progress bar */}
        <div className="bg-muted/50/40 border border-border/60 rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Rank Name: <span className="text-foreground font-bold">{activeLevelName}</span></span>
            <span className="text-muted-foreground/60 font-mono font-bold">Lvl {currentLevel}</span>
          </div>

          {/* Progress Tracker Bar */}
          <div className="w-full h-2.5 bg-background border border-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary rounded-full transition-all duration-1000"
              style={{ width: `${levelXpProgress / 10}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-sans">
            <span className="text-muted-foreground/60">Cumulative Experience: <span className="text-muted-foreground font-mono">{xp} XP</span></span>
            <span className="text-muted-foreground/60 font-mono">{levelXpProgress}/1000 XP to Level {currentLevel + 1}</span>
          </div>
        </div>

      </div>

      {/* Borrow items active panel list */}
      <div className="lg:col-span-2 space-y-6">
        
        <div className="bg-muted/50/40 border border-border/60 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-primary animate-pulse" />
              <h2 className="text-sm font-bold text-foreground tracking-tight">Active Physical Checkouts ({activeCheckouts.length})</h2>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/60 italic">Quota allowance: 3 of 5 books remaining</span>
          </div>

          <div className="space-y-3.5">
            {activeCheckouts.map((checkout) => {
              const rRatio = Math.max(0, Math.min(100, (checkout.daysRemaining / 14) * 100));
              return (
                <div 
                  key={checkout.id}
                  className="p-4 bg-background/60 border border-border rounded-xl relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-4 group transition-colors hover:bg-background"
                >
                  {/* Left core identifier card */}
                  <div className="space-y-1 tracking-tight min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-foreground uppercase truncate font-sans">{checkout.title}</h4>
                    <p className="text-[10px] text-muted-foreground/60">Author: {checkout.author} • Spine tag RFID match verified</p>
                    
                    {/* Countdown meter scale */}
                    <div className="pt-2 w-full max-w-sm space-y-1">
                      <div className="w-full h-1 bg-muted/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            checkout.daysRemaining < 3 ? 'bg-destructive' : checkout.daysRemaining < 7 ? 'bg-accent' : 'bg-secondary'
                          }`}
                          style={{ width: `${rRatio}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-muted-foreground/60">
                        <span>Borrowed: {checkout.dateBorrowed}</span>
                        <span className={checkout.daysRemaining < 3 ? 'text-destructive font-bold' : ''}>{checkout.daysRemaining} days remaining till {checkout.dueDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Return item simulator button */}
                  <button
                    onClick={() => handleReturnBook(checkout.id, checkout.bookId)}
                    className="self-end md:self-center px-4 py-2 bg-gradient-to-tr from-emerald-600/10 to-emerald-600/5 hover:from-secondary hover:to-secondary border border-emerald-800/40 hover:border-emerald-400/40 text-[10px] uppercase font-bold text-secondary hover:text-foreground rounded-xl transition shadow flex items-center space-x-1 shrink-0"
                    title="Simulate setting this book back onto our intelligent capacitive weight shelf"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Drop on Shelf (Return)</span>
                  </button>

                </div>
              );
            })}

            {activeCheckouts.length === 0 && (
              <div className="text-center p-8 bg-background/20 border border-border border-dashed rounded-xl space-y-2">
                <Clock className="w-8 h-8 text-foreground mx-auto" />
                <h4 className="text-xs font-bold text-muted-foreground uppercase">No Active Holdings</h4>
                <p className="text-[10px] text-muted-foreground/60">Go to our search catalog to place books on check-out hold.</p>
              </div>
            )}
          </div>
        </div>

        {/* Geo-fence monitor safeguard card */}
        <div className={`border rounded-2xl p-6 space-y-4 transition-all duration-500 relative overflow-hidden ${
          geofenceBreached 
            ? 'bg-red-950/15 border-destructive ring-2 ring-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]' 
            : 'bg-muted/50/40 border-border/60 bg-muted/50/40'
        }`}>
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border pb-3">
            <div className="flex items-center space-x-2">
              <Map className={`w-4 h-4 ${geofenceBreached ? 'text-destructive animate-pulse' : 'text-primary'}`} />
              <div>
                <span className="text-[10px] font-mono hover:text-foreground text-muted-foreground/60 uppercase font-bold tracking-widest block leading-3">Neev Security Layer</span>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-tight">Kiosk Inventory Geo-fence Protection</h3>
              </div>
            </div>

            {/* GPS Signal bar */}
            <div className="flex items-center space-x-2 text-[10px] font-mono">
              <span className="text-muted-foreground/60 uppercase">GPS Node:</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                geofenceBreached 
                  ? 'bg-red-950 text-destructive border border-red-900' 
                  : 'bg-primary/90 text-primary border border-primary/80'
              }`}>
                {geofenceBreached ? 'OUT_OF_BOUNDS_WARN' : 'IN_LIBRARY_GRID'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            
            {/* Visual radar grid circle */}
            <div className="md:col-span-2 flex justify-center">
              <div className="relative w-28 h-28 rounded-full border border-border flex items-center justify-center bg-black/40 overflow-hidden shrink-0">
                
                {/* Radar sweeping green circle */}
                <div className={`absolute inset-2 rounded-full border border-dashed transition-colors duration-500 ${
                  geofenceBreached ? 'border-red-500/25 bg-red-500/5' : 'border-secondary/20 bg-secondary/5'
                }`}></div>
                
                <div className="absolute inset-8 rounded-full border border-border/40"></div>
                
                {/* Crosshairs */}
                <div className="absolute w-full h-[0.5px] bg-muted/50"></div>
                <div className="absolute h-full w-[0.5px] bg-muted/50"></div>

                {/* Library boundary indicator */}
                <div className={`absolute select-none font-mono text-[7px] font-bold tracking-widest bottom-2 text-center w-full transition ${
                  geofenceBreached ? 'text-destructive animate-pulse' : 'text-secondary opacity-60'
                }`}>
                  {geofenceBreached ? 'LIMIT BREACHED' : 'LIBRARY BOUNDARY'}
                </div>

                {/* Animated student GPS dot */}
                <div 
                  className={`absolute w-3 h-3 rounded-full border border-white transition-all duration-700 ${
                    geofenceBreached 
                      ? 'left-[82%] top-[15%] bg-destructive shadow-[0_0_8px_#ef4444]' 
                      : 'left-[46%] top-[46%] bg-primary shadow-[0_0_8px_#3b82f6]'
                  }`}
                >
                  <span className={`absolute inset-0 rounded-full animate-ping opacity-75 ${geofenceBreached ? 'bg-red-450' : 'bg-blue-450'}`}></span>
                </div>
              </div>
            </div>

            {/* Guard stats/details description */}
            <div className="md:col-span-3 space-y-3.5 text-left text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground/60 font-mono font-bold leading-none block">STATION BOUNDS:</span>
                <p className="text-muted-foreground font-mono text-[10.5px] font-light leading-snug">
                  12.9348° N &bull; 77.5342° E <br />
                  <span className="text-zinc-505 font-sans text-[10px]">&bull; RVCE Central Library Gate Geo-Compound</span>
                </p>
              </div>

              <p className="text-muted-foreground text-[11px] leading-relaxed font-light">
                {geofenceBreached 
                  ? "Loophole mitigation protocol active. A reference textbook checked out for in-library use has broken the gate perimeter. Local Ambassador's counter dashboard has been alerted for recovery tracking."
                  : "Reference materials are protected via local geofence workers. Enjoy infinite books anywhere in our college library with seamless digital condition integration."
                }
              </p>

              <div className="flex items-center space-x-2 pt-1">
                {geofenceBreached ? (
                  <button
                    type="button"
                    onClick={() => { setGeofenceBreached(false); }}
                    className="px-3 py-1.5 bg-background border border-border/60 hover:border-border text-muted-foreground font-bold font-mono text-[10px] uppercase rounded-lg transition"
                  >
                    🚶 Step back inside gates
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setGeofenceBreached(true)}
                    className="px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-destructive font-bold font-mono text-[10px] uppercase rounded-lg transition flex items-center space-x-1"
                  >
                    <Navigation className="w-3 h-3 text-destructive shrink-0" />
                    <span>Simulate Gate Bypass</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Alarm warning banner overlay */}
          {geofenceBreached && (
            <div className="p-3 bg-red-950/20 border border-red-900/60 rounded-xl flex items-start space-x-2 text-xs text-destructive font-light leading-relaxed animate-bounce">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1 text-left">
                <span className="font-bold text-red-300 uppercase block font-mono text-[9px] tracking-wider">⚠️ GEOFENCE LOOP MITIGATION ALERT:</span>
                <p className="text-[10.5px] leading-snug">You have left the physical building polygon boundary with an active reference asset. Restocking sensors registers exit. Please restore placement immediately to avoid safety fine.</p>
              </div>
            </div>
          )}

        </div>

        {/* Academic badges grid accomplishments */}
        <div className="bg-muted/50/40 border border-border/60 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold text-foreground tracking-tight">Personal Badges Shelf</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {achievements.map((ach, aIdx) => {
              const AchIcon = ach.icon;
              return (
                <div 
                  key={aIdx}
                  className={`p-3.5 rounded-xl border flex items-start space-x-3 transition-all ${
                    ach.unlocked 
                      ? 'bg-background/80 border-border/60 hover:border-border shadow-sm shadow-amber-500/2' 
                      : 'bg-muted/50/10 border-border/40 opacity-40'
                  }`}
                >
                  <div className={`p-2 rounded-lg border flex-shrink-0 ${
                    ach.unlocked ? 'bg-amber-950/40 border-amber-800/60 text-accent animate-[bounce_3s_ease_infinite]' : 'bg-muted/50 border-border/60 text-zinc-650'
                  }`}>
                    <AchIcon className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 min-w-0 text-left">
                    <h4 className={`text-xs font-bold truncate leading-none ${ach.unlocked ? 'text-foreground/90' : 'text-muted-foreground/60 font-normal'}`}>{ach.title}</h4>
                    <p className="text-[10px] text-muted-foreground/60 leading-snug line-clamp-2">{ach.desc}</p>
                    {ach.unlocked && (
                      <span className="text-[9px] font-mono text-secondary font-bold">&#10004; Reward claimed: {ach.xp} XP</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
