import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Link, useLocation } from "wouter";
import { LogOut, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ProfileAvatar } from "@/components/profile-avatar";
import { useAuth } from "@/context/auth-context";
import { userFacingErrorMessage } from "@/lib/error-messages";
import { isPremiumOk } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { PORTAL_PAGE_CONTAINER } from "@/lib/student-ui";
import {
  hubOverviewPathForUser,
  isHubAccount,
  isHubDeskRoute,
  portalPathsForUser,
  SUPER_ADMIN_PROFILE_PATH,
  HUB_PROFILE_PATH,
  STUDENT_PROFILE_PATH,
} from "@/lib/app-paths";
import {
  DeskSidebarNav,
  HubDeskSidebarNav,
  HubDeskTabBar,
  studentDeskGroupsForUser,
} from "@/components/layout/HubDeskNav";
import { toast } from "sonner";

const StudentShellContext = createContext(false);

export function useStudentShell() {
  return useContext(StudentShellContext);
}

function DesktopPrimaryNav({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  if (!user) return null;
  if (isHubAccount(user)) {
    return user.hubStaffHubIds.length > 0 ? <HubDeskSidebarNav /> : null;
  }
  return <DeskSidebarNav groups={studentDeskGroupsForUser(user)} headerTitle="" />;
}

function MobileSheetNav({
  user,
  onClose,
  onUpgrade,
}: {
  user: ReturnType<typeof useAuth>["user"];
  onClose: () => void;
  onUpgrade: () => void;
}) {
  return (
    <>
      <nav className="flex flex-col gap-0">
        {!user ? null : isHubAccount(user) && user.hubStaffHubIds.length > 0 ? (
          <div className="border-b border-border/50 pb-3">
            <HubDeskSidebarNav onNavigate={onClose} />
          </div>
        ) : (
          <DeskSidebarNav
            groups={studentDeskGroupsForUser(user)}
            headerTitle=""
            onNavigate={onClose}
          />
        )}
      </nav>
      <div className="mt-auto space-y-2 border-t border-border/60 pt-4">
        <SidebarProfileRow onNavigate={onClose} />
        {user && !isPremiumOk(user) && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 rounded-lg border-primary/35 text-primary hover:bg-primary/10"
            onClick={() => {
              onClose();
              onUpgrade();
            }}
          >
            <Sparkles className="h-4 w-4" />
            Upgrade
          </Button>
        )}
      </div>
    </>
  );
}

import { Wallet } from "lucide-react";
import {
  STUDENT_DASHBOARD_PATH,
  STUDENT_BORROW_PATH,
  STUDENT_SELL_PATH,
  STUDENT_WALLET_PATH,
} from "@/lib/app-paths";

import { hubDeskGroupsForUser } from "@/components/layout/HubDeskNav";

function HubModernShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (!user) return null;

  const shellHome =
    user.hubStaffHubIds.length > 0
      ? hubOverviewPathForUser(user)
      : portalPathsForUser(user).borrow;

  const NAV_ITEMS = hubDeskGroupsForUser(user).flatMap((g) => g.tabs).map(t => ({
    label: t.label,
    href: t.href,
    icon: t.Icon,
  }));

  // Limit items for bottom nav on mobile
  const MOBILE_NAV_ITEMS = NAV_ITEMS.slice(0, 5);

  return (
    <StudentShellContext.Provider value={true}>
      <div className="min-h-[100dvh] bg-background flex flex-col">
        {/* Top Navigation for Desktop */}
        <header className="sticky top-0 z-40 hidden w-full h-16 border-b border-border/80 bg-background/95 backdrop-blur md:grid md:grid-cols-3 px-6">
          <div className="flex items-center">
            <Link
              href={shellHome}
              className="font-[var(--font-display)] text-xl font-extrabold tracking-tight text-foreground"
            >
              Neev
            </Link>
          </div>
          <div className="flex items-center justify-center">
            <nav className="flex items-center gap-2 backdrop-blur">
              {NAV_ITEMS.map((item) => {
                const active = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ease-in-out whitespace-nowrap",
                      active
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center justify-end gap-4">
            <Link href={user?.baseRole === "super_admin" ? SUPER_ADMIN_PROFILE_PATH : HUB_PROFILE_PATH} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-sm font-semibold text-foreground leading-none">{user?.name}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                  Hub Portal
                </span>
              </div>
              <ProfileAvatar name={user?.name || ""} size="sm" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {
                logout();
                setLocation("/");
              }}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur md:hidden">
          <Link
            href={shellHome}
            className="font-[var(--font-display)] text-lg font-extrabold tracking-tight text-foreground"
          >
            Neev
          </Link>
          <div className="flex items-center gap-3">
            <Link href={user?.baseRole === "super_admin" ? SUPER_ADMIN_PROFILE_PATH : HUB_PROFILE_PATH} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Hub Portal
              </span>
              <ProfileAvatar name={user?.name || ""} size="sm" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => {
                logout();
                setLocation("/");
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full pb-20 md:pb-0">
          <div className={cn(PORTAL_PAGE_CONTAINER, "h-full pt-4")}>
            {children}
          </div>
        </main>

        {/* Bottom Navigation for Mobile */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border/80 bg-background/95 backdrop-blur md:hidden">
          {MOBILE_NAV_ITEMS.map((item) => {
            const active = location === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-full h-full",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </StudentShellContext.Provider>
  );
}

import { LayoutDashboard, BookOpen, Tag } from "lucide-react";

function StudentModernShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const NAV_ITEMS = [
    { label: "Dashboard", href: STUDENT_DASHBOARD_PATH, icon: LayoutDashboard },
    { label: "Browse Books", href: STUDENT_BORROW_PATH, icon: BookOpen },
    { label: "Sell Books", href: STUDENT_SELL_PATH, icon: Tag },
    { label: "Wallet", href: STUDENT_WALLET_PATH, icon: Wallet },
  ];

  return (
    <StudentShellContext.Provider value={true}>
      <div className="min-h-[100dvh] bg-background flex flex-col">
        {/* Top Navigation for Desktop */}
        <header className="sticky top-0 z-40 hidden w-full h-16 border-b border-border/80 bg-background/95 backdrop-blur md:grid md:grid-cols-3 px-6">
          <div className="flex items-center">
            <Link
              href={STUDENT_DASHBOARD_PATH}
              className="font-[var(--font-display)] text-xl font-extrabold tracking-tight text-foreground"
            >
              Neev
            </Link>
          </div>
          <div className="flex items-center justify-center">
            <nav className="flex items-center gap-2 backdrop-blur">
              {NAV_ITEMS.map((item) => {
                const active = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-in-out",
                      active
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center justify-end gap-4">
            <Link href={STUDENT_PROFILE_PATH} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-sm font-semibold text-foreground leading-none">{user?.name}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                  Student Portal
                </span>
              </div>
              <ProfileAvatar name={user?.name || ""} size="sm" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {
                logout();
                setLocation("/");
              }}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur md:hidden">
          <Link
            href={STUDENT_DASHBOARD_PATH}
            className="font-[var(--font-display)] text-lg font-extrabold tracking-tight text-foreground"
          >
            Neev
          </Link>
          <div className="flex items-center gap-3">
            <Link href={STUDENT_PROFILE_PATH} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Student Portal
              </span>
              <ProfileAvatar name={user?.name || ""} size="sm" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => {
                logout();
                setLocation("/");
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full pb-20 md:pb-0">
          {children}
        </main>

        {/* Bottom Navigation for Mobile */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border/80 bg-background/95 backdrop-blur md:hidden">
          {NAV_ITEMS.map((item) => {
            const active = location === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-full h-full",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </StudentShellContext.Provider>
  );
}

export function StudentAppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (isHubAccount(user)) {
    return <HubModernShell>{children}</HubModernShell>;
  }
  return <StudentModernShell>{children}</StudentModernShell>;
}

function SidebarProfileRow({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  if (!user) return null;
  const profilePath = portalPathsForUser(user).profile;
  const active = location === profilePath;
  return (
    <div
      className={cn(
        "flex items-center rounded-xl border transition-colors",
        active
          ? "border-primary/30 bg-primary/10 text-foreground"
          : "border-border/50 bg-card/60 hover:bg-muted/50",
      )}
    >
      <Link
        href={profilePath}
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-3 pr-1"
      >
        <ProfileAvatar name={user.name} size="sm" className="shrink-0" />
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-semibold leading-tight text-foreground">
            {user.name}
          </span>
          <span
            className={cn(
              "mt-0.5 block truncate text-[10px] leading-snug",
              active ? "text-primary/80" : "text-muted-foreground",
            )}
          >
            {user.email}
          </span>
        </span>
      </Link>
      <div className="flex h-full shrink-0 items-center pr-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 text-muted-foreground hover:text-foreground",
            active && "hover:bg-primary/15",
          )}
          aria-label="Sign out"
          onClick={() => {
            logout();
            setLocation("/");
            onNavigate?.();
          }}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

