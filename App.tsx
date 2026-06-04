import React, { useState, useEffect } from 'react';
import { NeevHeader } from './components/NeevHeader';
import { NeevOverview } from './components/NeevOverview';
import { NeevMarketplace } from './components/NeevMarketplace';
import { NeevMap } from './components/NeevMap';
import { NeevMember } from './components/NeevMember';
import { NeevScanner } from './components/NeevScanner';
import { NeevLibrarian } from './components/NeevLibrarian';
import { NeevCollege } from './components/NeevCollege';
import { NeevLanding } from './components/NeevLanding';
import { NeevStudentDashboard } from './components/NeevStudentDashboard';
import { NeevCollegeDashboard } from './components/NeevCollegeDashboard';

import { useAuth } from './context/auth-context';
import { Info } from 'lucide-react';

const App: React.FC = () => {
  const { user, token, loading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [landingSegment, setLandingSegment] = useState<'students' | 'colleges'>('students');
  const [branch, setBranch] = useState<string>('RVCE-BLR');
  const [locatedShelfId, setLocatedShelfId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (user) {
        setActiveTab(user.baseRole === 'hub' ? 'college_dashboard' : 'student_dashboard');
      } else {
        setActiveTab('overview');
      }
    }
  }, [user, loading]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm font-medium bg-white">Loading session...</div>;
  }

  const isLoggedIn = !!user;
  const userRole = user?.baseRole === 'hub' ? 'college_ambassador' : (user ? 'student' : null);

  const handleLocateOnMap = (shelfId: string) => {
    setLocatedShelfId(shelfId.charAt(0));
    setActiveTab('map');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col relative overflow-x-hidden">
      <NeevHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        branch={branch}
        setBranch={setBranch}
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        onLogout={logout}
        landingSegment={landingSegment}
        setLandingSegment={setLandingSegment}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {!isLoggedIn && activeTab !== 'catalog' ? (
          <NeevLanding
            activeSegment={landingSegment}
            setActiveSegment={setLandingSegment} onLogin={function (email: string, password?: string, isGoogleAuth?: boolean): void {
              throw new Error('Function not implemented.');
            }} onGoogleLogin={function (token: string): void {
              throw new Error('Function not implemented.');
            }} onSignUp={function (name: string, email: string, isPremium: boolean, hubLocationId: string, password?: string, role?: string): void {
              throw new Error('Function not implemented.');
            }} addXp={function (amount: number): void {
              throw new Error('Function not implemented.');
            }} />
        ) : (
          <>
            {activeTab === 'student_dashboard' && <NeevStudentDashboard />}
            {activeTab === 'college_dashboard' && <NeevCollegeDashboard />}
            {activeTab === 'overview' && <NeevOverview branch={branch} setActiveTab={setActiveTab} />}
            {activeTab === 'catalog' && <NeevMarketplace onLocateOnMap={handleLocateOnMap} />}
            {activeTab === 'map' && <NeevMap locatedShelfId={locatedShelfId} onClearLocatedShelf={() => setLocatedShelfId(null)} />}
            {activeTab === 'member' && <NeevMember />}
            {activeTab === 'scanner' && <NeevScanner />}
            {activeTab === 'college' && <NeevCollege branch={branch} setBranch={setBranch} />}
            {activeTab === 'librarian' && <NeevLibrarian />}
          </>
        )}
      </main>
      <footer className="shrink-0 border-t border-slate-200 w-full bg-slate-50 relative z-10 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2 text-slate-500 text-xs">
          <p> 2026 NEEV PHYGITAL NETWORKS</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
