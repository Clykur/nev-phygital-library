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


export const NeevStudentDashboard: React.FC<any> = () => {
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

  // Removed unused /api/hub/overview to prevent 403 Forbidden for students
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



  const handleCustomRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRequestInput.trim()) return;

    try {
      // Hit actual api
      await apiFetch('/api/book-requests', {
        method: 'POST',
        token: token || undefined,
        body: JSON.stringify({ bookTitle: customRequestInput.trim(), hubId: user?.hubMemberships?.[0]?.hubId || "00000000-0000-0000-0000-000000000000" })
      });

      setCustomRequestInput('');
      setRequestSubmittedMessage(`Success! Registered upvote request for "${customRequestInput}" onto the database.`);
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
      <div className="p-4 bg-surface border border-border rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div className="w-10 h-10 flex items-center justify-center text-foreground shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="caption-scale font-semibold text-muted-foreground uppercase tracking-widest">Authenticated student portal</span>
            <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-foreground">Welcome back, {user?.name}</h2>
            {user?.premiumActive && (
              <span className="px-2 py-0.5 bg-primary/80 text-blue-300 rounded caption-scale font-mono font-semibold tracking-wider">PREMIUM</span>
            )}
            {user?.hubMemberships && user.hubMemberships.length > 0 && (
              <span className="px-2 py-0.5 bg-accent text-accent-foreground rounded caption-scale font-mono font-semibold tracking-wider">HUB MEMBER</span>
            )}
          </div>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-muted-foreground">SYSTEM HEALTH:</span>
          <span className="px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded font-semibold">
            ONLINE
          </span>
        </div>
      </div>

      {/* Side-by-Side Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left column: Elastic credit block & Personal active deposits */}
        <div className="lg:col-span-1 space-y-6">

          {/* Elastic Credit Buffer Progress Card */}
          <div className={`bento-card p-6 space-y-5 relative ${flashReconciliation ? 'border-success ring-2 ring-success/10 bg-success/10' : ''}`}>

            {flashReconciliation && (
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-secondary/90 border border-secondary/30 text-secondary caption-scale font-semibold font-mono rounded animate-pulse">
                ✔ CAPACITY RECLAIMED
              </div>
            )}

            <div className="space-y-1">
              <span className="caption-scale font-semibold uppercase tracking-widest text-muted-foreground block">
                Neev Elastic Kiosk Credit Buffer
              </span>
              <h3 className="h3-scale font-bold text-foreground flex items-baseline gap-1.5">
                ₹{availableCredits.toLocaleString()}
                <span className="text-xs text-muted-foreground font-normal">Available Credits</span>
              </h3>
              <p className="caption-scale text-muted-foreground">5,000 Total Student Buffer Limit</p>
            </div>

            {/* Elastic Cap Progress Bar representation */}
            <div className="space-y-2">
              <div className="w-full h-3 bg-muted/50 border border-border rounded-lg overflow-hidden flex relative">
                {/* Spent Segment */}
                <div
                  className="h-full bg-muted transition-all duration-700 border-r border-border"
                  style={{ width: `${utilizationPercentage}%` }}
                ></div>
                {/* Remaining Available Credit segment */}
                <div
                  className={`h-full bg-primary transition-all duration-700 ${flashReconciliation ? 'animate-pulse bg-success' : ''
                    }`}
                  style={{ width: `${(availableCredits / 5000) * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center caption-scale font-medium text-muted-foreground uppercase">
                <span>BLOCKED: {totalBorrowedValue} CR</span>
                <span className="text-primary font-semibold">CAP OVERALL: {availableCredits} CR</span>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-3 border border-border text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground block mb-1">Cap Allocation Policy:</span>
              Your ₹999 membership yields a temporary ₹5,000 credit bar. Every checked-out text allocates safe collateral. Restoring book holdings instantly refunds and clears buffer constraints.
            </div>
          </div>


        </div>

        {/* Center/Right column group: Active lease checkout management and Bounty upvotes */}
        <div className="lg:col-span-2 space-y-6">

          {/* Component 2: Active Leases Card showing remaining days */}
          <div className="bento-card p-6 bg-card space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground tracking-tight">Active Book Leases</h3>
                  <p className="caption-scale font-mono text-muted-foreground/60 uppercase font-semibold">Track remaining rental days before return deadlines</p>
                </div>
              </div>
              <span className="caption-scale font-mono px-2 py-0.5 bg-background border border-border text-muted-foreground rounded-md">
                {activeCheckouts.length} checked out
              </span>
            </div>

            {activeCheckouts.length === 0 ? (
              <div className="p-8 text-center bg-background/40 border border-border/60 rounded-xl space-y-2">
                <BookOpen className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground">No active book rentals currently checked out to your card.</p>
                <p className="caption-scale text-muted-foreground/50">Navigate to the Catalog of syllabus titles to borrow items instantly.</p>
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
                          <span className="caption-scale font-mono bg-zinc-90 w-full text-zinc-405 border border-border/60 rounded px-1.5 py-0.5">
                            {creditValue} Credits Blocked
                          </span>
                          <span className={`caption-scale font-mono font-semibold px-1.5 py-0.5 rounded ${isCloseToDeadline ? 'bg-accent/90 text-accent border border-amber-900/40' : 'bg-primary/90 text-primary border border-blue-900/40'
                            }`}>
                            {checkout.daysRemaining} days left
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-foreground mt-1 line-clamp-1">{checkout.title}</h4>
                        <p className="caption-scale text-muted-foreground/60 mt-0.5 font-light">by {checkout.author}</p>
                      </div>

                      <div className="pt-2 border-t border-border flex justify-between items-center">
                        <span className="text-[9.5px] font-mono text-muted-foreground/50 uppercase">Return due: {checkout.dueDate}</span>
                        <button
                          type="button"
                          onClick={() => handleTriggerReturnWithFlash(checkout.id, checkout.bookId)}
                          className="px-2.5 py-1 bg-muted/50 hover:bg-zinc-850 caption-scale text-muted-foreground hover:text-foreground border border-border/60 rounded transition font-semibold"
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
          <div className="bento-card p-6 bg-card space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground tracking-tight">Campus Bounty Board</h3>
                  <p className="caption-scale font-mono text-zinc-505 uppercase font-semibold">Syllabus items currently wanted by the hub for free premium trades</p>
                </div>
              </div>

              {/* Category Segment Control */}
              <div className="flex space-x-1.5 bg-background/80 p-0.5 border border-border rounded-lg shrink-0">
                <button
                  onClick={() => setBountyFilter('all')}
                  className={`px-2.5 py-1 text-[9.5px] font-mono rounded-md font-semibold transition-all ${bountyFilter === 'all' ? 'bg-muted text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'
                    }`}
                >
                  ALL
                </button>
                <button
                  onClick={() => setBountyFilter('computer')}
                  className={`px-2.5 py-1 text-[9.5px] font-mono rounded-md font-semibold transition-all ${bountyFilter === 'computer' ? 'bg-muted text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'
                    }`}
                >
                  COMP
                </button>
                <button
                  onClick={() => setBountyFilter('mechanical')}
                  className={`px-2.5 py-1 text-[9.5px] font-mono rounded-md font-semibold transition-all ${bountyFilter === 'mechanical' ? 'bg-muted text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'
                    }`}
                >
                  MECH
                </button>
              </div>
            </div>

            {/* Request form submission widget */}
            <form onSubmit={handleCustomRequestSubmit} className="p-4 bg-background/40 border border-border/60 rounded-xl space-y-3">
              <h4 className="caption-scale font-semibold font-mono text-muted-foreground uppercase">Submit a Syllabus Book request / Upvote request</h4>
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
                  className="px-3 py-1.5 bg-primary hover:bg-primary text-xs font-semibold text-foreground rounded-lg transition shrink-0 flex items-center space-x-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Request</span>
                </button>
              </div>
              {requestSubmittedMessage && (
                <p className="caption-scale font-mono text-emerald-450 animate-pulse">{requestSubmittedMessage}</p>
              )}
            </form>

            {/* List User's Active Requests */}
            <div className="space-y-2.5">
              <span className="caption-scale font-mono text-primary font-semibold uppercase tracking-wider block">Your Live Requests</span>
              
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
                        <div className="flex items-center space-x-2 caption-scale font-mono">
                          <span className="uppercase bg-zinc-90 w-full text-muted-foreground/50 border border-border/60 rounded px-1.5 py-0.5">
                            STATUS: {req.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-foreground leading-normal">{req.bookTitle}</h4>
                      </div>
                      <span className="px-2.5 py-1 bg-muted/50 border border-border/60 caption-scale font-mono text-muted-foreground rounded-lg">
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
