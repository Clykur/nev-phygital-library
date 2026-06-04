'use client';

import React from 'react';
import { BookOpen, Map, Wallet, Cpu, Library, School, LogOut, User } from 'lucide-react';
import { cn } from '../lib/utils';

interface NeevHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  branch: string;
  setBranch: (branch: string) => void;
  isLoggedIn: boolean;
  userRole: 'student' | 'college_ambassador' | 'admin' | null;
  onLogout: () => void;
  landingSegment?: 'students' | 'colleges';
  setLandingSegment?: (segment: 'students' | 'colleges') => void;
}

export const NeevHeader: React.FC<NeevHeaderProps> = ({
  activeTab,
  setActiveTab,
  branch,
  setBranch,
  isLoggedIn,
  userRole,
  onLogout,
  landingSegment,
  setLandingSegment,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('overview')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Library className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-slate-900 uppercase">NEEV</span>
                <span className="text-[9px] px-1.5 py-0.5 font-mono uppercase font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded">PHYGITAL</span>
              </div>
              <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">BRIDGING PHYSICAL & DIGITAL</p>
            </div>
          </div>

          {/* Nav Tabs */}
          {isLoggedIn ? (
            <nav className="hidden md:flex space-x-1 items-center bg-muted/50 p-1 rounded-xl border border-border/50">
              {(() => {
                const tabs = userRole === 'student' ? [
                  { id: 'student_dashboard', label: 'Student Portal', icon: Library },
                  { id: 'catalog', label: 'Find a Book', icon: BookOpen },
                  { id: 'map', label: 'Shelf Finder', icon: Map },
                  { id: 'member', label: 'My Card', icon: Wallet },
                  { id: 'scanner', label: 'AI Scanner', icon: Cpu },
                ] : (userRole === 'college_ambassador' || userRole === 'admin') ? [
                  { id: 'college_dashboard', label: 'Kiosk Desk', icon: Cpu },
                  { id: 'catalog', label: 'Find a Book', icon: BookOpen },
                  { id: 'map', label: 'Shelf Finder', icon: Map },
                  { id: 'college', label: 'Hub Management', icon: School },
                  { id: 'librarian', label: 'System Ledger', icon: SlidersIcon },
                ] : [
                  { id: 'overview', label: 'Concept', icon: Library },
                  { id: 'catalog', label: 'Find a Book', icon: BookOpen },
                  { id: 'map', label: 'Shelf Finder', icon: Map },
                ];

                return tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200",
                        isActive
                          ? "bg-background text-foreground shadow-sm border border-border/60"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50 border border-transparent"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                      <span>{tab.label}</span>
                    </button>
                  );
                });
              })()}
            </nav>
          ) : (
            <nav className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => {
                  setLandingSegment?.('students');
                  setActiveTab('landing');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className={cn(
                  "text-xs font-semibold transition-colors",
                  activeTab !== 'catalog' && landingSegment === 'students' ? "text-foreground border-b-2 border-primary pb-1" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Home
              </button>
              <button 
                onClick={() => {
                  setActiveTab('catalog');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className={cn(
                  "text-xs font-semibold transition-colors",
                  activeTab === 'catalog' ? "text-foreground border-b-2 border-primary pb-1" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Find a Book
              </button>
              <button 
                onClick={() => {
                  setActiveTab('landing');
                  setLandingSegment?.('students');
                  setTimeout(() => {
                    document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }} 
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </button>
            </nav>
          )}

          {/* Right Section: Branch Selector & Live Profile / Logout button */}
          <div className="flex items-center space-x-4">
            
            {/* Campus selector */}
            {isLoggedIn && (
              <div className="flex items-center space-x-2 bg-muted/40 px-2 py-1.5 rounded-lg border border-border/50">
                <span className="text-[10px] uppercase font-mono text-muted-foreground hidden lg:inline font-semibold">Campus:</span>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="bg-transparent text-[11px] font-mono text-foreground focus:outline-none select-none cursor-pointer font-bold"
                >
                  <option value="RVCE-BLR" className="bg-background">RVCE Bengaluru</option>
                  <option value="IIT-Hauzkhas" className="bg-background">IIT Delhi</option>
                  <option value="BITS-Pilani" className="bg-background">BITS Pilani</option>
                  <option value="Bengaluru-Central" className="bg-background">Central IN-BLR</option>
                  <option value="Delhi-Hauzkhas" className="bg-background">Central IN-DLH</option>
                </select>
              </div>
            )}

            {/* Profile status or Login Call-to-action */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold text-foreground capitalize">
                    {userRole?.replace('_', ' ')}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground tracking-widest uppercase">Verified Session</span>
                </div>
                <div className="h-8 w-px bg-border/60 mx-1 hidden sm:block"></div>
                <button
                  onClick={onLogout}
                  className="flex items-center justify-center w-9 h-9 bg-muted/40 border border-border/50 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive rounded-lg text-muted-foreground transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  role="button"
                  onClick={() => {
                    setActiveTab('landing');
                    setTimeout(() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 text-foreground hover:bg-muted"
                >
                  Log In
                </button>
                <button
                  role="button"
                  onClick={() => {
                    setActiveTab('landing');
                    setTimeout(() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                  }}
                  className="btn-primary !px-4 !py-2 !text-xs !rounded-lg"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Helper Icon placeholder because Sliders is sometimes separate
const SlidersIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="2" y1="14" x2="6" y2="14" />
    <line x1="10" y1="8" x2="14" y2="8" />
    <line x1="18" y1="16" x2="22" y2="16" />
  </svg>
);
