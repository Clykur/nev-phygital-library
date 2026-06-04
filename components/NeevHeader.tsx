'use client';

import React from 'react';
import { BookOpen, Map, Wallet, Cpu, Library, School, LogOut, User, UserCircle2 } from 'lucide-react';
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
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 shadow-sm transition-transform duration-300">
              <Library className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-bold tracking-tight text-slate-900">Neev</span>
                <span className="text-[10px] px-1.5 py-0.5 font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded">Phygital</span>
              </div>
            </div>
          </div>

          {/* Nav Tabs */}
          {isLoggedIn ? (
            <nav className="hidden md:flex space-x-1 items-center">
              {(() => {
                const tabs = userRole === 'student' ? [
                  { id: 'student_dashboard', label: 'Portal', icon: Library },
                  { id: 'catalog', label: 'Catalog', icon: BookOpen },
                  { id: 'map', label: 'Map', icon: Map },
                  { id: 'member', label: 'Membership', icon: UserCircle2 },
                ] : (userRole === 'college_ambassador' || userRole === 'admin') ? [
                  { id: 'college_dashboard', label: 'Kiosk', icon: Cpu },
                  { id: 'catalog', label: 'Catalog', icon: BookOpen },
                  { id: 'map', label: 'Map', icon: Map },
                  { id: 'college', label: 'Hub', icon: School },
                  { id: 'librarian', label: 'Ledger', icon: SlidersIcon },
                ] : [
                  { id: 'overview', label: 'Overview', icon: Library },
                  { id: 'catalog', label: 'Catalog', icon: BookOpen },
                  { id: 'map', label: 'Map', icon: Map },
                ];

                return tabs.map((tab) => {
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200",
                        isActive
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                });
              })()}
            </nav>
          ) : (
            <nav className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => {
                  setLandingSegment?.('students');
                  setActiveTab('landing');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200",
                  activeTab !== 'catalog' && landingSegment === 'students' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
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
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200",
                  activeTab === 'catalog' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                Catalog
              </button>
              <button
                onClick={() => {
                  setActiveTab('landing');
                  setLandingSegment?.('students');
                  setTimeout(() => {
                    document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                About
              </button>
            </nav>
          )}

          {/* Right Section: Branch Selector & Live Profile / Logout button */}
          <div className="flex items-center space-x-4">

            {/* Campus selector */}
            {isLoggedIn && (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md border border-slate-200">
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none select-none cursor-pointer"
                >
                  <option value="RVCE-BLR">RVCE Bengaluru</option>
                  <option value="IIT-Hauzkhas">IIT Delhi</option>
                  <option value="BITS-Pilani">BITS Pilani</option>
                  <option value="Bengaluru-Central">Central IN-BLR</option>
                  <option value="Delhi-Hauzkhas">Central IN-DLH</option>
                </select>
              </div>
            )}

            {/* Profile status or Login Call-to-action */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-slate-900 capitalize">
                    {userRole?.replace('_', ' ')}
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
                <button
                  onClick={onLogout}
                  className="flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
                  className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Log In
                </button>
                <button
                  role="button"
                  onClick={() => {
                    setActiveTab('landing');
                    setTimeout(() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                  }}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors"
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
