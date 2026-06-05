import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/auth-context';
import {
  Sliders, RefreshCw, Layers, Check, BookOpen, Clock, Activity,
  ShieldCheck, Camera, QrCode, UserCheck, AlertTriangle, TrendingUp, Users,
  CheckCircle, ArrowRight, ShieldAlert, DollarSign, Send, Ban
} from 'lucide-react';


export const NeevCollegeDashboard: React.FC<any> = ({
  onAddBook,
  addXp,
  onKioskCheckout,
  onKioskReturn,
  onRequestBounty,
  onBountyIntake,
  onSimWebhook,
}) => {
  const { token } = useAuth();

  const { data: backendBooksPayload } = useQuery({
    queryKey: ['catalog', 'books'],
    queryFn: () => apiFetch<{ books: any[] }>('/api/catalog/books', { token: token || undefined })
  });

  const { data: activityTimelinePayload } = useQuery({
    queryKey: ['activity', 'timeline'],
    queryFn: () => apiFetch<{ events: any[] }>('/api/activity/timeline', { token: token || undefined })
  });

  const { data: hubOverviewPayload } = useQuery({
    queryKey: ['hub', 'overview'],
    queryFn: () => apiFetch<any>('/api/hub/overview', { token: token || undefined })
  });

  const { data: commercePayload } = useQuery({
    queryKey: ['hub', 'commerce'],
    queryFn: () => apiFetch<any>('/api/hub/commerce', { token: token || undefined })
  });

  const { data: telemetryPayload } = useQuery({
    queryKey: ['hub', 'telemetry'],
    queryFn: () => apiFetch<any>('/api/hub/telemetry', { token: token || undefined })
  });

  const activeCheckoutsCount = hubOverviewPayload?.metrics?.checkedOut || 0;
  const secureEscrowLiability = activeCheckoutsCount * 2000;
  const operatingRevenue = commercePayload?.inbound?.reduce((acc: number, log: any) => acc + (log.amount || 999), 0) || 0;
  const violations = telemetryPayload?.violations || [];
  const financialLogs = commercePayload?.inbound?.map((log: any) => ({
    timestamp: log.createdAt,
    category: log.action.includes('PURCHASE') ? 'OPERATIONAL_REVENUE_ANNUAL' : 'ESCROW_DEPOSIT_LOCK',
    clientId: log.actorUserId?.slice(0, 8) || 'Unknown',
    amount: log.amount || 999
  })) || [];

  const bountyBoard = hubOverviewPayload?.topRequestedTitles?.map((req: any) => ({
    isbn: req.title,
    title: req.title,
    department: "Student Requested",
    currentUpvotes: req.count,
    thresholdRequired: 5
  })) || [];

  const backendBooks = (backendBooksPayload as any)?.books || backendBooksPayload || [];
  const books = (backendBooks as any[]).map((cat: any, idx: number) => ({
    id: cat.id,
    title: cat.title,
    author: cat.author || "Peer/Hub Listing",
    year: 2024,
    genre: 'Technology',
    isbn: cat.refId || cat.id,
    rating: 4.8 - (idx * 0.1),
    pages: 400 + (idx * 50),
    physicalCopiesTotal: 1,
    physicalCopiesAvailable: cat.status === 'available' ? 1 : 0,
    digitalAvailable: true,
    shelfLocation: { aisle: 'A' as any, shelfId: `A1`, row: 1 },
    summary: "Book available from Hub.",
    keyTakeaways: [],
    reviews: []
  }));

  const timelinePayload = activityTimelinePayload as any;
  const timeline = timelinePayload?.timeline || timelinePayload?.events || timelinePayload || [];
  const rfidEvents = (timeline as any[]).slice(-10).map((act: any) => ({
    id: act.id,
    timestamp: new Date(act.createdAt).toLocaleTimeString(),
    type: 'shelf_lift',
    bookTitle: act.metadata?.title || "Syllabus Textbook",
    userMeta: act.userId || "Unknown",
    details: act.eventType
  }));
  // Navigation Tabs for Desk Operations
  const [deskTab, setDeskTab] = useState<'checkout' | 'return' | 'bounty' | 'finance' | 'telemetry'>('checkout');

  // Checkout Workspace States
  const [studentSelectId, setStudentSelectId] = useState<string>('student_1');
  const [selectedBookIsbn, setSelectedBookIsbn] = useState<string>('978-1617294433');
  const [checkoutType, setCheckoutType] = useState<'SHORT_TERM_CREDIT' | 'LONG_TERM_DEPOSIT'>('SHORT_TERM_CREDIT');
  const [handoffStep, setHandoffStep] = useState<'idle' | 'scanned_qr' | 'capturing_spine' | 'ready_to_transfer' | 'transferred'>('idle');
  const [stampUrl, setStampUrl] = useState<string>('');
  const [selectedPhysicalCopyId, setSelectedPhysicalCopyId] = useState<string>('QR-1002');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');
  const [actionErrorMsg, setActionErrorMsg] = useState<string>('');

  // Return Desk States
  const [returnPhysicalCopyId, setReturnPhysicalCopyId] = useState<string>('QR-1002');
  const [returnCondition, setReturnCondition] = useState<'in-hub' | 'lost' | 'damaged'>('in-hub');
  const [returnStatusMsg, setReturnStatusMsg] = useState<string>('');

  // Bounty Intake Desk States
  const [bountyIsbn, setBountyIsbn] = useState<string>('978-0130313583');
  const [donorStudentId, setDonorStudentId] = useState<string>('student_2');
  const [bountyStatusMsg, setBountyStatusMsg] = useState<string>('');

  // Sim Webhook parameters
  const [webhookType, setWebhookType] = useState<'PREMIUM_SUBSCRIPTION_ANNUAL' | 'LONG_TERM_LEASE_DEPOSIT'>('PREMIUM_SUBSCRIPTION_ANNUAL');
  const [webhookAmount, setWebhookAmount] = useState<number>(999);
  const [webhookStudentId, setWebhookStudentId] = useState<string>('student_unregistered');

  useEffect(() => {
    // Sync physical book selection to available physical copy whenever ISBN changes
    if (selectedBookIsbn === '978-1617294433') {
      setSelectedPhysicalCopyId('QR-1002');
    } else if (selectedBookIsbn === '978-0130313583') {
      setSelectedPhysicalCopyId('QR-1005');
    } else {
      setSelectedPhysicalCopyId('QR-1011');
    }
  }, [selectedBookIsbn]);

  // Handle Checkout Action Handoff
  const handleStartCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setHandoffStep('scanned_qr');
  };

  const handleCaptureSpineStamp = () => {
    setHandoffStep('capturing_spine');
    setIsCapturing(true);
  };

  const handleSimulateCaptureFinished = () => {
    setStampUrl("https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200");
    setHandoffStep('ready_to_transfer');
    setIsCapturing(false);
  };

  const handleApproveHandoffTransfer = async () => {
    try {
      setActionErrorMsg('');
      // In a real app, you would pass the physical copy ID to the backend for checkout.
      // E.g., await apiFetch(`/api/books/${selectedPhysicalCopyId}/checkout`, { method: 'POST', token: token || undefined });
      setHandoffStep('transferred');
      setActionSuccessMsg("Checkout recorded successfully via Kiosk API.");

      setTimeout(() => {
        setHandoffStep('idle');
        setStampUrl('');
      }, 5000);
    } catch (err: any) {
      setActionErrorMsg(err.message || "Failed to approve handoff. Available buffer exceeded or inactive card.");
      setHandoffStep('idle');
    }
  };

  // Handle Return Action
  const handleCompleteReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setReturnStatusMsg('');
      setActionErrorMsg('');
      // await apiFetch(`/api/books/${returnPhysicalCopyId}/return`, { method: 'POST', token: token || undefined });
      setReturnStatusMsg(`✔ Return processed for copy [${returnPhysicalCopyId}]. Condition saved: ${returnCondition.toUpperCase()}.`);
      setTimeout(() => setReturnStatusMsg(''), 5000);
    } catch (err: any) {
      setActionErrorMsg(err.message || "Return processing failed.");
    }
  };

  // Handle Bounty Intake Action
  const handleCompleteBountyIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBountyStatusMsg('');
      setActionErrorMsg('');
      // await apiFetch(`/api/hub/desk/intake`, { method: 'POST', body: JSON.stringify({ isbn: bountyIsbn, donorId: donorStudentId }), token: token || undefined });
      setBountyStatusMsg(`✔ Donor book intake processed! Student credit blocks and rewards restored successfully.`);
      setTimeout(() => setBountyStatusMsg(''), 5000);
    } catch (err: any) {
      setActionErrorMsg(err.message || "Intake registration failed.");
    }
  };

  // Handle Webhook Simulation
  const handleTriggerWebhook = async () => {
    try {
      setActionErrorMsg('');
      // await apiFetch(`/api/webhooks/simulate`, { method: 'POST', body: JSON.stringify({ type: webhookType, amount: webhookAmount, studentId: webhookStudentId }), token: token || undefined });
    } catch (err: any) {
      setActionErrorMsg("Webhook delivery failed: " + err.message);
    }
  };

  // Helper to find book title by ISBN
  const getBookTitle = (isbn: string) => {
    const b = books.find(item => item.isbn === isbn);
    return b ? b.title : "Syllabus Textbook Reference";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Overview Analytics Dashboard Matrix (Section 3) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Metric 1 */}
        <div className="bg-muted/50/40 border border-border 200/60 rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground/60 uppercase font-bold block">
              Total Assets Circulated
            </span>
            <h3 className="text-2xl font-mono font-extrabold text-foreground">
              {activeCheckoutsCount} Active
            </h3>
            <p className="text-[10.5px] text-muted-foreground font-sans leading-none">Across Partner Tech Libraries</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-950/40 border border-indigo-900/50 flex items-center justify-center text-primary shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Escrow Liabilities */}
        <div className="bg-muted/50/40 border border-border 200/60 rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground/60 uppercase font-bold block">
              Secure Escrow Float
            </span>
            <h3 className="text-2xl font-mono font-extrabold text-secondary">
              ₹{secureEscrowLiability.toLocaleString()}
            </h3>
            <p className="text-[11px] text-muted-foreground font-mono font-semibold">🔒 Collateral Separated</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/45 border border-emerald-900/40 flex items-center justify-center text-secondary shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Operating Revenue */}
        <div className="bg-muted/50/40 border border-border 200/60 rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground/60 uppercase font-bold block">
              Operating Capital Pool [V2]
            </span>
            <h3 className="text-2xl font-mono font-extrabold text-foreground">
              ₹{operatingRevenue.toLocaleString()}
            </h3>
            <p className="text-[10.5px] text-primary font-sans">Net Premium Annual Earnings</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-950/45 border border-primary/50 flex items-center justify-center text-primary shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

      </section>

      {/* Desk Operating Category Selector Tabs */}
      <div className="border-b border-border flex flex-wrap gap-1">
        {[
          { id: 'checkout', label: 'Book Handout', icon: QrCode },
          { id: 'return', label: 'Return Intake', icon: UserCheck },
          { id: 'bounty', label: 'Bounty Board Desk', icon: Layers },
          { id: 'finance', label: 'Ledger & Capital', icon: DollarSign },
          { id: 'telemetry', label: 'Poly-Fence Alerts', icon: ShieldAlert }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = deskTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setDeskTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-semibold flex items-center space-x-2 border-b-2 transition -mb-0.5 ${isActive
                  ? 'border-primary text-foreground bg-muted'
                  : 'border-transparent text-muted-foreground hover:text-foreground/90'
                }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Action Error Log Notification Toast */}
      {actionErrorMsg && (
        <div className="p-4 bg-red-950/20 border border-red-900/50 text-red-300 rounded-xl flex items-start space-x-2.5 text-xs font-mono">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* category tab container content */}
      <div className="bg-muted/50/10 border border-border rounded-2xl p-6">

        {/* CATEGORY A: KIOSK BOOK HANDOUT CHEKCOUT WORKSPACE */}
        {deskTab === 'checkout' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-sm font-bold text-foreground tracking-tight">Kiosk Book Handoff Desk</h2>
                <p className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Step-by-step physical-to-digital transfer compiler</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-primary/90 text-primary rounded-md border border-primary/80 font-bold uppercase shrink-0">
                LOCKED SCAN Workspace
              </span>
            </div>

            {handoffStep === 'idle' && (
              <form onSubmit={handleStartCheckout} className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                  {/* Select Student */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-muted-foreground/80 uppercase font-bold block">1. Select Target Student Card ID</label>
                    <select
                      value={studentSelectId}
                      onChange={(e) => setStudentSelectId(e.target.value)}
                      className="w-full bg-background border border-border 200/60 hover:border-border focus:border-zinc-650 rounded-xl px-3.5 py-2.5 text-muted-foreground focus:outline-none transition"
                    >
                      <option value="student_1">NEEV-ST-ishaan (Ishaan K. - Premium Active)</option>
                      <option value="student_2">NEEV-ST-sneha (Sneha V. - Premium Active)</option>
                      <option value="student_unregistered">NEEV-ST-kabir (Kabir S. - Sub Inactive)</option>
                    </select>
                  </div>

                  {/* Select Textbook Title */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-muted-foreground/80 uppercase font-bold block">2. Select Reference Textbook</label>
                    <select
                      value={selectedBookIsbn}
                      onChange={(e) => setSelectedBookIsbn(e.target.value)}
                      className="w-full bg-background border border-border 200/60 hover:border-border focus:border-zinc-650 rounded-xl px-3.5 py-2.5 text-muted-foreground focus:outline-none transition"
                    >
                      <option value="978-1617294433">Algorithms (CLRS) [₹1,200 retail cost]</option>
                      <option value="978-0130313583">Modern Operating Systems [₹1,500 retail cost]</option>
                      <option value="978-0201825954">Thermodynamics Ref [₹2,400 retail cost - Heavy Allocation]</option>
                    </select>
                  </div>

                  {/* Select Physical QR Copy ID */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-muted-foreground/80 uppercase font-bold block">3. Library Shelf QR code ID</label>
                    <select
                      value={selectedPhysicalCopyId}
                      onChange={(e) => setSelectedPhysicalCopyId(e.target.value)}
                      className="w-full bg-background border border-border 200/60 focus:outline-none px-3 py-2.5 text-muted-foreground font-mono"
                    >
                      <option value="QR-1002">QR-1002 (In-Hub Shelf B)</option>
                      <option value="QR-1003">QR-1003 (In-Hub Shelf B)</option>
                      <option value="QR-1005">QR-1005 (In-Hub Shelf B)</option>
                      <option value="QR-1011">QR-1011 (In-Hub Shelf C)</option>
                    </select>
                  </div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-muted-foreground/80 uppercase font-bold block">Checkout Mechanism Plan</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCheckoutType('SHORT_TERM_CREDIT')}
                        className={`p-2.5 border rounded-xl text-left transition ${checkoutType === 'SHORT_TERM_CREDIT'
                            ? 'bg-indigo-950/20 border-primary text-primary font-bold'
                            : 'bg-transparent border-border 200/60 text-muted-foreground hover:text-foreground/90'
                          }`}
                      >
                        <span className="block text-[11px]">Short-Term Credit</span>
                        <span className="block font-light text-[9px] text-muted-foreground/60 mt-1">Uses Elastic limit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCheckoutType('LONG_TERM_DEPOSIT')}
                        className={`p-2.5 border rounded-xl text-left transition ${checkoutType === 'LONG_TERM_DEPOSIT'
                            ? 'bg-amber-950/20 border-accent text-accent font-bold'
                            : 'bg-transparent border-border 200/60 text-muted-foreground hover:text-foreground/90'
                          }`}
                      >
                        <span className="block text-[11px]">Long-Term Lease Lease</span>
                        <span className="block font-light text-[9px] text-muted-foreground/60 mt-1">Requires Cash Lock</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end justify-end">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary text-xs font-bold text-foreground rounded-xl transition flex items-center justify-center space-x-2"
                    >
                      <QrCode className="w-4 h-4 shrink-0" />
                      <span>Scan & Handoff Space</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {handoffStep === 'scanned_qr' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 bg-background/60 border border-border rounded-xl flex justify-between items-start">
                  <div>
                    <span className="px-1.5 py-0.5 bg-primary/90 text-primary font-mono text-[9px] rounded font-bold uppercase">
                      Physical asset aligned
                    </span>
                    <h3 className="text-foreground text-sm font-bold mt-2 ">{getBookTitle(selectedBookIsbn)}</h3>
                    <p className="text-[11px] text-muted-foreground">Target copy unique ID: <span className="font-mono font-bold text-foreground/90">{selectedPhysicalCopyId}</span></p>
                  </div>
                  <div className="text-right text-[10px] font-mono text-muted-foreground/60">
                    <p>Student ID: {studentSelectId}</p>
                    <p>Plan option: {checkoutType.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="p-4 bg-amber-950/15 border border-amber-900/40 text-accent text-[11px] rounded-xl leading-relaxed flex items-start space-x-2.5">
                  <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <strong>MANDATORY DIGITAL CONDITION COVER STAMP:</strong> Campus operator rules require snapping one clear, verifiable condition cover photograph to lock physical textbook quality status prior to hand-off authorization.
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button onClick={() => setHandoffStep('idle')} className="text-xs font-bold text-muted-foreground/80 hover:text-foreground transition">Reset Process</button>
                  <button
                    onClick={handleCaptureSpineStamp}
                    className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-indigo-550 text-xs font-bold text-foreground rounded-xl shadow-lg transition flex items-center space-x-1.5 animate-pulse"
                  >
                    <Camera className="w-4 h-4 shrink-0" />
                    <span>Open Interactive Condition Camera</span>
                  </button>
                </div>
              </div>
            )}

            {handoffStep === 'capturing_spine' && (
              <div className="p-4 bg-background border border-border rounded-xl space-y-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between text-[9px] font-mono bg-muted/50 px-3 py-1.5 rounded text-muted-foreground">
                  <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 bg-destructive rounded-full animate-ping"></span><span>SENSOR_CAM LIVE PORT 3000 feed</span></span>
                  <span>MD5: 53a2_92bc</span>
                </div>
                <div className="aspect-[21/9] bg-muted/50 relative rounded-xl border border-border 200/60 overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-4 border border-dashed border-secondary/25 rounded"></div>
                  <div className="text-center font-mono text-[10px] text-muted-foreground/50 space-y-1">
                    <span className="text-secondary animate-pulse uppercase block">Textbook covers aligned on counter loadcell grid</span>
                    <span>Ready to save digital quality matrix</span>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button onClick={handleSimulateCaptureFinished} className="px-5 py-2 bg-secondary hover:bg-emerald-550 text-foreground font-bold rounded-lg text-xs flex items-center space-x-1.5">
                    <Camera className="w-4 h-4" />
                    <span>Register Condition Stamp (Grade A+)</span>
                  </button>
                </div>
              </div>
            )}

            {handoffStep === 'ready_to_transfer' && (
              <div className="p-4 bg-background/50 border border-border rounded-xl space-y-4 animate-in fade-in">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 bg-secondary/90 border border-secondary/20 text-secondary text-[9px] font-mono font-bold rounded uppercase">
                      Quality Stamp Registered
                    </span>
                    <h4 className="text-xs text-muted-foreground mt-2 font-mono">Grade A+ (Spotless textbook bindings verified)</h4>
                    <p className="text-[11px] text-muted-foreground/60">Asset physical collateral registers are compiled. Safe handoff is ready.</p>
                  </div>
                  <div className="w-16 h-12 rounded bg-muted/50 border border-border 200/60 overflow-hidden shrink-0">
                    <img src={stampUrl} alt="Condition verification" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button onClick={() => setHandoffStep('scanned_qr')} className="px-3 py-1.5 bg-muted/50 text-muted-foreground text-xs font-bold rounded-lg">Retake Cover Snapshot</button>
                  <button onClick={handleApproveHandoffTransfer} className="px-5 py-2.5 bg-secondary hover:bg-emerald-550 text-foreground text-xs font-bold rounded-xl flex items-center space-x-1">
                    <UserCheck className="w-4 h-4" />
                    <span>Approve Handoff Transfer</span>
                  </button>
                </div>
              </div>
            )}

            {handoffStep === 'transferred' && (
              <div className="p-6 bg-emerald-950/10 border border-emerald-900/30 rounded-xl text-center space-y-3 animate-in zoom-in-95">
                <div className="w-10 h-10 rounded-full bg-secondary/90 border border-emerald-850 flex items-center justify-center text-secondary mx-auto animate-bounce">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="text-foreground text-xs font-bold uppercase tracking-wider font-mono">Circulation Ownership Matrix Updated</h4>
                <p className="text-xs text-muted-foreground">{actionSuccessMsg}</p>
                <button onClick={() => setHandoffStep('idle')} className="px-4 py-1.5 bg-muted/50 hover:bg-zinc-850 text-muted-foreground font-bold text-[10px] rounded-lg">Accept next book</button>
              </div>
            )}

          </div>
        )}

        {/* CATEGORY B: RETURN INTAKE OPERATIONS DESK */}
        {deskTab === 'return' && (
          <form onSubmit={handleCompleteReturn} className="space-y-6 text-xs text-left">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground tracking-tight ">Kiosk Book Return Desk</h2>
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Verify barcodes, detect telemetry locks, and restore student limits</p>
            </div>

            {returnStatusMsg && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl text-secondary font-mono text-[11px] font-semibold">
                {returnStatusMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-muted-foreground/80 uppercase font-bold block">1. Enter Returning Physical Copy QR code ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. QR-1002"
                  value={returnPhysicalCopyId}
                  onChange={(e) => setReturnPhysicalCopyId(e.target.value)}
                  className="w-full bg-background border border-border 200/60 rounded-xl px-3.5 py-2.5 text-foreground/90 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-muted-foreground/80 uppercase font-bold block">2. Select Physical Textbook Condition Status</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value as any)}
                  className="w-full bg-background border border-border 200/60 rounded-xl px-3.5 py-2.5 text-muted-foreground focus:outline-none cursor-pointer"
                >
                  <option value="in-hub">Spotless (Clean and immediately restocked to shelf) [RESTORES CREDITS]</option>
                  <option value="lost">Lost (Deducts penalty, freezes student buffer limit) [LOCKS BUFFER]</option>
                  <option value="damaged">Severely Damaged (Requires repair, freezes buffer limit)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary text-foreground font-bold rounded-xl flex items-center justify-center space-x-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Submit Return Intake Process &rarr;</span>
              </button>
            </div>
          </form>
        )}

        {/* CATEGORY C: BOUNTY BOARD INTAKE OPERATOR DESK */}
        {deskTab === 'bounty' && (
          <div className="space-y-6 text-left text-xs">
            <div className="border-b border-border pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-foreground tracking-tight">Campus Bounty Board Intake</h2>
                <p className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Clear student lost penalty buffers by receiving donated/bartered references</p>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 bg-secondary/90 text-secondary border border-secondary/80 rounded font-bold uppercase">
                Active Bounties: {bountyBoard.length}
              </span>
            </div>

            {bountyStatusMsg && (
              <div className="p-3 bg-emerald-900/10 border border-emerald-800/40 rounded-xl text-secondary font-semibold mb-3">
                {bountyStatusMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

              {/* Left Form */}
              <form onSubmit={handleCompleteBountyIntake} className="md:col-span-1 space-y-4 bg-background p-5 rounded-2xl border border-border">
                <span className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest font-extrabold block">Bounty Intake Node</span>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-muted-foreground/80 uppercase block">Align Book ISBN / Barcode</label>
                  <select
                    value={bountyIsbn}
                    onChange={(e) => setBountyIsbn(e.target.value)}
                    className="w-full bg-muted/50 border border-border 200/60 rounded-lg p-2 text-muted-foreground outline-none"
                  >
                    {bountyBoard.map((item, idx) => (
                      <option key={idx} value={item.isbn}>{item.title} ({item.department})</option>
                    ))}
                    <option value="978-0130313583">Modern Operating Systems (CS)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-muted-foreground/80 uppercase block">Donor Student ID (Penalized Card)</label>
                  <select
                    value={donorStudentId}
                    onChange={(e) => setDonorStudentId(e.target.value)}
                    className="w-full bg-muted/50 border border-border 200/60 rounded-lg p-2 text-muted-foreground outline-none"
                  >
                    <option value="student_unregistered">Kabir S. (NEEV-ST-kabir - Buffer Inactive)</option>
                    <option value="student_2">Sneha V. (NEEV-ST-sneha)</option>
                    <option value="student_1">Ishaan K. (NEEV-ST-ishaan)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-secondary hover:bg-emerald-550 text-foreground font-bold rounded-xl tracking-wider uppercase transition text-[10.5px] mt-1"
                >
                  Verify Bounty Intake & Clear Blocks
                </button>
              </form>

              {/* Right list of upvoted requested books */}
              <div className="md:col-span-2 space-y-3">
                <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest font-bold block">Current High-Demand Requested Books (Bounty Board Threshold)</span>

                <div className="space-y-2.5">
                  {bountyBoard?.slice(0, 5).map((b, idx) => (
                    <div key={idx} className="bg-background p-3.5 rounded-xl border border-border flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-foreground/90 font-bold text-xs">{b.title}</h4>
                        <div className="flex items-center space-x-2 text-[10px] font-mono text-muted-foreground/60">
                          <span className="text-muted-foreground/80">{b.department}</span>
                          <span>•</span>
                          <span>Upvotes: <strong className="text-primary">{b.currentUpvotes} / {b.thresholdRequired}</strong></span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-muted/50 border border-border 200/60 text-[10px] font-mono text-primary rounded-lg uppercase">
                        {b.currentUpvotes >= b.thresholdRequired ? '🎯 BOUNTY LIVE' : '⌛ GATHERING UPVOTES'}
                      </span>
                    </div>
                  ))}
                  {(!bountyBoard || bountyBoard.length === 0) && (
                    <p className="text-muted-foreground/50 text-xs italic">No requested items have hit threshold requirements yet. Upvotes active.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* CATEGORY D: FINANCIAL LEDGER & STRIPE/RAZORPAY WEBHOOK SIMULATOR */}
        {deskTab === 'finance' && (
          <div className="space-y-6 text-left text-xs">
            <div className="border-b border-border pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-foreground tracking-tight">Financial Ledger Cockpit [V2 Strict Segmenter]</h2>
                <p className="text-[10px] font-mono text-muted-foreground/50 uppercase font-semibold">Operating profits vs Secure Escrow refund pools audited programmatic ledger</p>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 bg-primary/90 border border-primary/80 text-blue-300 rounded font-bold uppercase">
                GAAP COMPLIANT AUDIT
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* Webhook Form */}
                <div className="lg:col-span-1 bg-background border border-border p-5 rounded-2xl space-y-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest font-bold block">Developer Webhook Simulator</span>
                    <p className="text-[11px] text-muted-foreground/80 font-sans leading-relaxed">
                      Trigger Simulated Razorpay/Stripe payments. High-frequency algorithms immediately direct capital according to V2 strict splits: Operating Revenue vs Refundable Deposits Escrow.
                    </p>
                  </div>

                  <div className="p-4 bg-muted border border-border rounded-lg text-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Webhook Simulation Disabled</p>
                    <p className="text-[10px] text-muted-foreground mt-1">This demo component has been removed in production. Use real financial integrations.</p>
                  </div>
                </div>

              {/* Transactions Ledger View */}
              <div className="lg:col-span-2 space-y-3.5">
                <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest font-extrabold block">Live Transaction Ledger Records</span>

                <div className="bg-background border border-border rounded-2xl overflow-hidden font-mono text-[10.5px]">
                  <div className="bg-muted/50 px-4 py-2 text-muted-foreground font-bold grid grid-cols-12 gap-2 border-b border-border 200/60">
                    <span className="col-span-3">TIMESTAMP</span>
                    <span className="col-span-4">EVENT CATEGORY</span>
                    <span className="col-span-3">STUDENT</span>
                    <span className="col-span-2 text-right">VALUE</span>
                  </div>

                  <div className="divide-y divide-zinc-900 max-h-[220px] overflow-y-auto">
                    {financialLogs?.map((log, idx) => (
                      <div key={idx} className="px-4 py-2.5 grid grid-cols-12 gap-2 text-muted-foreground hover:bg-muted/50/40">
                        <span className="col-span-3 text-muted-foreground/60">{log.timestamp.slice(11, 19)}</span>
                        <span className="col-span-4 flex items-center space-x-1.5 font-bold">
                          <span className={`w-1.5 h-1.5 rounded-full ${log.category === 'OPERATIONAL_REVENUE_ANNUAL' ? 'bg-primary' : 'bg-secondary'}`} />
                          <span className="truncate">{log.category.replace('_', ' ')}</span>
                        </span>
                        <span className="col-span-3 text-muted-foreground/80 truncate">{log.clientId}</span>
                        <span className={`col-span-2 text-right font-extrabold pb-0.5 ${log.category === 'OPERATIONAL_REVENUE_ANNUAL' ? 'text-foreground/90' : 'text-secondary'}`}>
                          ₹{log.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {(!financialLogs || financialLogs.length === 0) && (
                      <p className="p-4 text-center text-muted-foreground/50 italic font-sans text-xs">No ledger transfers processed yet. Use trigger webhook simulator on side.</p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* CATEGORY E: GEOFENCE COORDINATE VIOLATIONS TELEMETRY LOGS */}
        {deskTab === 'telemetry' && (
          <div className="space-y-6 text-left text-xs">
            <div className="border-b border-border pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-foreground tracking-tight">Geofence Poly-Fence Monitor Console</h2>
                <p className="text-[10px] font-mono text-muted-foreground/50 uppercase font-semibold">Strict real-time tracking of in-facility assets and coordinate fences</p>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 bg-red-950 border border-red-900 text-destructive rounded font-bold uppercase">
                AUTOMATED SECTOR INTERCEPTOR
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

              {/* Telemetry map graphic */}
              <div className="bg-background p-5 rounded-2xl border border-border space-y-4">
                <span className="text-[10px] font-mono text-muted-foreground/50 uppercase block font-bold">Library Sector Poly-fence Grid Layout</span>

                <div className="aspect-[16/10] bg-muted/50/60 border border-border 200/60 rounded-xl relative overflow-hidden flex items-center justify-center">

                  {/* Safety Boundary polygon line visual */}
                  <div className="absolute inset-10 border border-secondary/30 rounded flex items-center justify-center bg-emerald-900/5">
                    <span className="text-[9px] font-mono text-secondary/80 uppercase font-bold tracking-widest text-[8px]">
                      APPROVED FACILITY BOUNDARY (10% - 90%)
                    </span>
                  </div>

                  {/* Dot placement representing a simulated coordinate breach */}
                  <div className="absolute top-[20%] left-[85%] w-3 h-3 bg-destructive rounded-full animate-ping pointer-events-none"></div>
                  <div className="absolute top-[20%] left-[85%] w-2 h-2 bg-destructive rounded-full pointer-events-none"></div>

                  <span className="absolute top-[12%] left-[78%] text-[8px] font-mono bg-red-950 border border-red-900 text-destructive p-1 rounded font-bold">
                    BREACH WARNING: student_1 (QR-1002)
                  </span>
                </div>
              </div>

              {/* Live Violation logs */}
              <div className="space-y-3 font-mono text-[10.5px]">
                <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest font-extrabold block">Breach Exception Incident Registry</span>

                <div className="bg-background border border-border rounded-2xl divide-y divide-zinc-900">
                  {violations?.map((v, idx) => (
                    <div key={idx} className="p-3.5 space-y-1.5 text-muted-foreground hover:bg-muted/50/30">
                      <div className="flex justify-between items-center">
                        <span className="text-destructive font-extrabold flex items-center space-x-1">
                          <Ban className="w-3 h-0.5" />
                          <span>FENCE EXCEPTION VIOLATION</span>
                        </span>
                        <span className="text-muted-foreground/50 text-[9px]">{new Date(v.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-muted-foreground font-sans leading-relaxed text-[11px]">{v.details}</p>
                      <div className="flex justify-between text-[9px] text-muted-foreground/60">
                        <span>Coordinates: x:{v.coords.x}% y:{v.coords.y}%</span>
                        <span className="bg-red-950/40 text-destructive font-bold border border-red-900/20 px-1 rounded uppercase">Logged to registry</span>
                      </div>
                    </div>
                  ))}
                  {(!violations || violations.length === 0) && (
                    <div className="p-4 text-center font-sans text-muted-foreground/50 italic text-xs">
                      All systems green. No active coordinates breaching policy parameters.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Persistent Live RFID Activity Log stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-muted/50/40 border border-border 200/60 rounded-2xl p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-primary" />
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight">Capacitance Spine & RFID Stream</h3>
                <p className="text-[10px] font-mono text-muted-foreground/60 uppercase font-semibold">Active telemetry signals emitted by Hub Desk Counter</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-background text-primary border border-border rounded font-bold uppercase shrink-0">
              LOAD CELL LIVE FEED
            </span>
          </div>

          <div className="divide-y divide-zinc-900 max-h-[180px] overflow-y-auto">
            {rfidEvents?.map((evt, index) => (
              <div key={index} className="py-2.5 flex justify-between items-start text-[11px] hover:bg-muted/50/20 px-1">
                <div className="space-y-1 flex-1 pr-3">
                  <div className="flex items-center space-x-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${evt.type === 'kiosk_checkout' ? 'bg-primary' : evt.type === 'kiosk_checkin' ? 'bg-secondary' : 'bg-zinc-400'
                      }`} />
                    <span className="font-bold text-foreground/90">{evt.bookTitle}</span>
                    <span className="text-zinc-650">•</span>
                    <span className="text-muted-foreground/60 font-mono text-[10px]">{evt.userMeta}</span>
                  </div>
                  <p className="text-[10.5px] text-zinc-405 font-light">{evt.details}</p>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase shrink-0">{evt.timestamp}</span>
              </div>
            ))}
            {(!rfidEvents || rfidEvents.length === 0) && (
              <p className="text-center italic text-muted-foreground/60 text-xs py-4">No events in telemetry queue.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeevCollegeDashboard;
