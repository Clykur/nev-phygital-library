import React, { useState } from 'react';
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/auth-context";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout/Layout";
import { StudentAppShell } from "@/components/layout/StudentAppShell";
import Home from "@/pages/home";
import Colleges from "@/pages/colleges";
import Marketplace from "@/pages/marketplace";
import About from "@/pages/about";
import SignInPage from "@/pages/sign-in";
import AnimatedAuthPage from "@/pages/login";
import HubOverviewPage from "@/pages/hub-overview";
import HubInventoryPage from "@/pages/hub-inventory";
import HubBookRequestsPage from "@/pages/hub-requests";
import HubDeskP2pListingsPage from "@/pages/hub-desk-p2p-listings";
import StudentTrackingPage from "@/pages/student-tracking";
import StudentAlertsPage from "@/pages/student-alerts";
import StudentProfilePage from "@/pages/student-profile";
import StudentLibraryPage from "@/pages/student-library";
import {
  adminHubPath,
  adminUserPath,
  ADMIN_HUBS_PATH,
  ADMIN_USERS_PATH,
  defaultLoggedInHome,
  HUB_ACTIVITY_PATH,
  HUB_CATALOG_PATH,
  HUB_INVENTORY_PATH,
  HUB_OVERVIEW_PATH,
  HUB_P2P_LISTINGS_PATH,
  HUB_REQUESTS_PATH,
  HUB_PROFILE_PATH,
  SUPER_ADMIN_ACTIVITY_PATH,
  SUPER_ADMIN_CATALOG_PATH,
  SUPER_ADMIN_INVENTORY_PATH,
  SUPER_ADMIN_OPERATIONS_PATH,
  SUPER_ADMIN_OVERVIEW_PATH,
  SUPER_ADMIN_P2P_LISTINGS_PATH,
  SUPER_ADMIN_PROFILE_PATH,
  SUPER_ADMIN_REQUESTS_PATH,
  STUDENT_DASHBOARD_PATH,
  STUDENT_WALLET_PATH,
  STUDENT_ACTIVITY_PATH,
  STUDENT_ALERTS_PATH,
  STUDENT_BORROW_PATH,
  STUDENT_LIBRARY_PATH,
  STUDENT_PROFILE_PATH,
  STUDENT_SELL_PATH,
} from "@/lib/app-paths";
import AdminUsersPage from "@/pages/admin-users";
import AdminUserDetailPage from "@/pages/admin-user-detail";
import AdminHubsPage from "@/pages/admin-hubs";
import AdminHubDetailPage from "@/pages/admin-hub-detail";
import SuperAdminOperationsPage from "@/pages/superadmin-operations";
import StudentDashboardPage from "@/pages/student-dashboard";
import StudentWalletPage from "@/pages/student-wallet";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

// Neev Components for Landing
import { NeevLanding } from '@/components/NeevLanding';
import { NeevHeader } from '@/components/NeevHeader';
import { Footer } from '@/components/Footer';

const queryClient = new QueryClient();

function hasHubPortalAccess(baseRole: string | undefined): boolean {
  return baseRole === "hub" || baseRole === "super_admin";
}

function HubStaffOverviewRoute() {
  const { user } = useAuth();
  if (!hasHubPortalAccess(user?.baseRole)) return <Redirect to={STUDENT_DASHBOARD_PATH} />;
  if (user?.baseRole === "super_admin") return <Redirect to={SUPER_ADMIN_OVERVIEW_PATH} />;
  return <HubOverviewPage />;
}

function SuperAdminOverviewRoute() {
  const { user } = useAuth();
  if (user?.baseRole === "super_admin") return <HubOverviewPage />;
  if (user?.baseRole === "hub") return <Redirect to={HUB_OVERVIEW_PATH} />;
  return <Redirect to={STUDENT_BORROW_PATH} />;
}

function HubDeskLegacyHomeRedirect() {
  const { user } = useAuth();
  if (user) return <Redirect to={defaultLoggedInHome(user)} />;
  return <Redirect to={HUB_OVERVIEW_PATH} />;
}

function ScrollToTop() {
  const [pathname] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function LoggedInHomeRedirect() {
  const { user } = useAuth();
  return <Redirect to={defaultLoggedInHome(user)} />;
}

function LegacyAppRedirect({ suffix }: { suffix: string }) {
  const { user } = useAuth();
  if (hasHubPortalAccess(user?.baseRole) && suffix === "borrow") {
    return <Redirect to={user?.baseRole === "super_admin" ? SUPER_ADMIN_INVENTORY_PATH : HUB_CATALOG_PATH} />;
  }
  if (hasHubPortalAccess(user?.baseRole) && suffix === "sell") {
    return <Redirect to={user ? defaultLoggedInHome(user) : HUB_OVERVIEW_PATH} />;
  }
  const prefix = hasHubPortalAccess(user?.baseRole)
    ? user?.baseRole === "super_admin"
      ? "/superadmin"
      : "/hub"
    : "/student";
  return <Redirect to={`${prefix}/${suffix}`} />;
}

function LegacyAppBorrowRoute() {
  return <LegacyAppRedirect suffix="borrow" />;
}
function LegacyAppSellRoute() {
  return <LegacyAppRedirect suffix="sell" />;
}
function LegacyAppActivityRoute() {
  return <LegacyAppRedirect suffix="activity" />;
}
function LegacyAppProfileRoute() {
  return <LegacyAppRedirect suffix="profile" />;
}

function StudentBorrowRoute() {
  const { user } = useAuth();
  if (user?.baseRole === "super_admin") return <Redirect to={SUPER_ADMIN_INVENTORY_PATH} />;
  if (user?.baseRole === "hub") return <Redirect to={HUB_CATALOG_PATH} />;
  return <Marketplace studentMode="browse" />;
}

function MarketplaceLoggedInRoute() {
  const { user } = useAuth();
  if (user?.baseRole === "super_admin") return <Redirect to={SUPER_ADMIN_OVERVIEW_PATH} />;
  if (user?.baseRole === "hub") return <Redirect to={HUB_OVERVIEW_PATH} />;
  return <Marketplace studentMode="browse" />;
}

function HubCatalogRoute() {
  const { user } = useAuth();
  if (!hasHubPortalAccess(user?.baseRole)) return <Redirect to={STUDENT_BORROW_PATH} />;
  if (user?.baseRole === "super_admin") return <Redirect to={SUPER_ADMIN_INVENTORY_PATH} />;
  return <Marketplace studentMode="browse" />;
}

function SuperAdminCatalogRoute() {
  const { user } = useAuth();
  if (!hasHubPortalAccess(user?.baseRole)) return <Redirect to={STUDENT_BORROW_PATH} />;
  if (user?.baseRole === "hub") return <Redirect to={HUB_CATALOG_PATH} />;
  if (user?.baseRole !== "super_admin") return <Redirect to={STUDENT_BORROW_PATH} />;
  return <Redirect to={SUPER_ADMIN_INVENTORY_PATH} />;
}

function HubBorrowLegacyRedirect() {
  const { user } = useAuth();
  if (user && !hasHubPortalAccess(user.baseRole)) return <Redirect to={STUDENT_BORROW_PATH} />;
  return <Redirect to={user?.baseRole === "super_admin" ? SUPER_ADMIN_INVENTORY_PATH : HUB_CATALOG_PATH} />;
}

function StudentSellRoute() {
  const { user } = useAuth();
  if (user?.baseRole === "hub" || user?.baseRole === "super_admin") {
    return <Redirect to={defaultLoggedInHome(user)} />;
  }
  return <Marketplace studentMode="sell" />;
}

function HubSellRemovedRedirect() {
  const { user } = useAuth();
  return <Redirect to={user ? defaultLoggedInHome(user) : HUB_OVERVIEW_PATH} />;
}

function StudentActivityRoute() {
  const { user } = useAuth();
  if (user?.baseRole === "super_admin") return <Redirect to={SUPER_ADMIN_ACTIVITY_PATH} />;
  if (user?.baseRole === "hub") return <Redirect to={HUB_ACTIVITY_PATH} />;
  return <StudentTrackingPage />;
}

function StudentAlertsRoute() {
  const { user } = useAuth();
  if (user?.baseRole === "super_admin") return <Redirect to={SUPER_ADMIN_ACTIVITY_PATH} />;
  if (user?.baseRole === "hub") return <Redirect to={HUB_ACTIVITY_PATH} />;
  return <StudentAlertsPage />;
}

function HubActivityRoute() {
  const { user } = useAuth();
  if (!hasHubPortalAccess(user?.baseRole)) return <Redirect to={STUDENT_ACTIVITY_PATH} />;
  if (user?.baseRole === "super_admin") return <Redirect to={SUPER_ADMIN_ACTIVITY_PATH} />;
  return <StudentTrackingPage />;
}

function SuperAdminActivityRoute() {
  const { user } = useAuth();
  if (!hasHubPortalAccess(user?.baseRole)) return <Redirect to={STUDENT_ACTIVITY_PATH} />;
  if (user?.baseRole === "hub") return <Redirect to={HUB_ACTIVITY_PATH} />;
  if (user?.baseRole !== "super_admin") return <Redirect to={STUDENT_BORROW_PATH} />;
  return <StudentTrackingPage />;
}

function StudentProfileRoute() {
  const { user } = useAuth();
  if (user?.baseRole === "super_admin") return <Redirect to={SUPER_ADMIN_PROFILE_PATH} />;
  if (user?.baseRole === "hub") return <Redirect to={HUB_PROFILE_PATH} />;
  return <StudentProfilePage />;
}

function HubProfileRoute() {
  const { user } = useAuth();
  if (!hasHubPortalAccess(user?.baseRole)) return <Redirect to={STUDENT_PROFILE_PATH} />;
  if (user?.baseRole === "super_admin") return <Redirect to={SUPER_ADMIN_PROFILE_PATH} />;
  return <StudentProfilePage />;
}

function SuperAdminProfileRoute() {
  const { user } = useAuth();
  if (!hasHubPortalAccess(user?.baseRole)) return <Redirect to={STUDENT_PROFILE_PATH} />;
  if (user?.baseRole === "hub") return <Redirect to={HUB_PROFILE_PATH} />;
  if (user?.baseRole !== "super_admin") return <Redirect to={STUDENT_BORROW_PATH} />;
  return <StudentProfilePage />;
}

function HubInventoryDeskRoute() {
  const { user } = useAuth();
  if (!hasHubPortalAccess(user?.baseRole)) return <Redirect to={STUDENT_DASHBOARD_PATH} />;
  if (user?.baseRole === "super_admin") return <Redirect to={SUPER_ADMIN_INVENTORY_PATH} />;
  return <HubInventoryPage />;
}

function SuperAdminInventoryRoute() {
  const { user } = useAuth();
  if (user?.baseRole === "hub") return <Redirect to={HUB_INVENTORY_PATH} />;
  if (user?.baseRole !== "super_admin") return <Redirect to={STUDENT_BORROW_PATH} />;
  return <HubInventoryPage />;
}

function HubBookRequestsDeskRoute() {
  const { user } = useAuth();
  if (!hasHubPortalAccess(user?.baseRole)) return <Redirect to={STUDENT_DASHBOARD_PATH} />;
  if (user?.baseRole === "super_admin") return <Redirect to={SUPER_ADMIN_REQUESTS_PATH} />;
  return <HubBookRequestsPage />;
}

function SuperAdminBookRequestsRoute() {
  const { user } = useAuth();
  if (user?.baseRole === "hub") return <Redirect to={HUB_REQUESTS_PATH} />;
  if (user?.baseRole !== "super_admin") return <Redirect to={STUDENT_BORROW_PATH} />;
  return <Redirect to={SUPER_ADMIN_OVERVIEW_PATH} />;
}

function HubP2pListingsDeskRoute() {
  const { user } = useAuth();
  if (!hasHubPortalAccess(user?.baseRole)) return <Redirect to={STUDENT_DASHBOARD_PATH} />;
  if (user?.baseRole === "super_admin") return <Redirect to={SUPER_ADMIN_P2P_LISTINGS_PATH} />;
  return <HubDeskP2pListingsPage />;
}

function SuperAdminP2pListingsRoute() {
  const { user } = useAuth();
  if (!hasHubPortalAccess(user?.baseRole)) return <Redirect to={STUDENT_BORROW_PATH} />;
  if (user?.baseRole === "hub") return <Redirect to={HUB_P2P_LISTINGS_PATH} />;
  if (user?.baseRole !== "super_admin") return <Redirect to={STUDENT_BORROW_PATH} />;
  return <HubDeskP2pListingsPage />;
}

function StudentDashboardRoute() {
  const { user } = useAuth();
  if (user?.baseRole === "hub" || user?.baseRole === "super_admin") {
    return <Redirect to={defaultLoggedInHome(user)} />;
  }
  return <StudentDashboardPage />;
}

function StudentLibraryRoute() {
  const { user } = useAuth();
  if (user?.baseRole === "hub" || user?.baseRole === "super_admin") {
    return <Redirect to={defaultLoggedInHome(user)} />;
  }
  return <StudentLibraryPage />;
}

function StudentWalletRoute() {
  const { user } = useAuth();
  if (user?.baseRole === "hub" || user?.baseRole === "super_admin") {
    return <Redirect to={defaultLoggedInHome(user)} />;
  }
  return <StudentWalletPage />;
}

function PublicRoutes() {
  const { login, loginGoogle, register, user, token } = useAuth();
  const [landingSegment, setLandingSegment] = useState<'students' | 'colleges'>('students');
  const [branch, setBranch] = useState<string>('RVCE-BLR');
  const [activeTab, setActiveTab] = useState<string>('landing');

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col relative overflow-x-hidden">
      <NeevHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        branch={branch}
        setBranch={setBranch}
        isLoggedIn={!!user}
        userRole={user?.baseRole as any ?? null}
        onLogout={() => { }}
        landingSegment={landingSegment}
        setLandingSegment={setLandingSegment}
      />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {activeTab === 'catalog' ? (
          <Marketplace />
        ) : (
          <NeevLanding
            activeSegment={landingSegment}
            setActiveSegment={setLandingSegment}
            onLogin={async (email: string, password?: string) => {
              if (password) {
                await login(email, password);
              }
            }}
            onGoogleLogin={async (token: string) => {
              await loginGoogle(token);
            }}
            onSignUp={async (name: string, email: string, isPremium: boolean, hubLocationId: string, password?: string, role?: string, hubName?: string, hubKind?: string) => {
              if (password) {
                await register({
                  name,
                  email,
                  password,
                  accountType: role === "super_admin" ? "super_admin" : role === "hub" ? "hub" : "user",
                  ...(role === "hub" || role === "super_admin" ? { hubName: hubName || name, hubLocation: hubLocationId, hubKind: hubKind || "college" } : { hubLocation: hubLocationId })
                } as any);
              }
            }}
            addXp={(amount: number) => {
              console.log("Adding XP:", amount);
            }}
          />
        )}
      </main>
      <Footer setActiveTab={() => { }} setLandingSegment={setLandingSegment} />
    </div>
  );
}

function LoggedInRoutes() {
  return (
    <StudentAppShell>
      <ScrollToTop />
      <Switch>
        <Route path={STUDENT_DASHBOARD_PATH} component={StudentDashboardRoute} />
        <Route path={STUDENT_WALLET_PATH} component={StudentWalletRoute} />
        <Route path="/student/borrow" component={StudentBorrowRoute} />
        <Route path="/student/buy">
          <Redirect to={STUDENT_BORROW_PATH} />
        </Route>
        <Route path="/student/sell" component={StudentSellRoute} />
        <Route path="/student/activity" component={StudentActivityRoute} />
        <Route path={STUDENT_LIBRARY_PATH} component={StudentLibraryRoute} />
        <Route path={STUDENT_ALERTS_PATH} component={StudentAlertsRoute} />
        <Route path="/student/profile" component={StudentProfileRoute} />
        <Route path="/student/tracking">
          <Redirect to={STUDENT_ACTIVITY_PATH} />
        </Route>
        <Route path="/student">
          <Redirect to={STUDENT_DASHBOARD_PATH} />
        </Route>

        <Route path={SUPER_ADMIN_CATALOG_PATH} component={SuperAdminCatalogRoute} />
        <Route path={HUB_CATALOG_PATH} component={HubCatalogRoute} />
        <Route path="/hub/borrow" component={HubBorrowLegacyRedirect} />
        <Route path="/hub/buy">
          <Redirect to={HUB_CATALOG_PATH} />
        </Route>
        <Route path="/hub/sell" component={HubSellRemovedRedirect} />
        <Route path={SUPER_ADMIN_ACTIVITY_PATH} component={SuperAdminActivityRoute} />
        <Route path="/hub/activity" component={HubActivityRoute} />
        <Route path={SUPER_ADMIN_PROFILE_PATH} component={SuperAdminProfileRoute} />
        <Route path="/hub/profile" component={HubProfileRoute} />
        <Route path="/hub/library">
          <Redirect to={HUB_CATALOG_PATH} />
        </Route>
        <Route path="/hub/discover">
          <Redirect to={HUB_CATALOG_PATH} />
        </Route>
        <Route path="/hub/tracking">
          <Redirect to={HUB_ACTIVITY_PATH} />
        </Route>
        <Route path={SUPER_ADMIN_OVERVIEW_PATH} component={SuperAdminOverviewRoute} />
        <Route path={HUB_OVERVIEW_PATH} component={HubStaffOverviewRoute} />
        <Route path={SUPER_ADMIN_INVENTORY_PATH} component={SuperAdminInventoryRoute} />
        <Route path={HUB_INVENTORY_PATH} component={HubInventoryDeskRoute} />
        <Route path={SUPER_ADMIN_REQUESTS_PATH} component={SuperAdminBookRequestsRoute} />
        <Route path={HUB_REQUESTS_PATH} component={HubBookRequestsDeskRoute} />
        <Route path={SUPER_ADMIN_P2P_LISTINGS_PATH} component={SuperAdminP2pListingsRoute} />
        <Route path={HUB_P2P_LISTINGS_PATH} component={HubP2pListingsDeskRoute} />
        <Route path={SUPER_ADMIN_OPERATIONS_PATH} component={SuperAdminOperationsPage} />
        <Route path={ADMIN_USERS_PATH} component={AdminUsersPage} />
        <Route path={`${ADMIN_USERS_PATH}/:userId`} component={AdminUserDetailPage} />
        <Route path={ADMIN_HUBS_PATH} component={AdminHubsPage} />
        <Route path={`${ADMIN_HUBS_PATH}/:hubId`} component={AdminHubDetailPage} />
        <Route path="/admin/users/:userId">
          {(params: any) => <Redirect to={adminUserPath(params?.userId!)} />}
        </Route>
        <Route path="/admin/users">
          <Redirect to={ADMIN_USERS_PATH} />
        </Route>
        <Route path="/admin/hubs/:hubId">
          {(params: any) => <Redirect to={adminHubPath(params?.hubId!)} />}
        </Route>
        <Route path="/admin/hubs">
          <Redirect to={ADMIN_HUBS_PATH} />
        </Route>
        <Route path="/hub/desk" component={HubDeskLegacyHomeRedirect} />
        <Route path="/hub-desk" component={HubDeskLegacyHomeRedirect} />
        <Route path="/hub">
          <LoggedInHomeRedirect />
        </Route>

        <Route path="/app/buy" component={LegacyAppBorrowRoute} />
        <Route path="/app/borrow" component={LegacyAppBorrowRoute} />
        <Route path="/app/sell" component={LegacyAppSellRoute} />
        <Route path="/app/activity" component={LegacyAppActivityRoute} />
        <Route path="/app/profile" component={LegacyAppProfileRoute} />
        <Route path="/app/library" component={LegacyAppBorrowRoute} />
        <Route path="/app/discover" component={LegacyAppBorrowRoute} />
        <Route path="/app/tracking" component={LegacyAppActivityRoute} />
        <Route path="/app">
          <LoggedInHomeRedirect />
        </Route>

        <Route path="/library">
          <LoggedInHomeRedirect />
        </Route>
        <Route path="/marketplace" component={MarketplaceLoggedInRoute} />
        <Route path="/">
          <LoggedInHomeRedirect />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </StudentAppShell>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (user) {
    return <LoggedInRoutes />;
  }

  return <PublicRoutes />;
}

function Router() {
  return <AppRoutes />;
}

import { WalletProvider } from "@/context/wallet-context";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WalletProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
            <SonnerToaster theme="dark" position="bottom-right" />
          </TooltipProvider>
        </WalletProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
