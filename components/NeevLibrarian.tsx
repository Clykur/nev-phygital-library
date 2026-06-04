import React, { useState, useEffect } from 'react';
import { LiveRFIDEvent, PhygitalBook } from '../services/neevData';
import { Sliders, RefreshCw, Layers, PlusCircle, Check, BookOpen, Clock, Activity, HardDrive, ShieldCheck, Camera, QrCode, UserCheck, AlertTriangle } from 'lucide-react';
import { useHubQueue, useCatalogBooks, useActivityTimeline } from '../lib/hooks';

export const NeevLibrarian: React.FC = () => {
  // Add new book form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState<'Technology' | 'Fiction' | 'Philosophy' | 'Science' | 'Biography'>('Technology');
  const [isbn, setIsbn] = useState('');
  const [pages, setPages] = useState(350);
  const [year, setYear] = useState(2026);
  const [summary, setSummary] = useState('');
  const [aisle, setAisle] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('B');
  const [shelfId, setShelfId] = useState('B3');
  const [row, setRow] = useState(1);
  const [copies, setCopies] = useState(3);

  const [formSubmitted, setFormSubmitted] = useState(false);

  // Ambassador Desk / Digital Condition Stamp States
  const [handoffStep, setHandoffStep] = useState<'idle' | 'scanned_qr' | 'capturing_spine' | 'ready_to_transfer' | 'transferred'>('idle');
  const [stampUrl, setStampUrl] = useState<string>('');
  const [deskXpEarned, setDeskXpEarned] = useState(false);

  const { data: queueData } = useHubQueue();
  const queueItem = queueData?.queue?.[0]; // Assuming array of items

  const { data: catalogData } = useCatalogBooks();
  const books = catalogData?.books || catalogData || [];

  const { data: activityData } = useActivityTimeline();
  const activityTimeline = (activityData as any)?.events || (activityData as any)?.timeline || [];

  const rfidEvents = (activityTimeline as any[]).slice(-10).map((act: any) => ({
    id: act.id,
    timestamp: new Date(act.createdAt || act.timestamp || Date.now()).toLocaleTimeString(),
    type: 'shelf_lift',
    bookTitle: act.metadata?.title || act.title || "Syllabus Textbook",
    userMeta: act.userId || act.user || "Unknown",
    details: act.eventType || act.action || "Scanned"
  }));

  // If no queue item is present, we handle the empty state.
  const activeStudent = queueItem?.studentName || "No pending students";
  const activeBook = queueItem?.bookTitle || "No pending assets";
  const activeIsbn = queueItem?.isbn || "N/A";
  const activePrice = queueItem?.retailPrice || "N/A";

  const handleStartAmbassadorHandoff = () => {
    setHandoffStep('scanned_qr');
    // addXp(20);
  };

  const handleCaptureSpineStamp = () => {
    // Generate a beautiful canvas base64 or custom SVG representation
    setHandoffStep('capturing_spine');
  };

  const handleSimulateCaptureFinished = () => {
    setStampUrl("https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200");
    setHandoffStep('ready_to_transfer');
    // addXp(50);
  };

  const handleApproveHandoffTransfer = () => {
    setHandoffStep('transferred');
    // addXp(120);
    // Push a new live event to the parent logs
    setDeskXpEarned(true);
    setTimeout(() => {
      setHandoffStep('idle');
      setStampUrl('');
      setDeskXpEarned(false);
    }, 4000);
  };

  // Computes shelf loadings based on active catalog
  const computeShelfWeightLoad = (aisleLetter: 'A' | 'B' | 'C' | 'D' | 'E') => {
    const aisleBooks = (books as any[]).filter((b) => b.shelfLocation?.aisle === aisleLetter);
    const sumCopies = aisleBooks.reduce((acc, curr) => acc + curr.physicalCopiesAvailable, 0);
    // Let's assume maximum capacity of an aisle shelf row-deck is 12 units
    const maxCapacity = 12;
    const loadPercent = Math.min(100, Math.floor((sumCopies / maxCapacity) * 100));
    return { count: sumCopies, percentage: loadPercent };
  };

  const handlesFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !isbn.trim()) return;

    const newBook: PhygitalBook = {
      id: `neev-book-${Date.now()}`,
      title,
      author,
      year: Number(year),
      genre,
      isbn,
      rating: 5.0, // Brand new custom books start spotless!
      pages: Number(pages),
      physicalCopiesTotal: Number(copies),
      physicalCopiesAvailable: Number(copies),
      digitalAvailable: true,
      shelfLocation: {
        aisle,
        shelfId,
        row: Number(row),
      },
      summary: summary || "Staff manually logged and RFID tag validated shelf holdings summary meta.",
      keyTakeaways: [
        "Dynamic micro-sensor and spine tag check completed successfully.",
        "Calibrated with local pressure arrays on active deck weight cells."
      ],
    };

    // onAddBook(newBook); // Replaced with actual API logic if needed
    setFormSubmitted(true);
    // addXp(150); // Direct curation task rewards heavy XP

    // Resetting states
    setTimeout(() => {
      setTitle('');
      setAuthor('');
      setIsbn('');
      setSummary('');
      setFormSubmitted(false);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-[20px] duration-500">
      
      {/* Live RFID feeds event stream ticker on left */}
      <div className="lg:col-span-2 space-y-6">

        {/* Campus Ambassador Desk & Condition Block Protocol */}
        <div className="bg-muted/50/40 border border-border/60 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-sm font-bold text-foreground tracking-tight">Kiosk Ambassador Hand-off Desk</h2>
                <p className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Enforced digital condition checklist protocol</p>
              </div>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 bg-indigo-950 text-primary rounded-md border border-indigo-900/40 font-bold">STAFFED COUNTER</span>
          </div>

          {/* Idle state */}
          {handoffStep === 'idle' && (
            <div className="p-4 bg-background/40 border border-border/60 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in duration-300">
              <div className="space-y-1">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h4 className="text-xs font-bold text-foreground/90 uppercase font-mono">1 Student Reservation Hold Pending at Counter</h4>
                </div>
                <p className="text-[11px] text-muted-foreground font-sans">Student: <span className="text-foreground/90 font-semibold">{activeStudent}</span> &bull; Asset: <span className="text-foreground/90 italic">{activeBook}</span></p>
              </div>
              <button
                type="button"
                onClick={handleStartAmbassadorHandoff}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-foreground rounded-xl transition shadow shadow-indigo-600/10 flex items-center space-x-1.5 shrink-0 self-end sm:self-center"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Initialize Desk Scan</span>
              </button>
            </div>
          )}

          {/* QR Scanned State */}
          {handoffStep === 'scanned_qr' && (
            <div className="p-5 bg-background/40 border border-border rounded-xl space-y-4 animate-in fade-in duration-300">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono bg-indigo-950 text-primary border border-indigo-900 px-1.5 py-0.5 rounded uppercase font-bold">QR Barcode Verified ✓</span>
                  <h4 className="text-xs font-semibold text-foreground/90 mt-1">Book: <span className="text-foreground font-bold">{activeBook}</span></h4>
                  <p className="text-[10px] text-muted-foreground/60 font-mono">ISBN: {activeIsbn} &bull; Retail Value: {activePrice}</p>
                </div>
                <div className="p-2 bg-indigo-950/30 rounded-lg border border-indigo-900/50">
                  <QrCode className="w-5 h-5 text-primary" />
                </div>
              </div>

              {/* Warnings and blocking protocol */}
              <div className="p-3 bg-amber-950/10 border border-amber-900/40 rounded-xl flex items-start space-x-2.5 text-[11px] text-amber-500/95 leading-relaxed font-sans font-normal">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <p>
                  <strong className="text-amber-450 font-bold">MANDATORY CAMERA INTERACTION DECK BLOCK:</strong> To protect cash flow and prevent student disputes during eventual deposit returns, you must capture one clear visual stamp of the physical spine and front layout before checking out the textbook to {activeStudent}.
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleCaptureSpineStamp}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-505 font-bold text-xs text-foreground rounded-xl shadow-lg transition flex items-center space-x-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Launch Condition Camera Overlay</span>
                </button>
              </div>
            </div>
          )}

          {/* Fullscreen Camera Overlay simulator state */}
          {handoffStep === 'capturing_spine' && (
            <div className="p-4 bg-[#0a0a0c] border border-zinc-805 rounded-xl space-y-4 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between bg-background border border-border rounded-lg px-3 py-1.5 font-mono text-[9px] text-muted-foreground/60">
                <div className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                  <span className="text-muted-foreground font-bold uppercase">LIVE KIOSK DESK SENSOR CAM FEED</span>
                </div>
                <span>FPS: 30 / RESOLUTION: 1080P CALIBRATED</span>
              </div>

              {/* Simulated camera capture viewfinder */}
              <div className="relative aspect-[16/9] w-full bg-muted/50/85 border border-border/60 rounded-xl overflow-hidden flex items-center justify-center">
                {/* Center alignment guides */}
                <div className="absolute inset-8 border border-dashed border-emerald-500/40 rounded flex items-center justify-center">
                  <div className="absolute w-6 h-6 border-t-2 border-l-2 border-emerald-400 top-0 left-0"></div>
                  <div className="absolute w-6 h-6 border-t-2 border-r-2 border-emerald-400 top-0 right-0"></div>
                  <div className="absolute w-6 h-6 border-b-2 border-l-2 border-emerald-400 bottom-0 left-0"></div>
                  <div className="absolute w-6 h-6 border-b-2 border-r-2 border-emerald-400 bottom-0 right-0"></div>
                </div>

                {/* Simulated physical textbook sitting on workbench desk */}
                <div className="z-10 text-center space-y-2">
                  <div className="mx-auto w-36 h-16 bg-zinc-850/95 border border-border shadow-xl rounded flex flex-col justify-between p-2">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter text-center">Spine Cover Grid</span>
                    <span className="text-[7px] font-mono text-muted-foreground/60 font-bold">ISBN-9781617294433</span>
                  </div>
                  <p className="text-[8px] font-mono text-emerald-400 font-bold tracking-widest uppercase animate-pulse">Target aligned inside sensor matrix</p>
                </div>

                {/* Telemetry labels */}
                <div className="absolute bottom-2 left-2 text-[8px] font-mono text-muted-foreground/50">
                  AUTO_FOCUS: LOCKED &bull; RETINA_STAMP_CALIBRATION_READY
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={() => setHandoffStep('scanned_qr')}
                  className="px-3 py-1.5 bg-muted/50 hover:bg-zinc-850 text-muted-foreground text-xs font-bold rounded-lg transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSimulateCaptureFinished}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-555 text-xs font-bold text-foreground rounded-xl shadow-md transition flex items-center space-x-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture & Sync Spine Visual (+50 XP)</span>
                </button>
              </div>
            </div>
          )}

          {/* Ready to transfer ownership stamp locked */}
          {handoffStep === 'ready_to_transfer' && (
            <div className="p-4 bg-background/40 border border-border rounded-xl space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-500/25 text-emerald-400 font-mono text-[9px] font-bold rounded">
                      DIGITAL STAMP SECURED
                    </span>
                    <span className="text-muted-foreground/60 font-mono text-[9px]">VISUAL_MD5: md5_7a2f_9b4e_2026</span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground font-mono">Spine condition report optimized and locked to database transaction!</h4>
                  <p className="text-[10.5px] text-muted-foreground font-sans leading-normal">
                    Condition verified as <span className="text-emerald-400 font-bold font-semibold">Grade A+ (Spotless Cover & Flawless Pages)</span>. Confirmation button unlocked for immediate physical handoff.
                  </p>
                </div>

                {/* Thumb stamp visual */}
                <div className="w-20 h-14 bg-muted/50 border border-border/60 rounded-lg overflow-hidden flex-shrink-0 relative shadow-inner">
                  <div className="absolute inset-0 bg-emerald-950/30 z-10 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-400 animate-pulse font-bold" />
                  </div>
                  <img src={stampUrl} alt="Spine book condition visual" referrerPolicy="no-referrer" className="w-full h-full object-cover blur-[0.2px]" />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border/40 w-full pt-3">
                <button
                  type="button"
                  onClick={() => setHandoffStep('scanned_qr')}
                  className="px-3 py-1.5 bg-muted/50 hover:bg-zinc-850 text-muted-foreground text-xs font-bold rounded-lg transition"
                >
                  Retake Photo
                </button>
                <button
                  type="button"
                  onClick={handleApproveHandoffTransfer}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-505 font-bold text-xs text-foreground rounded-xl shadow-lg transition flex items-center space-x-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Confirm Checkout Handoff (+120 XP)</span>
                </button>
              </div>
            </div>
          )}

          {/* Transferred owns state */}
          {handoffStep === 'transferred' && (
            <div className="p-5 bg-emerald-950/10 border border-emerald-800/40 rounded-xl space-y-3 text-center animate-in zoom-in-95 duration-300">
              <div className="w-9 h-9 rounded-full bg-emerald-950 border border-emerald-800/55 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                <Check className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">Book Ownership Transferred Successfully</h4>
                <p className="text-[11px] text-muted-foreground leading-normal max-w-sm mx-auto font-sans">
                  Asset <span className="text-emerald-300 italic font-medium font-semibold">{activeBook}</span> was legally checked out and assigned to student <span className="text-foreground/90 font-bold">{activeStudent}</span>'s active holdings ledger.
                </p>
                <p className="text-[9px] text-emerald-450 font-mono mt-3 animate-pulse">🔒 SPINE PASSIVE TAG VERIFIED • KIOSK HAND-OFF PROTOCOL SAVED</p>
              </div>
            </div>
          )}

        </div>

        {/* Real-time active sensors log list */}
        <div className="bg-muted/50/40 border border-border/60 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h2 className="text-sm font-bold text-foreground tracking-tight">Active RFID Corridor & Shelf Sensor Logs</h2>
            </div>
            <span className="text-[9px] font-mono bg-emerald-950/20 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded-full">RECEIVING LIVE FEED</span>
          </div>

          {/* Scrolling ticker stack */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {rfidEvents.map((evt) => (
              <div 
                key={evt.id} 
                className="p-3 bg-background/40 border border-border hover:border-border/60 rounded-xl space-y-1.5 font-mono text-xs transition duration-150"
              >
                <div className="flex justify-between items-center text-[10px]">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                    evt.type === 'gate_pass' 
                      ? 'bg-blue-950 text-blue-400 border border-blue-900' 
                      : evt.type === 'shelf_lift'
                      ? 'bg-amber-950 text-amber-400 border border-amber-900'
                      : evt.type === 'shelf_return'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                      : 'bg-indigo-950 text-primary border border-indigo-905'
                  }`}>
                    {evt.type.replace('_', ' ')}
                  </span>
                  <span className="text-muted-foreground/50 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-zinc-650" />
                    <span>{evt.timestamp}</span>
                  </span>
                </div>

                <div className="text-[11px] leading-relaxed">
                  <span className="text-muted-foreground/60">Target Resource:</span> <span className="text-foreground/90 font-bold">{evt.bookTitle}</span>
                </div>

                <div className="text-[10px] text-muted-foreground leading-normal flex items-start gap-1">
                  <span className="text-zinc-650 shrink-0">Details:</span>
                  <span>{evt.details} <span className="text-zinc-600 font-light">• Trace: {evt.userMeta}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shelf Capacity Analytics load-bar widgets */}
        <div className="bg-muted/50/40 border border-border/60 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-foreground tracking-tight">Capacitive Shelves Weight Load Ratios</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(['A', 'B', 'C', 'D', 'E'] as const).map((aisleLet) => {
              const metrics = computeShelfWeightLoad(aisleLet);
              return (
                <div key={aisleLet} className="p-3 bg-background/40 border border-border rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className="text-muted-foreground">Aisle {aisleLet}</span>
                    <span className="text-muted-foreground/60">{metrics.count}u</span>
                  </div>

                  {/* Meter circle representation or bar */}
                  <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        metrics.percentage > 75 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${metrics.percentage}%` }}
                    ></div>
                  </div>

                  <p className="text-[9px] text-zinc-600 font-mono text-center tracking-tight uppercase">Ratio: {metrics.percentage}% loaded</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Add New book form selector panel on right */}
      <div className="lg:col-span-1">
        <form onSubmit={handlesFormSubmit} className="bg-muted/50/30 border border-border/60 rounded-2xl p-6 space-y-4">
          
          <div className="flex items-center space-x-2 border-b border-border pb-3">
            <PlusCircle className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="text-sm font-bold text-foreground">Curation RFID Registry</h3>
              <p className="text-[9px] font-mono text-muted-foreground/60 uppercase">Insert physical inventory</p>
            </div>
          </div>

          {/* Book core attributes */}
          <div className="space-y-3.5 text-xs">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Book Title:</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Excribe full volume title..."
                className="w-full bg-background border border-border rounded-lg p-2 text-foreground/90 outline-none focus:border-border font-light"
              />
            </div>

            {/* Author */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Author Name:</label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Full author name..."
                className="w-full bg-background border border-border rounded-lg p-2 text-foreground/90 outline-none focus:border-border font-light"
              />
            </div>

            {/* ISBN and Pages */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">ISBN-13 Bar:</label>
                <input
                  type="text"
                  required
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="978-..."
                  className="w-full bg-background border border-border rounded-lg p-2 text-zinc-350 font-mono outline-none focus:border-border text-center"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Aisle Shelf ID:</label>
                <input
                  type="text"
                  required
                  value={shelfId}
                  onChange={(e) => setShelfId(e.target.value)}
                  placeholder="e.g. B2, D1"
                  className="w-full bg-background border border-border rounded-lg p-2 text-zinc-350 font-mono outline-none focus:border-border text-center uppercase"
                />
              </div>
            </div>

            {/* Genre and Year */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Genre Class:</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value as any)}
                  className="w-full bg-background border border-border rounded-lg p-2 text-muted-foreground outline-none focus:border-border cursor-pointer"
                >
                  <option value="Technology">Technology</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Philosophy">Philosophy</option>
                  <option value="Science">Science</option>
                  <option value="Biography">Biography</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Row Level (1-4):</label>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={row}
                  onChange={(e) => setRow(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg p-2 text-muted-foreground outline-none focus:border-border text-center font-mono"
                />
              </div>
            </div>

            {/* Summary synopsis description */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Summary Details:</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                placeholder="Give a brief synopsis of the book contents..."
                className="w-full bg-background border border-border rounded-lg p-2 text-foreground/90 outline-none focus:border-border font-light resize-none text-xs leading-relaxed"
              />
            </div>

            {/* Submit book indexer */}
            <button
              type="submit"
              disabled={formSubmitted}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-505 disabled:from-zinc-800 disabled:text-muted-foreground/50 border border-blue-500/10 rounded-xl font-bold text-xs text-foreground tracking-wider flex items-center justify-center space-x-2 transition"
            >
              {formSubmitted ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Book Tag Calibrated! (+150 XP)</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Calibrate UHF Spine Tag</span>
                </>
              )}
            </button>

          </div>

        </form>
      </div>

    </div>
  );
};
