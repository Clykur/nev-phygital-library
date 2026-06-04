import React, { useState } from 'react';
import { PhygitalBook } from '../services/neevData';
import { useCatalogBooks, useActivityTimeline } from '../services/api';
import { 
  Layers, BookOpen, Clock, Calendar, ShieldCheck, 
  Sparkles, Flame, Check, PlusCircle, AlertTriangle, 
  HelpCircle, ThumbsUp, ArrowRight, Coins
} from 'lucide-react';

interface ActiveCheckout {
  id: string;
  bookId: string;
  title: string;
  author: string;
  dateBorrowed: string;
  dueDate: string;
  daysRemaining: number;
}

interface NewUpvoteRequest {
  id: string;
  title: string;
  department: string;
  votes: number;
  voted: boolean;
}


export const NeevStudentDashboard: React.FC<any> = ({
  xp,
  addXp,
  onReturnBook,
  onRequestBounty,
}) => {
  const { data: backendBooks = [] } = useCatalogBooks();
  
  // We can derive activeCheckouts from backend data if available, for now empty
  const activeCheckouts: ActiveCheckout[] = [];
  const bountyBoard: any[] = [];
  
  // Elastic Credit Buffer limits
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
    return 800; // Baseline standard credits
  };

  const totalBorrowedValue = activeCheckouts.reduce((sum, checkout) => sum + getBookCreditValue(checkout.title), 0);
  const availableCredits = 5000 - totalBorrowedValue;
  const utilizationPercentage = (totalBorrowedValue / 5000) * 100;

  // Active student state
  const [bountyFilter, setBountyFilter] = useState<'all' | 'computer' | 'mechanical'>('all');
  const [flashReconciliation, setFlashReconciliation] = useState(false);
  const [selectedBookToUpvote, setSelectedBookToUpvote] = useState('');
  const [customRequestInput, setCustomRequestInput] = useState('');
  const [requestSubmittedMessage, setRequestSubmittedMessage] = useState('');

  // Local upvote pool
  const [bountyBeds, setBountyBeds] = useState<NewUpvoteRequest[]>([
    { id: 'bb-1', title: 'Artificial Intelligence: A Modern Approach', department: 'Computer Science', votes: 41, voted: false },
    { id: 'bb-2', title: 'Compiler Design: Principles & Tools', department: 'Computer Science', votes: 29, voted: false },
    { id: 'bb-3', title: 'Fluid Mechanics & Hydraulic Machines', department: 'Mechanical Engineering', votes: 34, voted: false },
    { id: 'bb-4', title: 'Control Systems Engineering', department: 'Electrical Engineering', votes: 18, voted: false },
  ]);

  const handleUpvote = (id: string) => {
    setBountyBeds(prev => 
      prev.map(item => {
        if (item.id === id) {
          const actionWeight = item.voted ? -1 : 1;
          if (!item.voted) addXp(25);
          return { ...item, votes: item.votes + actionWeight, voted: !item.voted };
        }
        return item;
      })
    );
  };

  const handleCustomRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRequestInput.trim()) return;
    
    try {
      if (onRequestBounty) {
        await onRequestBounty(customRequestInput.trim(), 'Computer Science');
      }
      
      const newReq: NewUpvoteRequest = {
        id: `bb-custom-${Date.now()}`,
        title: customRequestInput,
        department: 'Syllabus CS/IT',
        votes: 1,
        voted: true
      };

      setBountyBeds(prev => [newReq, ...prev]);
      setCustomRequestInput('');
      setRequestSubmittedMessage(`Success! Registered upvote request for "${customRequestInput}" onto the database.`);
      addXp(60);
    } catch (err: any) {
      setRequestSubmittedMessage(`Failed: ${err.message}`);
    }

    setTimeout(() => {
      setRequestSubmittedMessage('');
    }, 4000);
  };

  const handleTriggerReturnWithFlash = (checkoutId: string, bookId: string) => {
    onReturnBook(checkoutId, bookId);
    setFlashReconciliation(true);
    setTimeout(() => {
      setFlashReconciliation(false);
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Banner Alert for Student */}
      <div className="p-4 bg-muted/50 border border-border/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-900/50 flex items-center justify-center text-primary shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest font-bold">Authenticated student portal</span>
            <h2 className="text-sm font-bold text-foreground tracking-tight">Active Reference Session Safe</h2>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-muted-foreground/60">SYSTEM HEALTH:</span>
          <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 rounded font-bold">
            ONLINE
          </span>
        </div>
      </div>

      {/* Side-by-Side Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Elastic credit block & Personal active deposits */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Elastic Credit Buffer Progress Card */}
          <div className={`border rounded-2xl p-6 space-y-5 transition-all duration-500 relative overflow-hidden ${
            flashReconciliation 
              ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-950/10' 
              : 'border-border/60 bg-muted/50/40'
          }`}>
            
            {flashReconciliation && (
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold font-mono rounded animate-pulse">
                ✔ CAPACITY RECLAIMED
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground/60 uppercase font-bold block">
                Neev Elastic Kiosk Credit Buffer
              </span>
              <h3 className="text-2xl font-mono font-extrabold text-foreground flex items-baseline gap-1.5">
                ₹{availableCredits.toLocaleString()}
                <span className="text-xs text-muted-foreground font-sans font-normal">Available Credits</span>
              </h3>
              <p className="text-[11px] text-zinc-505 font-mono">5,000 Total Student Buffer Limit</p>
            </div>

            {/* Elastic Cap Progress Bar representation */}
            <div className="space-y-2">
              <div className="w-full h-3 bg-background border border-border rounded-lg overflow-hidden flex relative">
                {/* Spent Segment */}
                <div 
                  className="h-full bg-muted transition-all duration-700 border-r border-border" 
                  style={{ width: `${utilizationPercentage}%` }}
                ></div>
                {/* Remaining Available Credit segment */}
                <div 
                  className={`h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600 transition-all duration-700 ${
                    flashReconciliation ? 'animate-pulse bg-gradient-to-r from-emerald-500 to-emerald-400' : ''
                  }`} 
                  style={{ width: `${(availableCredits / 5000) * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-muted-foreground/60">BLOCKED: {totalBorrowedValue} CR</span>
                <span className="text-primary font-bold">CAP OVERALL: {availableCredits} CR</span>
              </div>
            </div>

            <div className="bg-background/50 rounded-xl p-3 border border-border/60 text-[11px] text-muted-foreground leading-relaxed font-sans">
              <span className="font-semibold text-foreground/90 block mb-1">Cap Allocation Policy:</span>
              Your ₹999 membership yields a temporary ₹5,000 credit bar. Every checked-out text allocates safe collateral. Restoring book holdings instantly refunds and clears buffer constraints.
            </div>
          </div>

          {/* Financial Ledger View: Personal Active Deposits */}
          <div className="bg-muted/50/40 border border-zinc-805 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <Coins className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">Personal Active Deposits Ledger</h3>
                <p className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">100% Refundable cash locks</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-background/40 border border-border rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono text-muted-foreground/60 uppercase">Collateral Layer 1</span>
                  <p className="text-xs font-bold text-foreground/90 mt-0.5">Physical Book Deposit Holding</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-bold text-emerald-400">₹2,000.00</span>
                  <span className="text-[8px] font-mono block text-emerald-500 uppercase font-semibold">SECURE_ESCROW</span>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground leading-relaxed font-light font-sans bg-background/20 p-2.5 rounded-lg border border-border/30">
                🚀 This flat ₹2,000 buffer is held under your college’s dedicated bank escrow. In the event of a lost book or unpaid penalty exceeding deadlines, funds are reconciled automatically. Otherwise, you maintain full eligibility for instant payout withdrawal upon terminating subscriptions.
              </div>
            </div>
          </div>

          {/* Reading Hours and Next Exam Countdown */}
          <div className="bg-muted/50/40 border border-border/60 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <Flame className="w-4.5 h-4.5 text-amber-500" />
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">Active Scholar Analytics</h3>
                <p className="text-[10px] font-mono text-zinc-505 uppercase">Tracking daily study streaks</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-background/40 border border-border rounded-xl text-center">
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block">Reading Hours logged</span>
                <span className="text-xl font-mono font-bold text-foreground mt-1 block">42.8 Hrs</span>
              </div>
              <div className="p-3 bg-background/40 border border-border rounded-xl text-center">
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block">Study Streak</span>
                <span className="text-xl font-mono font-bold text-amber-500 mt-1 block">12 Days</span>
              </div>
            </div>

            {/* Next exam countdown widget */}
            <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono text-primary font-bold">
                <span className="uppercase">COMP. SCIENCE FINALS COUNTDOWN</span>
                <span className="animate-pulse">● LIVE</span>
              </div>
              <p className="text-xs font-bold text-foreground font-sans">Data Systems & Algorithmic Analysis</p>
              <div className="flex gap-2 pt-1 font-mono text-xs">
                <div className="flex-1 bg-background/80 rounded py-1 text-center">
                  <span className="text-foreground font-bold block">04</span>
                  <span className="text-[8px] text-muted-foreground/60">DAYS</span>
                </div>
                <div className="flex-1 bg-background/80 rounded py-1 text-center">
                  <span className="text-foreground font-bold block">12</span>
                  <span className="text-[8px] text-muted-foreground/60">HRS</span>
                </div>
                <div className="flex-1 bg-background/80 rounded py-1 text-center">
                  <span className="text-foreground font-bold block">48</span>
                  <span className="text-[8px] text-muted-foreground/60">MINS</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Center/Right column group: Active lease checkout management and Bounty upvotes */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Component 2: Active Leases Card showing remaining days */}
          <div className="bg-muted/50/40 border border-border/60 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-foreground tracking-tight">Active Book Leases</h3>
                  <p className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Track remaining rental days before return deadlines</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-background border border-border text-muted-foreground rounded-md">
                {activeCheckouts.length} checked out
              </span>
            </div>

            {activeCheckouts.length === 0 ? (
              <div className="p-8 text-center bg-background/40 border border-border/60 rounded-xl space-y-2">
                <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-muted-foreground">No active book rentals currently checked out to your card.</p>
                <p className="text-[11px] text-muted-foreground/50">Navigate to the Catalog of syllabus titles to borrow items instantly.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeCheckouts.map((checkout) => {
                  const creditValue = getBookCreditValue(checkout.title);
                  const isCloseToDeadline = checkout.daysRemaining <= 5;

                  return (
                    <div 
                      key={checkout.id} 
                      className={`p-4 bg-background/60 border rounded-xl space-y-3 float-left flex flex-col justify-between ${
                        isCloseToDeadline ? 'border-amber-900/50 bg-amber-950/5' : 'border-border'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono bg-zinc-90 w-full text-zinc-405 border border-border/60 rounded px-1.5 py-0.5">
                            {creditValue} Credits Blocked
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isCloseToDeadline ? 'bg-amber-950 text-amber-400 border border-amber-900/40' : 'bg-blue-950 text-blue-400 border border-blue-900/40'
                          }`}>
                            {checkout.daysRemaining} days left
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground mt-1 line-clamp-1">{checkout.title}</h4>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-light">by {checkout.author}</p>
                      </div>

                      <div className="pt-2 border-t border-border flex justify-between items-center">
                        <span className="text-[9.5px] font-mono text-muted-foreground/50 uppercase">Return due: {checkout.dueDate}</span>
                        <button
                          type="button"
                          onClick={() => handleTriggerReturnWithFlash(checkout.id, checkout.bookId)}
                          className="px-2.5 py-1 bg-muted/50 hover:bg-zinc-850 text-[10px] text-muted-foreground hover:text-foreground border border-border/60 rounded transition font-bold"
                        >
                          Return Kiosk
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Component 3: Bounty Board Feed showing titles currently wanted */}
          <div className="bg-muted/50/40 border border-border/60 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-foreground tracking-tight">Campus Bounty Board</h3>
                  <p className="text-[10px] font-mono text-zinc-505 uppercase font-semibold">Syllabus items currently wanted by the hub for free premium trades</p>
                </div>
              </div>
              
              {/* Category Segment Control */}
              <div className="flex space-x-1.5 bg-background/80 p-0.5 border border-border rounded-lg shrink-0">
                <button
                  onClick={() => setBountyFilter('all')}
                  className={`px-2.5 py-1 text-[9.5px] font-mono rounded-md font-bold transition-all ${
                    bountyFilter === 'all' ? 'bg-muted text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'
                  }`}
                >
                  ALL
                </button>
                <button
                  onClick={() => setBountyFilter('computer')}
                  className={`px-2.5 py-1 text-[9.5px] font-mono rounded-md font-bold transition-all ${
                    bountyFilter === 'computer' ? 'bg-muted text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'
                  }`}
                >
                  COMP
                </button>
                <button
                  onClick={() => setBountyFilter('mechanical')}
                  className={`px-2.5 py-1 text-[9.5px] font-mono rounded-md font-bold transition-all ${
                    bountyFilter === 'mechanical' ? 'bg-muted text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'
                  }`}
                >
                  MECH
                </button>
              </div>
            </div>

            {/* Request form submission widget */}
            <form onSubmit={handleCustomRequestSubmit} className="p-4 bg-background/40 border border-border/60 rounded-xl space-y-3">
              <h4 className="text-[11px] font-bold font-mono text-muted-foreground uppercase">Submit a Syllabus Book request / Upvote request</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Design Patterns, Computer Architecture, Mechatronics..."
                  value={customRequestInput}
                  onChange={(e) => setCustomRequestInput(e.target.value)}
                  className="flex-1 bg-muted/50 border border-border/60 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-border font-sans"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-foreground rounded-lg transition shrink-0 flex items-center space-x-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Request</span>
                </button>
              </div>
              {requestSubmittedMessage && (
                <p className="text-[10px] font-mono text-emerald-450 animate-pulse">{requestSubmittedMessage}</p>
              )}
            </form>

            {/* List Bounty items */}
            <div className="space-y-2.5">
              {bountyBoard && bountyBoard.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider block">Live Server-Registered Demand</span>
                  {bountyBoard.map((item, bIdx) => (
                    <div 
                      key={`srv-${bIdx}`}
                      className="p-3.5 bg-background border border-border rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 text-left">
                        <div className="flex items-center space-x-2 text-[9px] font-mono">
                          <span className="uppercase bg-zinc-90 w-full text-muted-foreground/50 border border-border/60 rounded px-1.5 py-0.5">
                            {item.department || 'Academic'}
                          </span>
                          <span className="text-emerald-400 font-bold">
                            {item.currentUpvotes} / {item.thresholdRequired} UPVOTES
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground leading-normal">{item.title}</h4>
                      </div>
                      <span className="px-2.5 py-1 bg-muted/50 border border-border/60 text-[10px] font-mono text-muted-foreground rounded-lg">
                        {item.currentUpvotes >= item.thresholdRequired ? '🎯 BOUNTY LIVE' : '⌛ COLLATING'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <span className="text-[10px] font-mono text-muted-foreground/60 font-bold uppercase tracking-wider block pt-2 text-left">Local Syllabus Upvote Feed</span>
              {bountyBeds
                .filter(item => {
                  if (bountyFilter === 'computer') return item.department.toLowerCase().includes('computer');
                  if (bountyFilter === 'mechanical') return item.department.toLowerCase().includes('mechanical');
                  return true;
                })
                .map((bounty) => (
                  <div 
                    key={bounty.id} 
                    className="p-3.5 bg-background/60 border border-border rounded-xl flex items-center justify-between gap-3 hover:border-border/60 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-mono uppercase bg-zinc-90 border border-border/60 text-muted-foreground/60 px-1.5 py-0.5 rounded">
                          {bounty.department}
                        </span>
                        <span className="text-[9px] text-amber-500 font-mono font-bold">
                          Upvote Bounty
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground leading-normal">{bounty.title}</h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUpvote(bounty.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono transition flex items-center space-x-1.5 ${
                        bounty.voted 
                          ? 'bg-indigo-950 border-indigo-800 text-primary font-bold' 
                          : 'bg-muted/50 hover:bg-zinc-850 border-border/60 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <ThumbsUp className={`w-3 h-3 ${bounty.voted ? 'fill-current' : ''}`} />
                      <span>{bounty.votes}</span>
                    </button>
                  </div>
                ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
