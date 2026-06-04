import React, { useState } from 'react';
import { School, Plus, MapPin, ClipboardList, Check, Layers, Sparkles, BookOpen, UserCheck, RefreshCw, Send, Trash2 } from 'lucide-react';

interface CollegeConfig {
  id: string;
  name: string;
  code: string;
  location: string;
  departments: string[];
  layoutType: string;
  librarianName: string;
}


export const NeevCollege: React.FC<any> = ({
  branch,
  setBranch,
  books,
  onAddBook,
  zones,
  onAddZone,
  onDeleteZone,
  addXp,
}) => {
  // Built-in onboarded Indian Colleges database
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [colleges, setColleges] = useState<CollegeConfig[]>([
    {
      id: "RVCE-BLR",
      name: "RV College of Engineering, Bengaluru",
      code: "RVCE-IN-BLR",
      location: "Mysore Road, Bengaluru, Karnataka",
      departments: ["Computer Science CSE", "Electronics ECE", "Mechanical Engineering", "Biotechnology"],
      layoutType: "Double-Decker Central Hall Racks",
      librarianName: "Dr. Srinivas Prasad"
    },
    {
      id: "IIT-Hauzkhas",
      name: "Indian Institute of Technology, Delhi",
      code: "IITD-IN-DLH",
      location: "Hauz Khas, New Delhi",
      departments: ["Computer Science", "Physics & Astro-Science", "Electrical Engineering", "Humanities"],
      layoutType: "Multi-Floor Departmental Wings",
      librarianName: "Prof. Rita Banerjee"
    },
    {
      id: "BITS-Pilani",
      name: "BITS Pilani Library Hub",
      code: "BITS-PIL-RAJ",
      location: "Pilani, Rajasthan",
      departments: ["Chemical Engineering", "Computer Science CIS", "Pharmacy", "Mechanical"],
      layoutType: "Circular Vault Architecture",
      librarianName: "Shri R. K. Mittal"
    }
  ]);

  // Form states for onboarding a new college
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeCode, setNewCollegeCode] = useState('');
  const [newCollegeLocation, setNewCollegeLocation] = useState('');
  const [newCollegeLibrarian, setNewCollegeLibrarian] = useState('');
  const [selectedLayoutType, setSelectedLayoutType] = useState('Central Academic Racks Grid');
  const [onboardSuccess, setOnboardSuccess] = useState(false);

  // Form states for adding custom college syllabus books
  const [syllabusTitle, setSyllabusTitle] = useState('');
  const [syllabusAuthor, setSyllabusAuthor] = useState('');
  const [syllabusDept, setSyllabusDept] = useState('Computer Science CSE');
  const [syllabusSem, setSyllabusSem] = useState('Semester 4');
  const [syllabusIsbn, setSyllabusIsbn] = useState('');
  const [isbnMatched, setIsbnMatched] = useState(false);
  const [targetShelf, setTargetShelf] = useState('B1');
  const [syllabusSummary, setSyllabusSummary] = useState('');
  const [bookRegistered, setBookRegistered] = useState(false);

  // Form states for floor layout custom shelf editor
  const [customShelfName, setCustomShelfName] = useState('');
  const [customShelfAisle, setCustomShelfAisle] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('B');
  const [customShelfX, setCustomShelfX] = useState(30);
  const [customShelfY, setCustomShelfY] = useState(40);
  const [customShelfDetails, setCustomShelfDetails] = useState('');
  const [shelfConfigSuccess, setShelfConfigSuccess] = useState(false);

  // Auto-generate ISBN based on typed inputs for Indian colleges
  const handleAutoIsbn = () => {
    const randomIsbn = `978-IN-${Math.floor(100000 + Math.random() * 900000)}-${Math.floor(10 + Math.random() * 90)}`;
    setSyllabusIsbn(randomIsbn);
    addXp(10);
  };

  // Submit college registration
  const handleCollegeOnboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeName.trim() || !newCollegeCode.trim()) return;

    const formattedId = newCollegeCode.trim().substring(0, 10).toUpperCase();
    const isExist = colleges.some(c => c.id === formattedId);

    if (isExist) {
      alert("This Campus Code is already registered on Neev!");
      return;
    }

    const added: CollegeConfig = {
      id: formattedId,
      name: newCollegeName,
      code: newCollegeCode.trim().toUpperCase(),
      location: newCollegeLocation || "All India Campus",
      departments: ["CSE Core", "ECE Core", "First Year Semester Labs", "Reference archives"],
      layoutType: selectedLayoutType,
      librarianName: newCollegeLibrarian || "Academic Registrar Node"
    };

    setColleges(prev => [...prev, added]);
    setOnboardSuccess(true);
    addXp(350); // Massive XP for university onboarding

    // Automatically set the newly registered college as the active branch!
    setTimeout(() => {
      setBranch(formattedId);
      setNewCollegeName('');
      setNewCollegeCode('');
      setNewCollegeLocation('');
      setNewCollegeLibrarian('');
      setOnboardSuccess(false);
    }, 1800);
  };

  // Switch Active Library Branch
  const handleSwitchBranch = (collegeId: string) => {
    setBranch(collegeId);
    addXp(40);
  };

  // Register dynamic college book or solved papers
  const handleAddSyllabusBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!syllabusTitle.trim() || !syllabusAuthor.trim()) return;

    const actualIsbn = syllabusIsbn || `978-IN-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const matchedGenre = syllabusDept.includes("CSE") || syllabusDept.includes("Computer") ? "Technology" : "Science";

    const campusBook: any = {
      id: `college-book-${Date.now()}`,
      title: `${syllabusTitle} [${syllabusSem} - ${syllabusDept}]`,
      author: syllabusAuthor,
      year: 2026,
      genre: matchedGenre,
      isbn: actualIsbn,
      rating: 4.9,
      pages: 420,
      physicalCopiesTotal: 5,
      physicalCopiesAvailable: 5,
      digitalAvailable: true,
      shelfLocation: {
        aisle: targetShelf.charAt(0).toUpperCase() || 'B',
        shelfId: targetShelf.toUpperCase(),
        row: Math.floor(1 + Math.random() * 3)
      },
      summary: syllabusSummary || `Official prescribed textbook and lecture guide for ${syllabusDept} branch. Comprises previous year solved questions, dynamic university papers, and curriculum guides.`,
      keyTakeaways: [
        `Prescribed in India University curriculum notes under AICTE standards.`,
        "Equipped with active UHF RFID tag for automated issue/return counters validation."
      ],
    };

    onAddBook(campusBook);
    setBookRegistered(true);
    addXp(150); // Dynamic book curriculum cataloging grants XP

    setTimeout(() => {
      setSyllabusTitle('');
      setSyllabusAuthor('');
      setSyllabusIsbn('');
      setSyllabusSummary('');
      setBookRegistered(false);
    }, 1800);
  };

  // Submit dynamic layout configuration (add custom shelf)
  const handleAddCustomShelf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customShelfName.trim()) return;

    const formattedId = `shelf-${customShelfName.replace(/\s+/g, '-').substring(0, 10).toUpperCase()}`;

    const newZone: any = {
      id: formattedId,
      name: `${customShelfName} (Aisle ${customShelfAisle})`,
      type: 'shelf',
      aisle: customShelfAisle,
      x: Number(customShelfX),
      y: Number(customShelfY),
      width: 25,
      height: 8,
      status: 'idle',
      details: customShelfDetails || `Custom digital-twin shelf configured for department labs. Fitted with calibrated dynamic load weight sensors.`
    };

    onAddZone(newZone);
    setShelfConfigSuccess(true);
    addXp(200); // Floor engineering rewards active academic XP

    setTimeout(() => {
      setCustomShelfName('');
      setCustomShelfDetails('');
      setShelfConfigSuccess(false);
    }, 1800);
  };

  const activeCollegeInfo = colleges.find(c => c.id === branch) || colleges[0];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-[20px] duration-500">
      
      {/* Intro Banner */}
      <section className="bg-muted/50/40 border border-zinc-805/80 rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-[5%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-primary/10 border border-blue-900/60 rounded-full text-[10px] font-mono font-medium text-primary uppercase tracking-widest">
              <School className="w-3.5 h-3.5 text-primary" />
              <span>University Onboarding & Hub</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Indian Colleges Library Platform</h1>
            <p className="text-xs text-muted-foreground leading-relaxed font-light">
              Welcome to Neev College Integration Module! Unlike student-only libraries, Indian universities can register their local campus, configure their physical floor grid (racks & aisles) directly, catalog their internal semesters/syllabus textbooks, and issue dynamic Smart Cards to students.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <span className="text-[11px] font-mono px-3 py-1 bg-zinc-90d border border-border/60 rounded-lg text-muted-foreground">
              Active Campus Code: <span className="text-foreground font-bold">{activeCollegeInfo?.code || "DEFAULT_IN"}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Dynamic Escrow Balance Isolation (Ledger Lock telemetry) */}
      <section className="bg-muted/50/10 border border-zinc-805/80 rounded-2xl p-6 space-y-4 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-primary animate-pulse" />
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">Gateway Escrow Balance Isolation Protocol</h3>
              <p className="text-[10px] font-mono text-muted-foreground/50 uppercase font-semibold">Programmatic ledger segregation policy</p>
            </div>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 bg-secondary/90 text-secondary rounded border border-emerald-900/40 font-bold uppercase tracking-wider">
            SHIELD STATUS: COLLATERAL LOCKED ✓
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Ledger A */}
          <div className="p-4 bg-background/40 border border-border rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono bg-primary/90 text-primary px-2 py-0.5 rounded border border-blue-900/40 font-bold">LEDGER A</span>
              <span className="text-[9px] text-secondary font-mono font-bold uppercase tracking-widest animate-pulse">● Operating proceed active</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground/90">Operating Cash Balance (<span className="text-foreground">Annual Membership flat ₹999 fees</span>)</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-sans font-light mt-1">
                Proceeds generated from students annual subscription memberships. Safe for general operational burn including campus kiosk hardware deployment, high-density RFID passive scanner tags, and decentralized Campus Ambassador honorariums.
              </p>
            </div>
            <div className="pt-2 border-t border-border flex justify-between font-mono text-[9px]">
              <span className="text-muted-foreground/50">Reinvestment Limit:</span>
              <span className="text-primary font-bold uppercase">100% Capitalized Spend</span>
            </div>
          </div>

          {/* Ledger B */}
          <div className="p-4 bg-background/40 border border-border rounded-xl space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono bg-accent/90 text-accent px-2 py-0.5 rounded border border-amber-900/40 font-bold">LEDGER B</span>
              <span className="text-[9px] text-amber-405 font-mono font-bold border border-amber-900/40 px-1.5 py-0.5 rounded uppercase">🔒 FROZEN SECURED COLLATERAL</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground/90">Secured Escrow Liability Pool (<span className="text-foreground">UPFRONT BOOK DEPOSITS</span>)</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-sans font-light mt-1">
                Holds 100% refund value of textbook deposits. Programmatically isolated and strictly protected from general operating expenses. This serves as a fully liquid collateral layer against physical books in circulation, honoring refunds instant-trigger upon return.
              </p>
            </div>
            <div className="pt-2 border-t border-border flex justify-between font-mono text-[9px]">
              <span className="text-muted-foreground/50">Collateral compliance:</span>
              <span className="text-accent font-bold uppercase tracking-wider">ZERO EXPLOIT BURN ALLOWED</span>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Campus Selector and Status Info */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Registered campuses with quick switch */}
        <div className="lg:col-span-1 bg-muted/50/30 border border-border/60 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">Switch University Library</h3>
            <span className="text-[10px] font-mono text-zinc-650 font-bold uppercase">Total Kiosk Hand-offs</span>
          </div>

          <div className="space-y-3">
            {colleges.map((c) => {
              const isActive = branch === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSwitchBranch(c.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-950/20 border-primary/80 shadow-md shadow-blue-900/5'
                      : 'bg-background/40 border-border hover:bg-muted/50 hover:border-border/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`text-xs font-bold tracking-tight leading-snug ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {c.name}
                    </h4>
                    {isActive && (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-blue-900/40 text-primary border border-primary/80 rounded shrink-0">
                        ACTIVE CAMPUS
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 italic">{c.location}</p>
                  
                  <div className="flex items-center justify-between text-[9px] font-mono text-zinc-650 mt-3 pt-2 border-t border-border/60">
                    <span>Librarian: {c.librarianName}</span>
                    <span className="text-muted-foreground/60 font-bold">{c.code}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-background/40 border border-border/60 rounded-xl space-y-1.5 font-mono text-[10px] text-muted-foreground/60">
            <p>💡 <strong className="text-muted-foreground">Campus Switch Effect:</strong> Switching colleges will load their specific semester syllabus, student registry parameters, and weight metrics seamlessly inside your session.</p>
          </div>
        </div>

        {/* Right column: Form for Onboarding a New College */}
        <div className="lg:col-span-2 bg-muted/50/20 border border-border/60 rounded-2xl p-5 md:p-6">
          <form onSubmit={handleCollegeOnboard} className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <School className="w-5 h-5 text-primary" />
              <div>
                <h3 className="text-sm font-bold text-foreground">Register / Onboard College Campus</h3>
                <p className="text-[9px] font-mono text-muted-foreground/60 uppercase">Enroll your campus library into Neev Core network</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">College / University Name:</label>
                <input
                  type="text"
                  required
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  placeholder="e.g. IIT Bombay, Dayananda Sagar Engineering..."
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground/90 outline-none focus:border-border placeholder-zinc-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Campus Code Index (Prefix):</label>
                <input
                  type="text"
                  required
                  value={newCollegeCode}
                  onChange={(e) => setNewCollegeCode(e.target.value)}
                  placeholder="e.g. IITB-MUMBAI, DSCE-BLR"
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground/90 outline-none focus:border-border font-mono uppercase placeholder-zinc-650"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Campus City & State Location:</label>
                <input
                  type="text"
                  required
                  value={newCollegeLocation}
                  onChange={(e) => setNewCollegeLocation(e.target.value)}
                  placeholder="e.g. Pune, Maharashtra"
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground/90 outline-none focus:border-border placeholder-zinc-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Chief Librarian / Registrar In-Charge:</label>
                <input
                  type="text"
                  required
                  value={newCollegeLibrarian}
                  onChange={(e) => setNewCollegeLibrarian(e.target.value)}
                  placeholder="e.g. Dr. Anil Kumar Kothari"
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground/90 outline-none focus:border-border placeholder-zinc-600"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Library Architectural Layout Preset:</label>
              <select
                value={selectedLayoutType}
                onChange={(e) => setSelectedLayoutType(e.target.value)}
                className="w-full bg-background border border-border rounded-lg p-2.5 text-muted-foreground outline-none focus:border-border cursor-pointer"
              >
                <option value="Central Academic Racks Grid">Central Academic Racks Grid (Aisle A to E)</option>
                <option value="Double-Decker Heritage Vault Racks">Double-Decker Heritage Vault Racks</option>
                <option value="Inter-Department Science Wing Blocks">Inter-Department Science Wing Blocks</option>
                <option value="Standard Reference Books Library Model">Standard Reference Books Library Model</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={onboardSuccess}
              className="w-full py-2.5 bg-gradient-to-r from-primary to-primary disabled:from-zinc-800 hover:from-primary hover:to-indigo-505 disabled:text-muted-foreground/50 border border-blue-500/10 rounded-xl font-bold text-xs text-foreground tracking-wider flex items-center justify-center space-x-2 transition"
            >
              {onboardSuccess ? (
                <>
                  <Check className="w-4 h-4 text-secondary animate-pulse" />
                  <span>Onboarding College Web-Space... Done! (+350 XP)</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Onboard New University Library Space</span>
                </>
              )}
            </button>
          </form>
        </div>

      </section>

      {/* College Book Rack and Layout Map Configurations */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Box 1: Dynamic Campus Layout Floor map controller */}
        <div className="bg-muted/50/30 border border-border/60 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-border pb-3">
            <Layers className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-bold text-foreground">Dynamic Physical Racks Configurator</h3>
              <p className="text-[9px] font-mono text-muted-foreground/60 uppercase">Add/Delete Custom Shelf Coordinates on Interactive Map</p>
            </div>
          </div>

          <form onSubmit={handleAddCustomShelf} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">New Shelf Name:</label>
                <input
                  type="text"
                  required
                  value={customShelfName}
                  onChange={(e) => setCustomShelfName(e.target.value)}
                  placeholder="e.g. Biotech Lab Row, UPSC Shelf"
                  className="w-full bg-background border border-border rounded-lg p-2 text-zinc-205 outline-none focus:border-border"
                />
              </div>

              <div className="space-y-1 col-span-2 sm:col-span-1">
                <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Map Aisle Segment:</label>
                <select
                  value={customShelfAisle}
                  onChange={(e) => setCustomShelfAisle(e.target.value as any)}
                  className="w-full bg-background border border-border rounded-lg p-2 text-muted-foreground outline-none focus:border-border cursor-pointer"
                >
                  <option value="A">Aisle A (Science & Cosmos)</option>
                  <option value="B">Aisle B (Technology & Software)</option>
                  <option value="C">Aisle C (Fiction & Classics)</option>
                  <option value="D">Aisle D (Philosophy & Ethics)</option>
                  <option value="E">Aisle E (Biographies & Business)</option>
                </select>
              </div>
            </div>

            {/* Coordinates slider inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 bg-background/40 p-2.5 rounded-xl border border-border">
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground/50">
                  <span>Horizontal Axis (X):</span>
                  <span className="text-primary font-bold">{customShelfX}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="85"
                  value={customShelfX}
                  onChange={(e) => setCustomShelfX(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer mt-1"
                />
              </div>

              <div className="space-y-1 bg-background/40 p-2.5 rounded-xl border border-border">
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground/50">
                  <span>Vertical Axis (Y):</span>
                  <span className="text-purple-400 font-bold">{customShelfY}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={customShelfY}
                  onChange={(e) => setCustomShelfY(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer mt-1"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Custom Rack Details & Sensors:</label>
              <input
                type="text"
                value={customShelfDetails}
                onChange={(e) => setCustomShelfDetails(e.target.value)}
                placeholder="Excribe target syllabus material allocated to this shelf..."
                className="w-full bg-background border border-border rounded-lg p-2 text-zinc-205 outline-none focus:border-border"
              />
            </div>

            <button
              type="submit"
              disabled={shelfConfigSuccess}
              className="w-full py-2 bg-muted hover:bg-zinc-700 disabled:bg-muted/50 text-muted-foreground hover:text-foreground border border-border rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition"
            >
              {shelfConfigSuccess ? (
                <>
                  <Check className="w-4 h-4 text-secondary animate-pulse" />
                  <span>Custom Shelf Positioned! (+200 XP)</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Mount Shelf Custom Coordinates</span>
                </>
              )}
            </button>
          </form>

          {/* List of custom registered shelves to delete/see list */}
          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Configured Racks list ({zones.filter(z => z.type === 'shelf').length})</h4>
            <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
              {zones.filter(z => z.type === 'shelf').map((z) => (
                <div key={z.id} className="p-2 bg-background/80 border border-border rounded-lg flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-305 truncate uppercase">
                    Aisle {z.aisle || 'A'}: <strong className="text-foreground">{z.name.replace(/\(Aisle.*?\)/g, '')}</strong>
                  </span>
                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-[10px] text-muted-foreground/50">Loc: {z.x}X, {z.y}Y</span>
                    {/* Delete shelf */}
                    {z.id.startsWith("shelf-") && z.id !== "shelf-A" && z.id !== "shelf-B" && z.id !== "shelf-C" && z.id !== "shelf-D" && z.id !== "shelf-E" && (
                      <button
                        onClick={() => onDeleteZone(z.id)}
                        className="text-muted-foreground hover:text-destructive transition"
                        title="Delete this shelf rack configuration"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Box 2: Semester / Solved Papers dynamic book inventory loader */}
        <div className="bg-muted/50/30 border border-border/60 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-border pb-3">
            <ClipboardList className="w-5 h-5 text-secondary" />
            <div>
              <h3 className="text-sm font-bold text-foreground">Curriculum / Solved Papers Registry</h3>
              <p className="text-[9px] font-mono text-muted-foreground/60 uppercase">Publish Indian college core syllabus to active catalog</p>
            </div>
          </div>

          <form onSubmit={handleAddSyllabusBook} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Curriculum Textbook Name:</label>
                <input
                  type="text"
                  required
                  value={syllabusTitle}
                  onChange={(e) => setSyllabusTitle(e.target.value)}
                  placeholder="e.g. Engineering Mathematics IV, Database Guides"
                  className="w-full bg-background border border-border rounded-lg p-2 text-zinc-205 outline-none focus:border-border"
                />
              </div>

              <div className="space-y-1 col-span-2 sm:col-span-1">
                <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Author or Publisher Node:</label>
                <input
                  type="text"
                  required
                  value={syllabusAuthor}
                  onChange={(e) => setSyllabusAuthor(e.target.value)}
                  placeholder="e.g. Dr. K. R. Gopalakrishna, Tata McGraw..."
                  className="w-full bg-background border border-border rounded-lg p-2 text-zinc-250 outline-none focus:border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Branch/Dept:</label>
                <select
                  value={syllabusDept}
                  onChange={(e) => setSyllabusDept(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2 text-muted-foreground outline-none focus:border-zinc-70s cursor-pointer"
                >
                  <option value="Computer Science CSE">Computer CSE</option>
                  <option value="Electronics ECE">Electro ECE</option>
                  <option value="Mechanical Eng">Mech ME</option>
                  <option value="First Year Core">First Year Academic</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Semester Level:</label>
                <select
                  value={syllabusSem}
                  onChange={(e) => setSyllabusSem(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2 text-muted-foreground outline-none focus:border-zinc-75s cursor-pointer"
                >
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 5">Semester 5</option>
                  <option value="Semester 6">Semester 6</option>
                  <option value="Semester 7">Semester 7</option>
                  <option value="Semester 8">Semester 8</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Shelf Location:</label>
                <select
                  value={targetShelf}
                  onChange={(e) => setTargetShelf(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2 text-zinc-350 outline-none font-mono uppercase focus:border-zinc-75s cursor-pointer"
                >
                  {zones.filter(z => z.type === 'shelf').map(z => (
                    <option key={z.id} value={z.id.replace('shelf-', '')}>{z.id.replace('shelf-', '')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground/60">
                <label className="uppercase font-semibold">Registered ISBN-IN Code:</label>
                <button
                  type="button"
                  onClick={handleAutoIsbn}
                  className="text-primary hover:text-foreground transition"
                >
                  ⚙ Generate Indian Standard Code
                </button>
              </div>
              <input
                type="text"
                value={syllabusIsbn}
                onChange={(e) => setSyllabusIsbn(e.target.value)}
                placeholder="Auto-generated or custom standard ISBN prefix..."
                className="w-full bg-background border border-border rounded-lg p-2 text-muted-foreground font-mono outline-none focus:border-zinc-70s"
              />
            </div>

            <button
              type="submit"
              disabled={bookRegistered}
              className="w-full py-2 bg-gradient-to-r from-secondary to-secondary hover:from-emerald-505 hover:to-teal-505 border border-emerald-500/10 rounded-xl font-bold text-xs text-foreground flex items-center justify-center space-x-1 px-4 transition"
            >
              {bookRegistered ? (
                <>
                  <Check className="w-4 h-4 text-foreground animate-pulse" />
                  <span>Curriculum Indexed! (+150 XP)</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Academic Text to Catalog</span>
                </>
              )}
            </button>
          </form>
        </div>

      </section>

    </div>
  );
};
