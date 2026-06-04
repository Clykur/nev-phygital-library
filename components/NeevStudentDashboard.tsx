import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/auth-context';
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
  const { token, user } = useAuth();
  
  const { data: backendBooksPayload } = useQuery({
    queryKey: ['catalog', 'books'],
    queryFn: () => apiFetch<{ books: any[] }>('/api/catalog/books', { token: token || undefined })
  });

  const backendBooks = backendBooksPayload?.books || [];
  const activeCheckouts: ActiveCheckout[] = backendBooks
    .filter((b: any) => b.borrowerUserId === user?.userId && b.status === 'checked_out')
    .map((b: any) => ({
      id: b.id, // using book id as checkout id
      bookId: b.id,
      title: b.title,
      author: b.author || "Peer/Hub Listing",
      dateBorrowed: b.updatedAt ? new Date(b.updatedAt).toLocaleDateString() : 'Recent',
      dueDate: b.dueAt ? new Date(b.dueAt).toLocaleDateString() : 'N/A',
      daysRemaining: b.dueAt ? Math.max(0, Math.ceil((new Date(b.dueAt).getTime() - Date.now()) / (1000 * 3600 * 24))) : 0
    }));

  const { data: myRequestsPayload } = useQuery({
    queryKey: ['my-book-requests'],
    queryFn: () => apiFetch<{ requests: any[] }>('/api/book-requests/mine', { token: token || undefined })
  });
  
  const myRequests = myRequestsPayload?.requests || [];

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
        // Find hub context if available or pass dummy
        await onRequestBounty(customRequestInput.trim(), 'Computer Science');
      }
      
      // Hit actual api
      await apiFetch('/api/book-requests', {
        method: 'POST',
        token: token || undefined,
        body: JSON.stringify({ bookTitle: customRequestInput.trim(), hubId: user?.hubMemberships?.[0]?.hubId || "00000000-0000-0000-0000-000000000000" })
      });

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

  const handleTriggerReturnWithFlash = async (checkoutId: string, bookId: string) => {
    try {
      await apiFetch(`/api/books/${bookId}/return`, {
        method: 'POST',
        token: token || undefined
      });
      onReturnBook(checkoutId, bookId);
      setFlashReconciliation(true);
      setTimeout(() => {
        setFlashReconciliation(false);
      }, 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Top Banner Alert for Student */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Authenticated student portal</span>
            <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-foreground">Welcome back, {user?.name}</h2>
            {user?.premiumActive && (
              <span className="px-2 py-0.5 bg-blue-900 text-blue-300 rounded text-[9px] font-mono font-bold tracking-wider">PREMIUM</span>
            )}
            {user?.hubMemberships && user.hubMemberships.length > 0 && (
              <span className="px-2 py-0.5 bg-purple-900 text-purple-300 rounded text-[9px] font-mono font-bold tracking-wider">HUB MEMBER</span>
            )}
          </div>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-slate-500">SYSTEM HEALTH:</span>
          <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded font-bold">
            ONLINE
          </span>
        </div>
      </div>

      {/* Side-by-Side Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left column: Elastic credit block & Personal active deposits */}
        <div className="lg:col-span-1 space-y-6">

          {/* Elastic Credit Buffer Progress Card */}
          <div className={`border rounded-xl p-6 space-y-5 transition-all duration-500 relative overflow-hidden ${flashReconciliation
              ? 'border-green-500 ring-2 ring-green-500/10 bg-green-50'
              : 'border-slate-200 bg-white shadow-sm'
            }`}>

            {flashReconciliation && (
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold font-mono rounded animate-pulse">
                ✔ CAPACITY RECLAIMED
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block">
                Neev Elastic Kiosk Credit Buffer
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 flex items-baseline gap-1.5">
                ₹{availableCredits.toLocaleString()}
                <span className="text-xs text-slate-500 font-normal">Available Credits</span>
              </h3>
              <p className="text-[11px] text-slate-400">5,000 Total Student Buffer Limit</p>
            </div>

            {/* Elastic Cap Progress Bar representation */}
            <div className="space-y-2">
              <div className="w-full h-3 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden flex relative">
                {/* Spent Segment */}
                <div
                  className="h-full bg-slate-300 transition-all duration-700 border-r border-slate-300"
                  style={{ width: `${utilizationPercentage}%` }}
                ></div>
                {/* Remaining Available Credit segment */}
                <div
                  className={`h-full bg-blue-500 transition-all duration-700 ${flashReconciliation ? 'animate-pulse bg-green-500' : ''
                    }`}
                  style={{ width: `${(availableCredits / 5000) * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-medium text-slate-500 uppercase">
                <span>BLOCKED: {totalBorrowedValue} CR</span>
                <span className="text-blue-600 font-bold">CAP OVERALL: {availableCredits} CR</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-900 block mb-1">Cap Allocation Policy:</span>
              Your ₹999 membership yields a temporary ₹5,000 credit bar. Every checked-out text allocates safe collateral. Restoring book holdings instantly refunds and clears buffer constraints.
            </div>
          </div>

          {/* Financial Ledger View: Personal Active Deposits */}
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Coins className="w-4 h-4 text-green-500" />
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Personal Active Deposits Ledger</h3>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">100% Refundable cash locks</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase">Collateral Layer 1</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">Physical Book Deposit Holding</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-green-600">₹2,000.00</span>
                  <span className="text-[8px] block text-green-700 uppercase font-semibold">SECURE_ESCROW</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 leading-relaxed font-light bg-slate-50 p-2.5 rounded-lg border border-slate-100">
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
                      className={`p-4 bg-background/60 border rounded-xl space-y-3 float-left flex flex-col justify-between ${isCloseToDeadline ? 'border-amber-900/50 bg-amber-950/5' : 'border-border'
                        }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono bg-zinc-90 w-full text-zinc-405 border border-border/60 rounded px-1.5 py-0.5">
                            {creditValue} Credits Blocked
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${isCloseToDeadline ? 'bg-amber-950 text-amber-400 border border-amber-900/40' : 'bg-blue-950 text-blue-400 border border-blue-900/40'
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
                  className={`px-2.5 py-1 text-[9.5px] font-mono rounded-md font-bold transition-all ${bountyFilter === 'all' ? 'bg-muted text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'
                    }`}
                >
                  ALL
                </button>
                <button
                  onClick={() => setBountyFilter('computer')}
                  className={`px-2.5 py-1 text-[9.5px] font-mono rounded-md font-bold transition-all ${bountyFilter === 'computer' ? 'bg-muted text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'
                    }`}
                >
                  COMP
                </button>
                <button
                  onClick={() => setBountyFilter('mechanical')}
                  className={`px-2.5 py-1 text-[9.5px] font-mono rounded-md font-bold transition-all ${bountyFilter === 'mechanical' ? 'bg-muted text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'
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

            {/* List User's Active Requests */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider block">Your Live Requests</span>
              
              {myRequests.length === 0 ? (
                <div className="p-4 text-center bg-background/40 border border-border/60 rounded-xl space-y-2">
                  <p className="text-xs text-muted-foreground">You don't have any active book requests.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myRequests.map((req: any, idx: number) => (
                    <div
                      key={req.id || idx}
                      className="p-3.5 bg-background border border-border rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 text-left">
                        <div className="flex items-center space-x-2 text-[9px] font-mono">
                          <span className="uppercase bg-zinc-90 w-full text-muted-foreground/50 border border-border/60 rounded px-1.5 py-0.5">
                            STATUS: {req.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground leading-normal">{req.bookTitle}</h4>
                      </div>
                      <span className="px-2.5 py-1 bg-muted/50 border border-border/60 text-[10px] font-mono text-muted-foreground rounded-lg">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
