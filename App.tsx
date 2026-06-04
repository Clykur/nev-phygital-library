import React, { useState, useEffect } from 'react';
import { NeevHeader } from './components/NeevHeader';
import { NeevOverview } from './components/NeevOverview';
import { NeevMarketplace } from './components/NeevMarketplace';
import { NeevMap } from './components/NeevMap';
import { NeevMember } from './components/NeevMember';
import { NeevLibrarian } from './components/NeevLibrarian';
import { NeevCollege } from './components/NeevCollege';
import { NeevLanding } from './components/NeevLanding';
import { NeevStudentDashboard } from './components/NeevStudentDashboard';
import { NeevCollegeDashboard } from './components/NeevCollegeDashboard';
import { Footer } from './components/Footer';

import { useAuth } from './context/auth-context';
import { Info } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


const queryClient = new QueryClient();

const App: React.FC = () => {
  const { user, token, loading, logout, login, register } = useAuth();

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
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm font-medium bg-background">Loading session...</div>;
  }

  const isLoggedIn = !!user;
  const userRole = user?.baseRole === 'hub' ? 'college_ambassador' : (user ? 'student' : null);

  const handleLocateOnMap = (shelfId: string) => {
    setLocatedShelfId(shelfId.charAt(0));
    setActiveTab('map');
  };



  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col relative overflow-x-hidden">
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
              setActiveSegment={setLandingSegment}
              onLogin={async (email: string, password?: string) => {
                if (password) {
                  await login(email, password);
                }
              }}
              onGoogleLogin={async (token: string) => {
                // Usually handled by OAuth hook, but for now we might leave it as a placeholder if there's no backend endpoint, 
                // or call a specific API. Assuming login works with email/password first.
                console.log("Google Login token:", token);
              }}
              onSignUp={async (name: string, email: string, isPremium: boolean, hubLocationId: string, password?: string, role?: string) => {
                if (password) {
                  await register({
                    name,
                    email,
                    password,
                    accountType: role === "hub" ? "hub" : "user",
                    // If it's a hub, we need to pass additional fields. 
                    // Since the NeevLanding passes 'hubLocationId', we'll pass some defaults if it's a hub.
                    ...(role === "hub" ? { hubName: name, hubLocation: hubLocationId, hubKind: "university" } : {})
                  } as any);
                }
              }}
              addXp={(amount: number) => {
                console.log("Adding XP:", amount);
              }}
            />
          ) : (
            <>
              {activeTab === 'student_dashboard' && <NeevStudentDashboard />}
              {activeTab === 'college_dashboard' && <NeevCollegeDashboard />}
              {activeTab === 'overview' && <NeevOverview branch={branch} setActiveTab={setActiveTab} />}
              {activeTab === 'catalog' && <NeevMarketplace onLocateOnMap={handleLocateOnMap} />}
              {activeTab === 'map' && <NeevMap locatedShelfId={locatedShelfId} onClearLocatedShelf={() => setLocatedShelfId(null)} />}
              {activeTab === 'member' && <NeevMember />}
              {activeTab === 'college' && <NeevCollege branch={branch} setBranch={setBranch} />}
              {activeTab === 'librarian' && <NeevLibrarian />}
            </>
          )}
        </main>
        <Footer setActiveTab={setActiveTab} setLandingSegment={setLandingSegment} />
      </div>
    </QueryClientProvider>
  );
};

export default App;
