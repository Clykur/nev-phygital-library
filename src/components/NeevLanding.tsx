'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  ArrowRight,
  Lock,
  MapPin,
  School,
  Radio,
  Layers,
  Cpu,
  Award,
  ShieldCheck,
  Sparkles,
  CheckCircle,
  ScanLine,
  Check,
  ChevronDown,
  Calendar,
  Building,
  User,
  ChevronRight,
  Info,
  ShieldAlert,
  Key,
  RefreshCw,
  CreditCard,
  Badge
} from 'lucide-react';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';

interface NeevLandingProps {
  onLogin: (email: string, password?: string, isGoogleAuth?: boolean) => void;
  onGoogleLogin: (token: string, extra?: { accountType?: string, hubLocation?: string, hubName?: string, hubKind?: string }) => void;
  onSignUp: (name: string, email: string, isPremium: boolean, hubLocationId: string, password?: string, role?: string, hubName?: string, hubKind?: string) => void;
  addXp: (amount: number) => void;
  activeSegment: 'students' | 'colleges';
  setActiveSegment: (segment: 'students' | 'colleges') => void;
}

interface Textbook {
  id: string;
  title: string;
  author: string;
  code: string;
  subject: string;
  copiesTotal: number;
  copiesAvailable: number;
  coverColor: string;
}

export const NeevLanding: React.FC<NeevLandingProps> = ({ onLogin, onGoogleLogin, onSignUp, addXp, activeSegment, setActiveSegment }) => {
  // Interactive infographics simulator states
  const [activeSimulationStep, setActiveSimulationStep] = useState<number>(1);
  const [simCredits, setSimCredits] = useState<number>(3800); // default reflecting 1 book borrowed
  const [simCheckedBooks, setSimCheckedBooks] = useState<Array<{ id: string; title: string; code: string; weight: number; color: string }>>([
    { id: 'sb1', title: 'Fundamentals of Thermodynamics', code: 'ME-301', weight: 1200, color: 'from-accent to-amber-950' }
  ]);

  const simulationCatalog = [
    { id: 'sb1', title: 'Fundamentals of Thermodynamics', code: 'ME-301', weight: 1200, color: 'from-accent to-amber-950' },
    { id: 'sb2', title: 'Introduction to Algorithms', code: 'CS-402', weight: 2000, color: 'from-primary to-indigo-950' },
    { id: 'sb3', title: 'Modern Operating Systems', code: 'CS-501', weight: 1300, color: 'from-violet-600 to-violet-950' },
    { id: 'sb4', title: 'Principles of Electromagnetics', code: 'EE-502', weight: 1500, color: 'from-secondary to-emerald-950' },
  ];

  // Student Login fields state
  const [studentRoll, setStudentRoll] = useState('');
  const [studentPass, setStudentPass] = useState('');

  // College Login fields state
  const [collegeCampus, setCollegeCampus] = useState('');
  const [collegePass, setCollegePass] = useState('');

  // FAQ Accordion tracker
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Instutitional Appointment Selector form state
  const [consultationSubmitted, setConsultationSubmitted] = useState(false);
  const [clientInstitution, setClientInstitution] = useState('');
  const [clientTime, setClientTime] = useState('2026-05-27T10:00');
  const [clientEmail, setClientEmail] = useState('');

  // Local interaction states
  const [rfidActiveSim, setRfidActiveSim] = useState(false);
  const [rfidInfo, setRfidInfo] = useState<string | null>(null);

  // Anchor scroll ref
  const authSectionRef = useRef<HTMLDivElement>(null);
  const collegeAuthSectionRef = useRef<HTMLDivElement>(null);

  const [collegeAuthTab, setCollegeAuthTab] = useState<'login' | 'signup'>('login');
  const [collegeEmail, setCollegeEmail] = useState('');
  const [collegePassword, setCollegePassword] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [collegeBranch, setCollegeBranch] = useState('RVCE-BLR');
  const [collegeRole, setCollegeRole] = useState<'college_ambassador' | 'admin'>('college_ambassador');

  const scrollToCollegeAuth = () => {
    collegeAuthSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    addXp(15);
  };

  const scrollToAuth = () => {
    authSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    addXp(10);
  };

  // Simulated live RFID chip tester which captures visitor's attention & curiosity
  const handleSimulateSensorTouch = (bookTitle: string, rfidCode: string) => {
    setRfidActiveSim(true);
    setRfidInfo(`Spine Tag matched [UHF-RFID-${rfidCode}] authenticated on Reader R1-Desk 4. Shelf route synchronized...`);
    addXp(30);
    setTimeout(() => {
      setRfidActiveSim(false);
    }, 4500);
  };

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Tab control inside auth section
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');

  // Sign up fields
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpBranch, setSignUpBranch] = useState('RVCE-BLR');
  const [signUpPremium, setSignUpPremium] = useState(true);

  // Google Authenticater simulations
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [showGoogleCustomInput, setShowGoogleCustomInput] = useState(false);
  const [customGoogleAccounts, setCustomGoogleAccounts] = useState<{ name: string; email: string; avatar: string }[]>(() => {
    try {
      const saved = localStorage.getItem("neev_custom_google_accounts");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const registerCustomGoogleAccount = (email: string, name: string) => {
    if (!email) return;
    const cleaned = email.trim().toLowerCase();
    const isDefault = ["nemalekrishnavamsi@gmail.com", "krishnavamsi.n@srujanavani.org", "mihostelss@gmail.com", "sharma.ambassador@neev.in", "admin@neev.in"].includes(cleaned);
    if (isDefault) return;

    setCustomGoogleAccounts(prev => {
      if (prev.some(a => a.email.toLowerCase() === cleaned)) return prev;
      const updated = [...prev, { name: name || cleaned.split('@')[0], email: cleaned, avatar: (name || cleaned).slice(0, 2).toUpperCase() }];
      try {
        localStorage.setItem("neev_custom_google_accounts", JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });
  };

  // Accountability and High Protection 2FA States
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [pendingLogin, setPendingLogin] = useState<{ email: string; password?: string; isGoogle?: boolean } | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [otpSentCode, setOtpSentCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpResending, setOtpResending] = useState(false);

  const initiateSecureLogin = (email: string, password?: string, isGoogle?: boolean) => {
    onLogin(email, password, isGoogle);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingLogin) return;

    if (otpValue.trim() === otpSentCode) {
      setShowOtpScreen(false);
      addXp(150);
      onLogin(pendingLogin.email, pendingLogin.password, pendingLogin.isGoogle);
    } else {
      setOtpError("Security check failed: Incorrect session passcode pattern entered.");
      addXp(-10);
    }
  };

  const handleEmailFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;
    initiateSecureLogin(loginEmail.trim().toLowerCase(), loginPassword);
  };

  const handleSignUpFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim() || !signUpEmail.trim()) return;
    onSignUp(signUpName.trim(), signUpEmail.trim().toLowerCase(), signUpPremium, signUpBranch, signUpPassword);
  };

  const triggerGoogleAuthSimulation = () => {
    setShowGoogleModal(true);
    setShowGoogleCustomInput(false);
    setGoogleCustomEmail('');
    addXp(20);
  };

  const handleSelectGoogleAccount = (gEmail: string, gName: string) => {
    registerCustomGoogleAccount(gEmail, gName);
    setShowGoogleModal(false);
    setGoogleLoading(true);
    addXp(100);
    setTimeout(() => {
      setGoogleLoading(false);
      initiateSecureLogin(gEmail, undefined, true);
    }, 1200);
  };

  const handleCredentialResponse = (response: any) => {
    try {
      setGoogleLoading(true);
      const token = response.credential;
      // Decode JWT payload token securely without third-party libraries:
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      const email = payload.email;
      const name = payload.name || email.split('@')[0];

      registerCustomGoogleAccount(email, name);
      setShowGoogleModal(false);
      setGoogleLoading(false);
      setTimeout(() => {
        initiateSecureLogin(email, undefined, true);
      }, 120);
    } catch (err) {
      console.error("Official Google token parse rejected", err);
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    // Keep empty dependency or remove entirely if nothing else is inside
  }, [showGoogleModal, showGoogleCustomInput]);

  const trendBooks: Textbook[] = [
    { id: 't1', title: 'Fundamentals of Thermodynamics', author: 'Claus Borgnakke & Richard E. Sonntag', code: 'ME-301', subject: 'Mechanical engineering', copiesTotal: 18, copiesAvailable: 14, coverColor: 'from-accent to-amber-950' },
    { id: 't2', title: 'Introduction to Algorithms (CLRS)', author: 'Thomas H. Cormen, Charles E. Leiserson', code: 'CS-402', subject: 'Computer Science', copiesTotal: 25, copiesAvailable: 8, coverColor: 'from-primary to-slate-950' },
    { id: 't3', title: 'Discrete Mathematics and Applications', author: 'Kenneth H. Rosen', code: 'CS-304', subject: 'Computational Structures', copiesTotal: 15, copiesAvailable: 0, coverColor: 'from-primary to-zinc-950' },
    { id: 't4', title: 'Principles of Electromagnetics', author: 'Matthew N. O. Sadiku', code: 'EE-502', subject: 'Electronics & Communication', copiesTotal: 12, copiesAvailable: 3, coverColor: 'from-secondary to-emerald-950' },
    { id: 't5', title: 'Modern Operating Systems', author: 'Andrew S. Tanenbaum', code: 'CS-501', subject: 'Computer Systems', copiesTotal: 20, copiesAvailable: 11, coverColor: 'from-violet-600 to-violet-950' },
    { id: 't6', title: 'Structural Mechanics: Analysis & Design', author: 'S. B. Junnarkar', code: 'CE-401', subject: 'Civil Engineering', copiesTotal: 10, copiesAvailable: 5, coverColor: 'from-destructive to-rose-950' },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
    addXp(5);
  };

  const handleConsultationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientInstitution || !clientEmail) return;
    setConsultationSubmitted(true);
    addXp(50);
  };

  // Institution admin registration form state
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('college');
  const [country, setCountry] = useState('India');
  const [adminState, setAdminState] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [adminRole, setAdminRole] = useState('super_admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <div className="space-y-5 py-1 animate-in fade-in duration-700 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* Dynamic Segment Switcher Pill (Capsule) */}
      <div className="flex justify-center select-none">
        <div className="inline-flex items-center p-1 bg-background/65 border border-border/60 rounded-2xl shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              setActiveSegment('students');
              addXp(15);
            }}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold font-sans tracking-wide transition-all duration-300 ${activeSegment === 'students'
              ? 'bg-muted/50 border border-border/60 text-foreground shadow-xl scale-100'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50/30'
              }`}
          >
            <User className="w-4 h-4 shrink-0 text-foreground" />
            <span>Student Portal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSegment('colleges');
              addXp(15);
            }}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold font-sans tracking-wide transition-all duration-300 ${activeSegment === 'colleges'
              ? 'bg-muted/50 border border-border/60 text-foreground shadow-xl scale-100'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50/30'
              }`}
          >
            <School className="w-4 h-4 shrink-0 text-foreground" />
            <span>Colleges & Institutes</span>
          </button>
        </div>
      </div>

      {activeSegment === 'students' ? (
        /* ==================== PHASE 1: STUDENTS HOMEPAGE ==================== */
        <div className="space-y-20 animate-in fade-in duration-500">

          {/* Single Clean Hero Section */}
          <section className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8 pt-12 pb-8">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-muted/50 border border-border">
              <span className="text-xs font-medium text-foreground">Premium Academic Platform</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-foreground leading-tight">
              Your Campus Textbooks. <br className="hidden sm:block" />
              <span className="text-muted-foreground">Instantly on Your Shelf.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              No shipping delays. No screen fatigue. Access thousands of premium engineering and technical reference books directly from the Neev Smart Hub inside your college library.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={scrollToAuth}
                className="px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-md transition-colors w-full sm:w-auto shadow-sm"
              >
                Join Premium — ₹999/Yr
              </button>
              <button
                onClick={() => {
                  document.getElementById('inventory-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-surface hover:bg-muted text-foreground border border-border font-medium rounded-md transition-colors w-full sm:w-auto shadow-sm"
              >
                Explore Features
              </button>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-8 text-sm text-muted-foreground font-medium">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                <span>Instant verification</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                <span>No security deposits</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                <span>18+ Campus Hubs</span>
              </div>
            </div>
          </section>

          {/* Block 3: Categorized Discovery Cards */}
          <section id="inventory-section" className="space-y-10 scroll-mt-20 pt-10">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Automated Operations</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Flawless Asset Flow.</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Circulate physical course materials with complete digital precision.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {/* Card 1 — The Request Loop */}
              <div className="p-6 bg-surface border border-border rounded-xl space-y-4 hover:border-border hover:shadow-sm transition-all group">
                <div className="mb-2 flex items-center">
                  <Layers className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <span className="caption-scale font-semibold uppercase text-muted-foreground block">01 / Replenishment</span>
                  <h3 className="h4-scale text-foreground">Live Campus Bounties</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Don't need your previous semester textbooks? Upload them to the Hub. When a peer needs it, the Hub requests it and you earn credits to access your own semester requirements.
                  </p>
                </div>
              </div>

              {/* Card 2 — Hub Validation */}
              <div className="p-6 bg-surface border border-border rounded-xl space-y-4 hover:border-border hover:shadow-sm transition-all group">
                <div className="mb-2 flex items-center">
                  <Cpu className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <span className="caption-scale font-semibold uppercase text-muted-foreground block">02 / Authentication</span>
                  <h3 className="h4-scale text-foreground">UHF-RFID Secured Scans</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Books are embedded with stealth RFID circuits. To check out, you simply place the item on the Hub scanner and tap your College ID card. 200ms authorization.
                  </p>
                </div>
              </div>

              {/* Card 3 — Elastic Economy */}
              <div className="p-6 bg-surface border border-border rounded-xl space-y-4 hover:border-border hover:shadow-sm transition-all group">
                <div className="mb-2 flex items-center">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <span className="caption-scale font-semibold uppercase text-muted-foreground block">03 / Utility Ledger</span>
                  <h3 className="h4-scale text-foreground">Elastic Credit Engine</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your account is staked with a ₹5,000 credit bar. A book temporarily freezes portion of the bar as collateral. Returning the item instantly restores your full buffer.
                  </p>
                </div>
              </div>
            </div>

            {/* High-Visibility text container: The 'Unlimited In-Library' Growth Engine */}
            <div className="mt-8 p-6 bg-muted border border-border rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-slate-200 text-foreground font-bold font-mono caption-scale rounded uppercase tracking-wider">Growth Engine</span>
                  <span className="text-xs text-success font-medium">&bull; Dean's Pilot Favorite</span>
                </div>
                <h4 className="h5-scale text-foreground tracking-tight">Exhausted your credits? Read unlimited in-hub.</h4>
                <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
                  A student can read any technical reference textbook or handbook in our entire catalog completely free with <strong>zero credit deductions</strong>—as long as they remain inside the physical library building.
                </p>
              </div>
              <div className="shrink-0">
                <div className="px-4 py-3 bg-surface border border-border rounded-lg text-center">
                  <div className="text-xs font-medium text-muted-foreground">CREDIT COST</div>
                  <div className="h5-scale text-success uppercase">₹0 Free</div>
                </div>
              </div>
            </div>
          </section>

          {/* Block 4: "Trending at your hubs" Physical Carousel */}
          <section className="space-y-8 bg-muted/50/10 border border-border/80 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
              <div className="space-y-1">
                <span className="caption-scale font-mono tracking-widest text-primary font-bold uppercase">LIVE SHELF ACTIVITY</span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-foreground">Trending at your hubs</h3>
              </div>
              <p className="text-xs font-mono text-muted-foreground/50 sm:max-w-xs text-left sm:text-right">
                Press any syllabus text block to trigger a simulated weight-capacitive spine scan.
              </p>
            </div>

            {/* Dynamic Sliding Grid representation with standard engineering textbooks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendBooks.map((book) => {
                const isAvailable = book.copiesAvailable > 0;
                return (
                  <div
                    key={book.id}
                    className="p-4 bg-background border border-border rounded-xl text-left relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 bg-primary/[0.01] rounded-full"></div>

                    <div className="flex gap-3 items-center">
                      {/* Premium textured simulated digital reference book cover scan mockup */}
                      <div className={`w-14 h-20 rounded bg-gradient-to-br ${book.coverColor} shrink-0 shadow-2xl border border-white/10 p-1.5 flex flex-col justify-between text-foreground relative overflow-hidden select-none`}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-surface/20"></div>
                        <div className="text-[6px] font-mono opacity-80 uppercase tracking-tighter truncate leading-none">{book.code}</div>
                        <div className="text-[8px] leading-[1.1] font-extrabold tracking-tight line-clamp-3 uppercase font-sans mt-0.5">{book.title}</div>
                        <div className="text-[5px] font-mono opacity-70 truncate text-foreground/80 mt-auto">{book.author}</div>
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <span className="caption-scale font-mono font-bold text-muted-foreground/60 uppercase tracking-widest block">{book.code} • {book.subject}</span>
                        <h4 className="text-xs font-semibold text-foreground/90 truncate max-w-[200px]" title={book.title}>
                          {book.title}
                        </h4>
                        <p className="caption-scale text-muted-foreground/80 truncate font-light">{book.author}</p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-border/60 pt-2 flex items-center justify-between caption-scale font-mono">
                      <span className="text-muted-foreground/60">Hub Status</span>
                      {isAvailable ? (
                        <span className="text-secondary flex items-center font-semibold">
                          <span className="mr-1.5 text-secondary">●</span>
                          {book.copiesAvailable} Copies Ready at Hub
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60 flex items-center">
                          <span className="mr-1.5 text-muted-foreground">○</span>
                          Checked Out
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Micro display response sandbox integration */}
            {rfidInfo && (
              <div className="bg-background border border-border rounded-xl p-3.5 font-mono text-xs flex items-center space-x-3 text-primary animate-in fade-in slide-in-from-bottom-2 duration-300">
                <ScanLine className="w-4 h-4 text-indigo-455 shrink-0 animate-pulse" />
                <span className="text-muted-foreground leading-relaxed caption-scale">{rfidInfo}</span>
              </div>
            )}
          </section>

          {/* Block 5: Interactive Visual Infographics - Circular Book Economy */}
          <section id="about-section" className="space-y-12 pt-6 scroll-mt-20 animate-in fade-in duration-500">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <span className="caption-scale uppercase font-mono tracking-widest text-info font-bold">Interactive Infographics</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">The Circular Book Economy, Decoded</h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-light">
                We replace long policy documents with a real-time interactive game rules simulation. Click, borrow, and return simulated books to watch credit flow loops work!
              </p>
            </div>

            {/* FLOW PIPELINE LAYOUT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  step: 1,
                  title: "1. The 5,000 Credit Buffer",
                  desc: "Every Premium account gets an instant 5,000 credit bar. High-cost physical books are checked out against this capacity, requiring ZERO cash security deposits.",
                  icon: <Layers className="w-4 h-4 text-secondary" />
                },
                {
                  step: 2,
                  title: "2. Offline Tactile Study",
                  desc: "Take textbooks home to study directly page-by-page. Learn with native paper typography, zero screen fatigue, and perfect focus during end-semester exams.",
                  icon: <BookOpen className="w-4 h-4 text-primary" />
                },
                {
                  step: 3,
                  title: "3. Rapid Replenishment Loop",
                  desc: "Slide the textbook back into your library Hub counter. High-speed feedback instantly refuels your credit capacity so you can get your next volume.",
                  icon: <Cpu className="w-4 h-4 text-accent" />
                },
                {
                  step: 4,
                  title: "4. The Library Loophole",
                  desc: "Exhausted your home limit? You can still scan and read any textbook on physical tables for free with zero credit deductions—as long as you study inside library walls.",
                  icon: <Sparkles className="w-4 h-4 text-accent" />
                }
              ].map((flowStep) => (
                <button
                  type="button"
                  key={flowStep.step}
                  onClick={() => {
                    setActiveSimulationStep(flowStep.step);
                    addXp(10);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all duration-350 relative overflow-hidden group ${activeSimulationStep === flowStep.step
                    ? 'bg-muted/50 border-primary/85 shadow-[0_0_15px_rgba(92,92,241,0.15)]'
                    : 'bg-zinc-90/20 border-border hover:border-border/60'
                    }`}
                >
                  {activeSimulationStep === flowStep.step && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-background rounded-lg group-hover:scale-110 transition-transform text-primary">
                      {flowStep.icon}
                    </div>
                    <span className="caption-scale font-mono text-foreground-subtle font-bold">INFO BLOCK 0{flowStep.step}</span>
                  </div>
                  <h4 className={`text-xs font-semibold  transition-colors ${activeSimulationStep === flowStep.step ? 'text-primary' : 'text-muted-foreground'}`}>
                    {flowStep.title}
                  </h4>
                  <p className="caption-scale text-muted-foreground/80 leading-relaxed font-light mt-1.5 font-sans">
                    {flowStep.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* LIVE SIMULATOR SYSTEM */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4 select-none">

              {/* Left Sandbox Column: Credit & Wallet Status */}
              <div className="lg:col-span-6 bg-background border border-border p-6 rounded-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-48 h-48 bg-primary/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                {/* Header */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    <span className="caption-scale font-mono text-primary uppercase font-bold tracking-widest">LIVE PLAYGROUND INFOGRAPHIC</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground ">Simulated Student Wallet</h3>
                  <p className="caption-scale text-muted-foreground/80 font-light">
                    Observe how your credit limit behaves as you borrow and return syllabus textbooks underneath the ₹999/year subscription plan.
                  </p>
                </div>

                {/* The Gauge */}
                <div className="p-4 bg-muted/50/60 rounded-xl border border-border/80 space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5 text-left">
                      <span className="caption-scale font-mono text-muted-foreground/60 uppercase">Available Cash-Free Credit Buffer:</span>
                      <div className="h5-scale font-mono text-foreground tracking-tight">
                        ₹{simCredits.toLocaleString()} <span className="text-xs text-muted-foreground/60 font-light font-sans">/ ₹5,000 Total Limit</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="caption-scale font-mono text-primary font-bold uppercase block">Buffer Utilization:</span>
                      <span className="text-xs font-semibold font-mono text-foreground/90">
                        {Math.round(((5000 - simCredits) / 5000) * 100)}% Used
                      </span>
                    </div>
                  </div>

                  {/* Gradient Progress Bar */}
                  <div className="h-2.5 bg-background rounded-full overflow-hidden border border-border/60 p-[2px]">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-secondary via-primary to-primary"
                      style={{ width: `${(simCredits / 5000) * 100}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center caption-scale font-mono text-muted-foreground/50">
                    <span className="inline-flex items-center gap-1"><CreditCard className="w-3 h-3" /> Buffer Expended: ₹{(5000 - simCredits).toLocaleString()}</span>
                    <span className="inline-flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Fully Restored: ₹5,000 Max Capacity</span>
                  </div>
                </div>

                {/* Active in-hand library stack */}
                <div className="space-y-2.5">
                  <span className="caption-scale font-mono text-muted-foreground font-bold uppercase tracking-wider block text-left">Currently Checked-Out (Offline Studymode):</span>
                  {simCheckedBooks.length === 0 ? (
                    <div className="p-5 text-center bg-muted/50/40 rounded-xl border border-dashed border-border text-muted-foreground/60 text-xs py-8 font-sans">
                      Your hand is empty! Try clicking on any textbook on the right library shelf to reserve it cash-free.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {simCheckedBooks.map((b) => (
                        <div key={b.id} className="p-3 bg-zinc-90 w-full border border-border rounded-xl flex items-center justify-between group animate-in zoom-in-95 duration-250">
                          <div className="space-y-0.5 truncate max-w-[150px] text-left">
                            <h5 className="caption-scale font-bold text-foreground/90 truncate">{b.title}</h5>
                            <div className="flex items-center space-x-1.5 font-mono caption-scale text-muted-foreground/60">
                              <span>Weight: {b.weight} Credits</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSimCheckedBooks(prev => prev.filter(item => item.id !== b.id));
                              setSimCredits(prev => prev + b.weight);
                              addXp(30);
                            }}
                            className="caption-scale px-2.5 py-1.5 bg-background border border-border/60 rounded-lg hover:bg-muted transition text-primary font-bold font-mono uppercase"
                          >
                            Return
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Simulated Telemetry log */}
                <div className="p-2.5 bg-primary/5 text-indigo-305 font-mono caption-scale rounded-lg border border-indigo-900/40 flex items-center gap-2">
                  <Radio className="w-3 h-3 text-primary shrink-0 animate-pulse" />
                  <span className="text-muted-foreground leading-relaxed text-left">
                    <strong>Sandbox Status:</strong> Available credit holds change instantly with zero transaction lag.
                  </span>
                </div>
              </div>

              {/* Right Sandbox Column: Dynamic Shelf UI */}
              <div className="lg:col-span-6 bg-background border border-border p-6 rounded-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-1 text-left">
                  <span className="caption-scale font-mono text-primary uppercase font-bold tracking-wider block">INTERACTIVE INSTANT DISPENSER PANEL</span>
                  <h3 className="text-base font-bold text-foreground ">Campus Library Hub Shelf</h3>
                  <p className="caption-scale text-muted-foreground font-light font-sans">
                    Click to test borrowing textbooks. Our smart shelves detect active weight changes and adjust limits with 100% computational correctness.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {simulationCatalog.map((catalogBook) => {
                    const isAlreadyBorrowed = simCheckedBooks.some(item => item.id === catalogBook.id);
                    const canAfford = simCredits >= catalogBook.weight;

                    return (
                      <div
                        key={catalogBook.id}
                        className={`p-3 bg-muted/50 border transition-all duration-300 flex flex-col justify-between h-[125px] rounded-xl ${isAlreadyBorrowed
                          ? 'border-primary/30 opacity-70 bg-indigo-955/20'
                          : 'border-zinc-855 hover:border-border/60'
                          }`}
                      >
                        <div className="space-y-1 text-left">
                          <div className="flex justify-between items-center">
                            <span className="caption-scale font-mono text-muted-foreground/60 uppercase tracking-wider">{catalogBook.code}</span>
                            <span className="caption-scale font-mono text-accent font-bold font-semibold">{catalogBook.weight} Credits</span>
                          </div>
                          <h4 className="caption-scale font-bold text-foreground/90 line-clamp-2 leading-snug ">{catalogBook.title}</h4>
                        </div>

                        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                          <span className="caption-scale font-mono text-primary">
                            {isAlreadyBorrowed ? 'Checked Out' : 'Available'}
                          </span>

                          {isAlreadyBorrowed ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSimCheckedBooks(prev => prev.filter(item => item.id !== catalogBook.id));
                                setSimCredits(prev => prev + catalogBook.weight);
                                addXp(20);
                              }}
                              className="px-3 py-1 bg-primary hover:bg-primary/90 border border-primary/80 rounded-md caption-scale font-bold text-primary-foreground font-sans transition"
                            >
                              Return Book
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (canAfford) {
                                  setSimCheckedBooks(prev => [...prev, catalogBook]);
                                  setSimCredits(prev => prev - catalogBook.weight);
                                  addXp(40);
                                  setActiveSimulationStep(2);
                                }
                              }}
                              disabled={!canAfford}
                              className={`px-2 py-1 rounded-md caption-scale font-bold font-sans transition ${canAfford
                                ? 'bg-muted/50 text-zinc-950 hover:bg-surface'
                                : 'bg-muted/50 text-muted-foreground cursor-not-allowed border border-border'
                                }`}
                            >
                              {canAfford ? 'Borrow Book' : 'Max Limit'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-muted/50/40 rounded-xl border border-border flex justify-between items-center caption-scale font-light text-muted-foreground font-sans">
                  <span>Interactive Playground:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSimCredits(5000);
                      setSimCheckedBooks([]);
                      addXp(50);
                    }}
                    className="caption-scale font-mono text-primary hover:text-indigo-350 transition font-bold font-semibold"
                  >
                    Reset Shelf State
                  </button>
                </div>
              </div>

            </div>
          </section>

          {/* Block 6: Growth & Operations Narrative Block */}
          <section className="bg-background p-6 sm:p-10 rounded-2xl border border-border flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/[0.01] rounded-full blur-2xl"></div>

            <div className="space-y-4 md:w-3/4">
              <span className="caption-scale font-mono tracking-widest text-secondary font-bold uppercase font-semibold">Engineered for speed</span>
              <h3 className="text-xl sm:text-3xl font-extrabold text-foreground">Designed for High Inventory Velocity</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-light">
                "Neev functions as a high-frequency asset network. By moving away from slower delayed delivery chains, we ensure that every textbook listed on our interface is physically sitting on our shelves behind the desk, ready to be handed to you in under 45 seconds."
              </p>
            </div>

            <div className="md:w-1/4 flex justify-center w-full">
              <div className="p-4 bg-muted/50 rounded-xl border border-border/60 text-center space-y-1 w-full max-w-[200px]">
                <div className="text-2xl font-extrabold text-foreground font-mono">&lt; 45s</div>
                <div className="caption-scale uppercase tracking-wider text-muted-foreground/80 font-mono">Counter Hand-Off</div>
              </div>
            </div>
          </section>

          {/* Block 7: Core Pricing Grid Matrix (Pure V2) */}
          <section className="space-y-8">
            <div className="text-center space-y-1.5 max-w-xl mx-auto">
              <span className="caption-scale uppercase font-mono tracking-widest text-primary font-bold">Standardized Pricing</span>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Simple, Transparent Dual Access</h2>
              <p className="text-xs text-zinc-405 font-light">
                Completely optimized physical plans built to secure honest commitments and secure asset replenishment safely.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">

              {/* Column A: Premium Membership */}
              <div className="bg-zinc-90 w-full border border-border/60 rounded-2xl p-6 flex flex-col justify-between hover:border-primary/30 transition-all duration-300 relative">
                <div className="absolute top-0 right-0 px-3 py-1 bg-primary/90 border-b border-l border-primary/80 caption-scale font-mono font-bold text-secondary rounded-bl-xl rounded-tr-2xl">
                  POPULAR ROUTE
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-muted-foreground font-mono uppercase tracking-wider">Premium Membership</h4>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-3xl font-mono font-bold text-foreground">₹999</span>
                      <span className="text-xs text-muted-foreground/60 font-mono">/ Year</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground font-light">
                    The ultimate master subscription for students checking out engineering and syllabus textbooks dynamically round the semester.
                  </p>

                  <div className="h-[1px] bg-muted/50 my-4"></div>

                  <ul className="space-y-3.5 text-xs text-muted-foreground">
                    <li className="flex items-start space-x-2.5">
                      <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      <span><strong>5,000 Credit Elastic Holding Capacity</strong></span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      <span>Clear your buffer instantly by returning books to the Hub</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      <span>Unlimited In-Library reference reading access</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      <span>Full access to the Campus Bounty Board incentives</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    onClick={scrollToAuth}
                    className="w-full py-2.5 bg-surface text-zinc-950 font-bold rounded-xl text-xs sm:text-sm tracking-wider uppercase hover:bg-zinc-200 transition text-center"
                  >
                    Activate Premium Now
                  </button>
                </div>
              </div>

              {/* Column B: Long-Term Lease Tier */}
              <div className="bg-background border border-border rounded-2xl p-6 flex flex-col justify-between hover:border-border/60 transition-all duration-300">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-semibold text-muted-foreground/60 font-mono uppercase tracking-wider font-semibold">Long-Term Lease Tier</h4>
                      <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 caption-scale font-bold text-primary font-mono">NEEV FAMILY ONLY</span>
                    </div>
                    <div className="flex items-baseline space-x-1">
                      <span className="h4-scale text-muted-foreground font-mono">Retail Book Cost</span>
                      <span className="text-xs text-zinc-505 font-mono ml-1">Upfront (Refunded)</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground font-light">
                    Perfect if you want to lease a single heavy engineering foundation reference book for the complete 12-month course block.
                  </p>

                  {/* Neev Family Membership Requirement Banner */}
                  <div className="p-3 bg-muted/50/60 border border-indigo-900/30 rounded-xl space-y-1 text-left">
                    <div className="flex items-center space-x-1.5 text-primary font-bold caption-scale font-mono uppercase">
                      <User className="w-3.5 h-3.5 shrink-0 text-primary" />
                      <span>Registration Prerequisite</span>
                    </div>
                    <p className="caption-scale text-muted-foreground leading-normal font-sans font-light">
                      To utilize this rental tier and get textbook usage <strong>100% free</strong>, you must register and join our <strong>Neev Family</strong>. Non-members are not eligible for this complete deposit refund.
                    </p>
                  </div>

                  <div className="h-[1px] bg-muted/50/60 my-4"></div>

                  <ul className="space-y-3.5 text-xs text-muted-foreground font-sans">
                    <li className="flex items-start space-x-2.5">
                      <Check className="w-4 h-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                      <span>Bypasses the general 5,000 credit cap entirely</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <Check className="w-4 h-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                      <span>Keep your foundational textbooks for the entire academic year</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>100% Free Rental</strong> (Refunded back upon post-exam return)</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <Check className="w-4 h-4 text-zinc-505 shrink-0 mt-0.5" />
                      <span>Refund status fully secured by the Digital Condition Stamp protocol</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    onClick={scrollToAuth}
                    className="w-full py-2.5 bg-muted/50 hover:bg-zinc-850 hover:text-foreground text-muted-foreground border border-border/60 rounded-xl text-xs sm:text-sm tracking-wider uppercase transition text-center"
                  >
                    Join Neev Family & Rent Free
                  </button>
                </div>
              </div>

            </div>
          </section>

          {/* Block 8: FAQ Accordion Components (V2 enforced rules) */}
          <section className="space-y-8 max-w-3xl mx-auto pt-4">
            <div className="text-center space-y-1.5">
              <span className="caption-scale uppercase font-mono tracking-widest text-primary font-bold">FAQS</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">Clearing Doubts</h2>
              <p className="text-xs text-muted-foreground/80 font-light">
                Direct transparent rules on physical deposits, losses, and elastic limits. Click to expand.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: "How does the ₹2,000 security deposit work?",
                  a: "Under our Premium plan, there is absolutely zero security deposit required for active, verified college students. If you opt for individual Long-Term Leases outside Premium, you pay the book's retail cost upfront, which is 100% refunded directly to your original payment method the second the textbook is returned key-locked to the shelf."
                },
                {
                  q: "What happens if I destroy or lose a syllabus book?",
                  a: "Because these are expensive, highly critical reference textbooks, a lost or fully damaged book triggers a replacement liability. Your 5,000 credit limit is immediately frozen. You must either pay the retail replacement fee or trade in a qualifying technical book from the active Campus Bounty Board to restore your account liquidity."
                },
                {
                  q: "How does the 5,000 credit limit bounce back?",
                  a: "Instantly. When you return your checked-out book to the automated library hub desk, the capacitance-sensitive shelves and RFID array verify the physical weight and ID. Your credit balance is instantly credited back in full, allowing you to walk out with your next semester handbook in under 45 seconds."
                }
              ].map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="bg-background border border-border rounded-xl overflow-hidden transition duration-250">
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left font-semibold text-foreground/90 text-xs sm:text-sm hover:text-foreground focus:outline-none"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground/60 transition-transform duration-200 ${isOpen ? 'rotate-180 text-foreground' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs text-muted-foreground font-light leading-relaxed border-t border-border/60 animate-in fade-in duration-200">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Block 9: Bottom Conversion Banner & Login Portal Anchors */}
          <section ref={authSectionRef} id="auth-section" className="space-y-10 pt-4 scroll-mt-20">

            {/* Split UI: Left form & Right callouts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Form card */}
              <div className="lg:col-span-7 bg-muted/50/40 border border-border rounded-2xl p-6 space-y-6 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[70px] pointer-events-none"></div>

                {/* Form Tabs for Login / Sign Up */}
                <div className="flex border-b border-border/60 pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('login');
                      addXp(10);
                    }}
                    className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider transition-all relative ${authTab === 'login' ? 'text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'
                      }`}
                  >
                    <span>Login to Account</span>
                    {authTab === 'login' && (
                      <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary/55 animate-in fade-in duration-200"></div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('signup');
                      addXp(10);
                    }}
                    className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider transition-all relative ${authTab === 'signup' ? 'text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'
                      }`}
                  >
                    <span>Sign Up (New Student)</span>
                    {authTab === 'signup' && (
                      <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary/55 animate-in fade-in duration-200"></div>
                    )}
                  </button>
                </div>

                {authTab === 'login' ? (
                  /* ================= LOGIN FORM VIEW ================= */
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-foreground">Access Your Physical Library Account</h3>
                      <p className="caption-scale text-muted-foreground font-light">
                        Enter your pre-registered email address and choosing credential passwords to access.
                      </p>
                    </div>

                    <form onSubmit={handleEmailFormSubmit} className="space-y-4">
                      {/* Google sign-in */}
                      <div className="flex justify-center w-full">
                        <GoogleLogin
                          onSuccess={credentialResponse => {
                            if (credentialResponse.credential) {
                              onGoogleLogin(credentialResponse.credential);
                            }
                          }}
                          onError={() => {
                            console.error('Google Login Failed');
                          }}
                          theme="outline"
                          text="continue_with"
                          shape="pill"
                          size="large"
                        />
                      </div>

                      <div className="flex items-center space-x-2 select-none my-1">
                        <div className="h-[1px] bg-zinc-850 flex-1"></div>
                        <span className="caption-scale font-mono text-muted-foreground uppercase">(or)</span>
                        <div className="h-[1px] bg-zinc-850 flex-1"></div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <label className="caption-scale font-mono text-muted-foreground uppercase font-bold">Email:</label>
                        <input
                          type="email"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="Enter Your Email"
                          className="w-full bg-background border border-border rounded-xl p-3 text-foreground/90 font-mono focus:border-border outline-none placeholder-zinc-800 text-xs"
                        />
                      </div>

                      <div className="space-y-2 text-xs">
                        <label className="caption-scale font-mono text-muted-foreground uppercase font-bold">Password:</label>
                        <input
                          type="password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter Your Password"
                          className="w-full bg-background border border-border rounded-xl p-3 text-foreground/90 font-mono focus:border-border outline-none placeholder-zinc-800 text-xs animate-in"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-muted/50 hover:bg-surface text-zinc-950 border-t border-white rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition mt-2"
                      >
                        <span>Login to Neev &rarr;</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  /* ================= SIGN UP FORM VIEW ================= */
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-foreground">Create Your Neev Account</h3>
                      <p className="caption-scale text-muted-foreground font-light">
                        Register below to instantly connect to your campus hub Hub physical book buffer.
                      </p>
                    </div>

                    <form onSubmit={handleSignUpFormSubmit} className="space-y-4">
                      {/* Google sign-in */}
                      <div className="flex justify-center w-full">
                        <GoogleLogin
                          onSuccess={credentialResponse => {
                            if (credentialResponse.credential) {
                              onGoogleLogin(credentialResponse.credential, {
                                accountType: 'student',
                                hubLocation: signUpBranch
                              });
                            }
                          }}
                          onError={() => {
                            console.error('Google Login Failed');
                          }}
                          theme="outline"
                          text="continue_with"
                          shape="pill"
                          size="large"
                        />
                      </div>

                      <div className="flex items-center space-x-2 select-none my-1">
                        <div className="h-[1px] bg-zinc-850 flex-1"></div>
                        <span className="caption-scale font-mono text-foreground-subtle uppercase">(or)</span>
                        <div className="h-[1px] bg-zinc-850 flex-1"></div>
                      </div>

                      {/* Name input */}
                      <div className="space-y-2 text-xs">
                        <label className="caption-scale font-mono text-muted-foreground uppercase font-bold">Full Student Name:</label>
                        <input
                          type="text"
                          required
                          value={signUpName}
                          onChange={(e) => setSignUpName(e.target.value)}
                          placeholder="Enter your name"
                          className="w-full bg-background border border-border rounded-xl p-3 text-foreground/90 focus:border-border outline-none placeholder-zinc-800 text-xs font-sans"
                        />
                      </div>

                      {/* Email input */}
                      <div className="space-y-2 text-xs">
                        <label className="caption-scale font-mono text-muted-foreground uppercase font-bold">Academic Email Address:</label>
                        <input
                          type="email"
                          required
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="w-full bg-background border border-border rounded-xl p-3 text-foreground/90 font-mono focus:border-border outline-none placeholder-zinc-800 text-xs"
                        />
                      </div>

                      {/* Password input */}
                      <div className="space-y-2 text-xs">
                        <label className="caption-scale font-mono text-muted-foreground uppercase font-bold">Choose Password protection:</label>
                        <input
                          type="password"
                          required
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          placeholder="Create secure password"
                          className="w-full bg-background border border-border rounded-xl p-3 text-foreground/90 font-mono focus:border-border outline-none placeholder-zinc-800 text-xs"
                        />
                        <p className="caption-scale text-muted-foreground/60 font-mono">Create a password of at least 8 characters to protect your account's 5,000 credit buffer.</p>
                      </div>

                      {/* Campus/Branch selection */}
                      <div className="space-y-2 text-xs">
                        <label className="caption-scale font-mono text-muted-foreground uppercase font-bold">Select Your College Library Branch:</label>
                        <select
                          value={signUpBranch}
                          onChange={(e) => setSignUpBranch(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl p-3 text-foreground/90 focus:border-border outline-none text-xs"
                        >
                          <option value="RVCE-BLR">RV College of Engineering, Bengaluru (RVCE-BLR)</option>
                          <option value="IIT-Hauzkhas">IIT Delhi (IIT-Hauzkhas)</option>
                          <option value="BITS-Pilani">BITS Pilani (BITS-Pilani)</option>
                        </select>
                      </div>

                      {/* Membership Selection */}
                      <div className="pt-4">
                        <label className="mb-3 block caption-scale font-medium uppercase tracking-wider text-foreground-muted">
                          Choose Your Membership Plan
                        </label>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {/* Premium */}
                          <button
                            type="button"
                            onClick={() => {
                              setSignUpPremium(true);
                              addXp(15);
                            }}
                            className={`group relative rounded-2xl border p-4 text-left transition-all duration-200 ${signUpPremium
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-background hover:border-primary/40 hover:bg-muted/20"
                              }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-base font-semibold text-foreground">
                                  Premium Membership
                                </h4>

                                <p className="mt-1 body-scale font-medium text-success">
                                  ₹999 / Year
                                </p>
                              </div>

                              {signUpPremium && (
                                <div className="flex h-6 w-6 items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-primary-foreground" />
                                </div>
                              )}
                            </div>

                            <p className="mt-3 body-scale leading-5 text-foreground-muted">
                              Recommended for active learners. Get a continuous credit limit of
                              5,000 credits and borrow textbooks without individual security
                              deposits.
                            </p>

                            <div className="mt-4 flex items-center gap-2">
                              <Badge className="bg-accent/15 text-foreground border-accent/30">
                                Recommended
                              </Badge>
                            </div>
                          </button>

                          {/* Free Tier */}
                          <button
                            type="button"
                            onClick={() => {
                              setSignUpPremium(false);
                              addXp(15);
                            }}
                            className={`group relative rounded-2xl border p-4 text-left transition-all duration-200 ${!signUpPremium
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-background hover:border-primary/40 hover:bg-muted/20"
                              }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-base font-semibold text-foreground">
                                  Regular Membership
                                </h4>

                                <p className="mt-1 body-scale font-medium text-foreground/60">
                                  Free Plan
                                </p>
                              </div>

                              {!signUpPremium && (
                                <div className="flex h-6 w-6 items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-primary-foreground" />
                                </div>
                              )}
                            </div>

                            <p className="mt-3 body-scale leading-5 text-foreground-muted">
                              Borrow books using refundable security deposits. Suitable for
                              occasional readers and students with limited borrowing needs.
                            </p>
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-primary hover:from-primary hover:to-primary text-primary-foreground font-bold border-t border-primary/30 rounded-xl caption-scale uppercase tracking-kicker flex items-center justify-center space-x-1.5 shadow-lg transition"
                      >
                        <span>Complete Registration &rarr;</span>
                      </button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setAuthTab('login')}
                          className="caption-scale text-primary hover:underline"
                        >
                          Already have an academic account? Click here to Log In
                        </button>
                      </div>

                    </form>
                  </div>
                )}
              </div>

              {/* Right column text/metric points */}
              <div className="lg:col-span-5 space-y-6 pt-2">
                <div className="p-5 bg-background rounded-2xl border border-border space-y-3">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">Direct Campus Pickups</h4>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed font-light">
                    Neev terminals are established directly beside circulation boards of partnered tech engineering campuses (such as RVCE, IIT-D, BITS).
                  </p>
                </div>

                <div className="p-5 bg-background rounded-2xl border border-border space-y-3">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">Secure Refund Auditing</h4>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed font-light">
                    Every textbook check-in instantly clears allocated credits and immediately reverses long-term deposit transactions cleanly.
                  </p>
                </div>

                <div className="p-5 bg-background rounded-2xl border border-border space-y-3">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">Trained Ambassadorship</h4>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed font-light">
                    Our student ambassadors manage counters entirely, eliminating traditional delays and providing instant academic syllabus consulting support.
                  </p>
                </div>
              </div>

            </div>
          </section>

        </div>
      ) : (
        /* ==================== PHASE 2: INSTITUTIONAL/COLLEGES PAGE ==================== */
        <div className="space-y-20 animate-in fade-in duration-500">

          {/* Block 1: B2B Hero Area & Value Alignment */}
          <section className="relative rounded-3xl overflow-hidden min-h-[380px] sm:min-h-[460px] py-12 flex flex-col justify-center items-center text-center px-4 ">
            {/* Futuristic Tech Circulation Totem Backdrop Mock */}
            <div className="absolute inset-0 z-0 opacity-20 filter blur-[3px] pointer-events-none">

              {/* Complex high-traffic tech central circulation totem grid */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 h-80 border border-zinc-500 rounded-full flex items-center justify-center animate-spin" style={{ animationDuration: '40s' }}>
                <div className="w-64 h-64 border border-primary rounded-full flex items-center justify-center">
                  <div className="w-32 h-32 border border-purple-500 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="relative z-10 max-w-3xl space-y-5 px-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full border border-border/60 caption-scale font-mono tracking-widest text-muted-foreground font-bold uppercase">
                Institutional Dean Alignment
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                Upgrade library space into a Neev study hub. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-zinc-105 to-secondary">
                  Start with zero upfront capex.
                </span>
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed font-light">
                Redeem slow-turn technical rooms into efficient high-speed academic fulfillment bars. Increase physical checkouts, empower student leaders, and verify space circulation with live automated telemetry.
              </p>
              <div className="pt-4 flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('b2b-form');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-surface text-zinc-950 font-bold rounded-xl text-xs sm:text-sm tracking-wider uppercase hover:bg-zinc-200 transition shadow-lg"
                >
                  Schedule a Consultation
                </button>
              </div>
            </div>
          </section>

          {/* Block 2: Three-Column Feature Matrix (No All-Caps, Readability Optimized) */}
          <section className="space-y-10">
            <div className="text-center space-y-1.5 max-w-xl mx-auto">
              <span className="caption-scale uppercase font-mono tracking-widest text-secondary font-bold">Key Benefits</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">Facility Optimization Framework</h2>
              <p className="text-xs text-muted-foreground/80 font-light">
                High contrast, sentence-case statements ensuring optimal reading comfort for library boards and selection committees.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Card 1: Physical Experience */}
              <div className="p-6 bg-muted/50/30 border border-border rounded-2xl space-y-4 animate-in fade-in duration-300">
                <div className="mb-2 flex items-center">
                  <Layers className="w-5 h-5 text-muted-foreground" />
                </div>
                <h4 className="text-base font-extrabold text-zinc-105  tracking-tight">
                  Physical Experience
                </h4>
                <p className="text-xs leading-relaxed font-light text-muted-foreground">
                  Neev weaves lightweight sensor telemetry nodes directly into syllabus textbook bindings on the shelves. Students explore row wayfindings elegantly on mobile devices while counter counters monitor lift frequencies.
                </p>
              </div>

              {/* Card 2: Modern Student Flow */}
              <div className="p-6 bg-muted/50/30 border border-border rounded-2xl space-y-4 animate-in fade-in duration-400">
                <div className="mb-2 flex items-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <h4 className="text-base font-extrabold text-zinc-105  tracking-tight">
                  Modern Student Flow
                </h4>
                <p className="text-xs leading-relaxed font-light text-muted-foreground">
                  Our 'Unlimited In-Library' rule requires students who exhaust their home credit caps to remain inside the facility for unbuffered reference reading, directly driving up your official institutional library foot-traffic and utilization metrics.
                </p>
              </div>

              {/* Card 3: Traceable Handoffs */}
              <div className="p-6 bg-muted/50/30 border border-border rounded-2xl space-y-4 animate-in fade-in duration-500">
                <div className="mb-2 flex items-center">
                  <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                </div>
                <h4 className="text-base font-extrabold text-zinc-105  tracking-tight">
                  Traceable Handoffs
                </h4>
                <p className="text-xs leading-relaxed font-light text-muted-foreground">
                  Avoid book damage arguments. Every textbook utilizes high-res digital condition photograph signatures captured directly on student transaction cards, maintaining premium college library condition standards cleanly.
                </p>
              </div>

            </div>
          </section>

          {/* Block 3: Connected Process Flow Checklist - 14-Day Timeline */}
          <section className="space-y-10 bg-muted/50/10 border border-border/70 rounded-2xl p-6 sm:p-8">
            <div className="text-center space-y-1.5 max-w-xl mx-auto">
              <span className="caption-scale uppercase font-mono tracking-widest text-indigo-405 font-bold">MoU Setup Lifecycle</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">The 14-Day Rapid Deployment Protocol</h2>
              <p className="text-xs text-muted-foreground/80 font-light">
                Rapid integration schemes bypass months of administrative vendor lag. We deploy systems at zero initial cost to the university budget.
              </p>
            </div>

            {/* Timed Milestone elements */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">

              <div className="bg-background border border-border p-5 rounded-xl space-y-3 relative">
                <div className="caption-scale font-mono font-bold text-primary">DAYS 1 - 3</div>
                <h4 className="text-xs font-semibold text-zinc-250 uppercase tracking-wide">Phase 1: Physical Spine Verification & Node Mapping</h4>
                <p className="caption-scale text-muted-foreground/80 leading-relaxed font-light">
                  Fast executive administrative signoff and academic scope formulation. We map targets and align physical book spines to digital identifiers.
                </p>
              </div>

              <div className="bg-background border border-border p-5 rounded-xl space-y-3 relative">
                <div className="caption-scale font-mono font-bold text-primary">DAYS 4 - 7</div>
                <h4 className="text-xs font-semibold text-zinc-250 uppercase tracking-wide">Phase 2: Capacitive Core Plate Assembly & RFID Registration</h4>
                <p className="caption-scale text-muted-foreground/80 leading-relaxed font-light">
                  We customize the desk plates and secure RFID registries. Operations are run entirely by student Campus Ambassadors, ensuring zero payroll burden.
                </p>
              </div>

              <div className="bg-background border border-border p-5 rounded-xl space-y-3 relative">
                <div className="caption-scale font-mono font-bold text-primary">DAYS 8 - 10</div>
                <h4 className="text-xs font-semibold text-zinc-250 uppercase tracking-wide">Phase 3: Local Gateway Deployment & Hub Calibration</h4>
                <p className="caption-scale text-muted-foreground/80 leading-relaxed font-light">
                  Deployment of regional telemetry receivers, gateway sync controllers, and rapid calibration testing on smart terminal shelves.
                </p>
              </div>

              <div className="bg-background border border-border p-5 rounded-xl space-y-3 relative">
                <div className="caption-scale font-mono font-bold text-emerald-450">DAYS 11 - 14</div>
                <h4 className="text-xs font-semibold text-zinc-255 uppercase tracking-wide">Phase 4: Campus Ambassador Onboarding & Live Network Ingress</h4>
                <p className="caption-scale text-muted-foreground/80 leading-relaxed font-light">
                  Ambassador operational training is completed, and student smart registration goes live, unlocking immediate curriculum resource checks.
                </p>
              </div>

            </div>
          </section>

          {/* Block 4: Institutional Bottom Banner & Consultation scheduler (3 clicks form) */}
          <section id="b2b-form" className="bg-muted/50/40 border border-border rounded-2xl p-6 sm:p-10 max-w-4xl mx-auto space-y-8 scroll-mt-20">
            <div className="text-center space-y-2">
              <span className="caption-scale font-mono uppercase tracking-widest text-secondary font-bold">Dean Consultation Room</span>
              <h3 className="text-xl sm:h3-scale text-foreground">Ready to talk about one pilot hub?</h3>
              <p className="text-xs text-muted-foreground font-light max-w-xl mx-auto">
                No complex RFPs. Choose your appointment time slot in under 3 clicks. Our state coordinators will review library constraints and deliver a 14-day execution sheet.
              </p>
            </div>

            {consultationSubmitted ? (
              <div className="p-6 bg-emerald-950/20 border border-emerald-900/50 rounded-xl text-center space-y-3 animate-in zoom-in-95 duration-300">
                <div className="w-10 h-10 flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5 text-secondary" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">Consultation Booked Successfully!</h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{clientInstitution}</strong>. A regional coordinator has locked your request for {clientTime.replace('T', ' at ')}. An confirmation docket was sent to <strong>{clientEmail}</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConsultationSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

                {/* Click 1: Institution name */}
                <div className="space-y-1.5 text-xs">
                  <label className="caption-scale font-mono text-muted-foreground/60 uppercase tracking-wider font-semibold">1. Institution Name:</label>
                  <select
                    required
                    value={clientInstitution}
                    onChange={(e) => setClientInstitution(e.target.value)}
                    className="w-full bg-background border border-border/60 rounded-xl p-2.5 text-foreground/90 focus:outline-none focus:border-border cursor-pointer"
                  >
                    <option value="">Select Institution</option>
                    {/* Placeholder options - populate with actual institution names */}
                    <option value="RVCE">RV College of Engineering</option>
                    <option value="IIT Delhi">IIT Delhi</option>
                    <option value="IISC Bangalore">IISC Bangalore</option>
                    <option value="MSRIT">MSRIT</option>
                  </select>
                </div>

                {/* Click 2: Time slot selection */}
                <div className="space-y-1.5 text-xs">
                  <label className="caption-scale font-mono text-muted-foreground/60 uppercase tracking-wider font-semibold">2. Select Consultation Date:</label>
                  <input
                    type="datetime-local"
                    required
                    value={clientTime}
                    onChange={(e) => setClientTime(e.target.value)}
                    className="w-full bg-background border border-border/60 rounded-xl p-2.5 text-muted-foreground focus:outline-none cursor-pointer focus:border-border"
                  />
                </div>

                {/* Click 3: Confirm Submit */}
                <div className="space-y-1.5 text-xs">
                  <label className="caption-scale font-mono text-muted-foreground/60 uppercase tracking-wider font-semibold">3. Admin Email Address:</label>
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="dean@college.edu"
                      className="w-full bg-background border border-border/60 rounded-xl p-2.5 text-foreground/90 focus:outline-none focus:border-border placeholder-zinc-800"
                    />
                    <button
                      type="submit"
                      className="px-4 bg-secondary hover:bg-secondary text-foreground font-bold rounded-xl text-xs flex items-center justify-center shrink-0 transition"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </form>
            )}

            {/* Registrar key access trigger option */}
            <div className="pt-4 border-t border-border text-center">
              <span className="caption-scale font-mono text-muted-foreground/50 flex items-center justify-center gap-1"><Sparkles className="w-3 h-3" /> Already registered as a partner Campus Registrar?</span>
              <button
                type="button"
                onClick={() => {
                  setActiveSegment('colleges');
                  setTimeout(() => {
                    scrollToCollegeAuth();
                  }, 100);
                }}
                className="caption-scale font-bold text-primary hover:text-indigo-350 transition-all underline mt-2"
              >
                Access Secure College Registrar Console &rarr;
              </button>
            </div>
          </section>

          {/* Block 5: Colleges & Hubs Auth Portal Section */}
          <section ref={collegeAuthSectionRef} id="college-auth-section" className="space-y-10 pt-4 scroll-mt-20">
            <div className="text-center space-y-1.5 max-w-xl mx-auto">
              <span className="caption-scale uppercase font-mono tracking-widest text-primary font-bold">Partner Gateway</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">Hub Coordinator & Registrar Workspace</h2>
              <p className="text-xs text-muted-foreground font-light">
                Securely sign in to scan textbooks, adjust campus inventory balances, and track live physical student check-outs.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Form container */}
              <div className="lg:col-span-7 bg-muted/50/40 border border-border rounded-2xl p-6 space-y-6 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[70px] pointer-events-none"></div>

                {/* Form Tabs */}
                <div className="flex border-b border-border/60 pb-1 font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      setCollegeAuthTab('login');
                      addXp(10);
                    }}
                    className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider transition-all relative ${collegeAuthTab === 'login' ? 'text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'
                      }`}
                  >
                    <span>Ambassador / Admin Login</span>
                    {collegeAuthTab === 'login' && (
                      <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary animate-in fade-in duration-200"></div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCollegeAuthTab('signup');
                      addXp(10);
                    }}
                    className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider transition-all relative ${collegeAuthTab === 'signup' ? 'text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'
                      }`}
                  >
                    <span>Sign Up Admin</span>
                    {collegeAuthTab === 'signup' && (
                      <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary animate-in fade-in duration-200"></div>
                    )}
                  </button>
                </div>

                {collegeAuthTab === 'login' ? (
                  /* COLLEGE/HUB LOGIN FORM */
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-foreground ">Access Hub Account</h3>
                      <p className="caption-scale text-muted-foreground font-light">
                        Use your assigned university credentials to manage your assigned library's logistics.
                      </p>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!collegeEmail.trim()) return;
                        initiateSecureLogin(collegeEmail.trim().toLowerCase(), collegePassword);
                      }}
                      className="space-y-4"
                    >
                      {/* Google sign-in */}
                      <div className="flex justify-center w-full">
                        <GoogleLogin
                          onSuccess={credentialResponse => {
                            if (credentialResponse.credential) {
                              onGoogleLogin(credentialResponse.credential);
                            }
                          }}
                          onError={() => {
                            console.error('Google Login Failed');
                          }}
                          theme="outline"
                          text="continue_with"
                          shape="pill"
                          size="large"
                        />
                      </div>

                      <div className="flex items-center space-x-2 select-none my-1">
                        <div className="h-[1px] bg-zinc-850 flex-1"></div>
                        <span className="caption-scale font-mono text-foreground-subtle uppercase">(Or)</span>
                        <div className="h-[1px] bg-zinc-850 flex-1"></div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <label className="caption-scale font-mono text-muted-foreground uppercase font-bold">Admin Email:</label>
                        <input
                          type="email"
                          required
                          value={collegeEmail}
                          onChange={(e) => setCollegeEmail(e.target.value)}
                          placeholder="Enter Hub Email"
                          className="w-full bg-background border border-border rounded-xl p-3 text-zinc-105 focus:border-border outline-none font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <label className="caption-scale font-mono text-muted-foreground uppercase font-bold"> Password:</label>
                        <input
                          type="password"
                          required
                          value={collegePassword}
                          onChange={(e) => setCollegePassword(e.target.value)}
                          placeholder="Password"
                          className="w-full bg-background border border-border rounded-xl p-3 text-zinc-105 font-mono focus:border-border outline-none text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-muted/50 hover:bg-surface text-zinc-950 border-t border-white rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition mt-2"
                      >
                        <span>Login&rarr;</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  /* COLLEGE / HUB / ADMIN SIGNUP FORM */
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">Create Hub Account</h3>
                      <p className="text-xs text-muted-foreground">
                        Register your hub and create the primary administrator account responsible for managing books, students, librarians, and circulation operations.
                      </p>
                    </div>
                    {/* Google sign-in */}
                    <div className="flex justify-center w-full">
                      <GoogleLogin
                        onSuccess={credentialResponse => {
                          if (credentialResponse.credential) {
                            const role = adminRole === 'super_admin' ? 'super_admin' : 'hub';
                            const locationString = `${city.trim()}, ${adminState.trim()}, ${country.trim()}`;
                            onGoogleLogin(credentialResponse.credential, {
                              accountType: role,
                              hubLocation: locationString,
                              hubName: institutionName.trim(),
                              hubKind: institutionType
                            });
                          }
                        }}
                        onError={() => {
                          console.error('Google Login Failed');
                        }}
                        theme="outline"
                        text="continue_with"
                        shape="pill"
                        size="large"
                      />
                    </div>
                    <div className="flex items-center space-x-2 select-none my-1">
                      <div className="h-[1px] bg-zinc-850 flex-1"></div>
                      <span className="caption-scale font-mono text-foreground-subtle uppercase">(Or)</span>
                      <div className="h-[1px] bg-zinc-850 flex-1"></div>
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!adminName.trim() || !adminEmail.trim() || !institutionName.trim() || !adminState.trim() || !city.trim() || !password || password !== confirmPassword) return;
                        // For institutions, we register them as 'super_admin' or 'hub' accountType
                        const role = adminRole === 'super_admin' ? 'super_admin' : 'hub';
                        const locationString = `${city.trim()}, ${adminState.trim()}, ${country.trim()}`;
                        onSignUp(adminName.trim(), adminEmail.trim().toLowerCase(), true, locationString, password, role, institutionName.trim(), institutionType);
                      }}
                      className="space-y-4"
                    >
                      <div className="border border-border rounded-xl p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-foreground">Administrator Information</h4>
                        <input type="text" required value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Full Name" className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none" />
                        <input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="Official Email Address" className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none" />
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile Number" className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none" />
                        <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Designation (Librarian, Coordinator, Admin)" className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none" />
                      </div>
                      <div className="border border-border rounded-xl p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-foreground">Institution Information</h4>
                        <input type="text" required value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} placeholder="Institution / College Name" className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none" />
                        <select value={institutionType} onChange={(e) => setInstitutionType(e.target.value)} className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none">
                          <option value="college">College / University</option>
                          <option value="public">Public Library</option>
                          <option value="private">Private Library / Corporate</option>
                          <option value="government">Government / Regional Hub</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="border border-border rounded-xl p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-foreground">Location Details</h4>
                        <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none" />
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" required value={adminState} onChange={(e) => setAdminState(e.target.value)} placeholder="State" className="rounded-xl border border-border bg-background p-3 text-sm focus:outline-none" />
                          <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="rounded-xl border border-border bg-background p-3 text-sm focus:outline-none" />
                        </div>
                        <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District" className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none" />
                        <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full Address" rows={3} className="w-full rounded-xl border border-border bg-background p-3 text-sm resize-none focus:outline-none" />
                        <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="PIN / Postal Code" className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Administrator Role</label>
                        <select value={adminRole} onChange={(e) => setAdminRole(e.target.value)} className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none">
                          <option value="super_admin">Institution Administrator (Super Admin)</option>
                          <option value="hub_manager">Hub Manager</option>
                          <option value="librarian">Chief Librarian</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create Password" className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none" />
                        <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none" />
                      </div>
                      <label className="flex items-start gap-2 text-xs text-muted-foreground">
                        <input type="checkbox" required />
                        <span>I confirm that I am authorized to create and manage this institution account.</span>
                      </label>
                      <button type="submit" className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold transition hover:opacity-90">
                        Create Hub Account &rarr;
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Sidebar metric notes */}
              <div className="lg:col-span-5 space-y-6 pt-2">
                <div className="p-5 bg-background rounded-2xl border border-border space-y-3">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">Autonomous Inventory Audits</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed font-light">
                    Ambassadors use local hub views to configure physical shelves, check book weight sensors, and receive direct checkout deposit alerts on site.
                  </p>
                </div>
                <div className="p-5 bg-background rounded-2xl border border-border space-y-3">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">MOU Administrative Sovereignty</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed font-light">
                    Administrators oversee system financials, check global subscription flow metrics, activate bounty textbooks, and add fresh syllabus material to the master database catalog.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Realistic Google One-Tap Style Floating Account Chooser on the Top-Right */}
      {showGoogleModal && (
        <div className="fixed top-14 right-4 md:right-16 z-[100] max-w-[375px] w-full p-4 bg-[#131314] border border-[#3c4043] rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.85)] animate-in slide-in-from-top-6 duration-300 text-left font-sans">

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#3c4043]/80">
            <div className="flex items-center space-x-2.5">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-[#e3e3e3] truncate leading-tight">
                  {showGoogleCustomInput ? "Sign in with Google" : "Sign in with google.com"}
                </h4>
                <p className="caption-scale text-[#9aa0a6] leading-none mt-0.5">
                  to continue to <span className="text-foreground/90 font-medium">neev.in</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!showGoogleCustomInput ? (
            <div className="space-y-0.5 py-1 max-h-[340px] overflow-y-auto pr-0.5">
              {customGoogleAccounts.map((account, idx) => (
                <button
                  key={`custom-${idx}`}
                  type="button"
                  onClick={() => handleSelectGoogleAccount(account.email, account.name)}
                  className="w-full flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/80 transition text-left outline-none"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center caption-scale font-bold text-zinc-300 shrink-0 border border-border">
                      {account.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#b8b8b8] truncate">{account.name}</div>
                      <div className="caption-scale text-muted-foreground/60 truncate font-mono mt-0.5">{account.email}</div>
                    </div>
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setShowGoogleCustomInput(true); setGoogleCustomEmail(""); }}
                className="w-full flex items-center space-x-2.5 py-2.5 px-2 rounded-xl text-left hover:bg-[#1f1f21] transition duration-150 text-xs font-medium text-[#8ab4f8]"
              >
                <svg className="w-4 h-4 shrink-0 text-[#8ab4f8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>Use another account</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!googleCustomEmail.trim() || !googleCustomEmail.includes('@')) return;
                const enteredEmail = googleCustomEmail.trim().toLowerCase();
                const partName = enteredEmail.split('@')[0].split('.').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                registerCustomGoogleAccount(enteredEmail, partName);
                handleSelectGoogleAccount(enteredEmail, partName);
              }}
              className="space-y-4 py-2 animate-in slide-in-from-right-3 duration-200"
            >
              <div className="space-y-1.5">
                <label className="caption-scale font-semibold text-[#9aa0a6] uppercase tracking-wider block">Email or phone</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={googleCustomEmail}
                  onChange={(e) => setGoogleCustomEmail(e.target.value)}
                  className="w-full bg-[#131314] border border-[#5f6368] focus:border-[#8ab4f8] rounded-xl p-3 text-xs text-[#e3e3e3] outline-none transition"
                />
              </div>
              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={() => setShowGoogleCustomInput(false)} className="w-1/3 py-2 bg-transparent hover:bg-muted text-[#8ab4f8] border border-[#5f6368] rounded-xl caption-scale font-bold uppercase tracking-wider transition">
                  Back
                </button>
                <button type="submit" className="flex-1 py-2 bg-[#8ab4f8] hover:bg-[#93bfff] text-[#131314] font-extrabold rounded-xl caption-scale uppercase tracking-wider transition text-center">
                  Next
                </button>
              </div>
            </form>
          )}

          {/* Privacy footer */}
          <div className="pt-3 border-t border-[#3c4043]/50 caption-scale text-[#9aa0a6] leading-normal font-light">
            Google will share your name, email address, language preference, and profile picture with Neev Hub. Review Neev's <span className="text-[#8ab4f8] cursor-pointer hover:underline">privacy policy</span> and <span className="text-[#8ab4f8] cursor-pointer hover:underline">terms</span>.
          </div>
        </div>
      )}

    </div>
  );
};
