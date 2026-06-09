import { createContext, useContext, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import type { LucideIcon } from "lucide-react";
import {
  LogOut,
  Library,
  LayoutDashboard,
  BookOpen,
  Tag,
  Wallet,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/profile-avatar";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { PORTAL_PAGE_CONTAINER } from "@/lib/student-ui";
import {
  hubOverviewPathForUser,
  isHubAccount,
  portalPathsForUser,
  SUPER_ADMIN_PROFILE_PATH,
  HUB_PROFILE_PATH,
  STUDENT_PROFILE_PATH,
  STUDENT_DASHBOARD_PATH,
  STUDENT_BORROW_PATH,
  STUDENT_BOUNTY_PATH,
  STUDENT_WALLET_PATH,
  STUDENT_REQUESTS_PATH,
} from "@/lib/app-paths";
import { hubDeskGroupsForUser, isHubDeskPathActive } from "@/components/layout/HubDeskNav";

const StudentShellContext = createContext(false);

export function useStudentShell() {
  return useContext(StudentShellContext);
}

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

function UnifiedAppShell({
  children,
  shellHome,
  navItems,
  profileHref,
  portalName,
  checkActive,
  wrapContent,
}: {
  children: ReactNode;
  shellHome: string;
  navItems: NavItem[];
  profileHref: string;
  portalName: string;
  checkActive: (location: string, href: string) => boolean;
  wrapContent: boolean;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (!user) return null;

  const MOBILE_NAV_ITEMS = navItems.slice(0, 5);

  return (
    <StudentShellContext.Provider value={true}>
      <div className="min-h-[100dvh] bg-background flex flex-col">
        {/* Top Navigation for Desktop */}
        <header className="sticky top-0 z-40 hidden w-full h-16 backdrop-blur md:flex items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link
              href={shellHome}
              className="font-display text-xl font-extrabold tracking-tight text-foreground flex items-center"
            >
              <div className="relative flex items-center justify-center w-6 h-6 mr-2 bg-primary rounded-md shadow-sm">
                <Library className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              Neev
            </Link>
            <nav className="flex items-center gap-6 backdrop-blur" aria-label="Primary">
              {navItems.map((item) => {
                const active = checkActive(location, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "text-sm font-medium transition-colors whitespace-nowrap",
                      active
                        ? "font-semibold text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Link
              href={profileHref}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-sm font-semibold text-foreground leading-none">
                  {user?.name}
                </span>
                <span className="caption-scale font-bold uppercase tracking-kicker text-muted-foreground mt-1">
                  {portalName}
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
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between px-4 backdrop-blur md:hidden">
          <Link
            href={shellHome}
            className="font-display text-lg font-extrabold tracking-tight text-foreground flex items-center"
          >
            Neev
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={profileHref}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span className="caption-scale font-bold uppercase tracking-kicker text-muted-foreground">
                {portalName}
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
          {wrapContent ? (
            <div className={cn(PORTAL_PAGE_CONTAINER, "h-full pt-4")}>{children}</div>
          ) : (
            children
          )}
        </main>

        {/* Bottom Navigation for Mobile */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background/95 backdrop-blur md:hidden">
          {MOBILE_NAV_ITEMS.map((item) => {
            const active = checkActive(location, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-primary" : "")} />
                <span className={cn("caption-scale", active ? "font-semibold" : "font-medium")}>
                  {item.label}
                </span>
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

  if (!user) return null;

  if (isHubAccount(user)) {
    const shellHome =
      user.hubStaffHubIds.length > 0
        ? hubOverviewPathForUser(user)
        : portalPathsForUser(user).borrow;

    const navItems = hubDeskGroupsForUser(user)
      .flatMap((g) => g.tabs)
      .map((t) => ({
        label: t.label,
        href: t.href,
        icon: t.Icon,
      }));

    const profileHref =
      user?.baseRole === "super_admin" ? SUPER_ADMIN_PROFILE_PATH : HUB_PROFILE_PATH;
    const portalName = user?.baseRole === "super_admin" ? "Admin Portal" : "Hub Portal";

    return (
      <UnifiedAppShell
        shellHome={shellHome}
        navItems={navItems}
        profileHref={profileHref}
        portalName={portalName}
        checkActive={isHubDeskPathActive}
        wrapContent={true}
      >
        {children}
      </UnifiedAppShell>
    );
  }

  const studentNavItems = [
    { label: "Dashboard", href: STUDENT_DASHBOARD_PATH, icon: LayoutDashboard },
    { label: "Browse Books", href: STUDENT_BORROW_PATH, icon: BookOpen },
    { label: "Requests", href: STUDENT_REQUESTS_PATH, icon: ClipboardList },
    { label: "Bounty Books", href: STUDENT_BOUNTY_PATH, icon: Tag },
    { label: "Wallet", href: STUDENT_WALLET_PATH, icon: Wallet },
  ];

  return (
    <UnifiedAppShell
      shellHome={STUDENT_DASHBOARD_PATH}
      navItems={studentNavItems}
      profileHref={STUDENT_PROFILE_PATH}
      portalName="Student Portal"
      checkActive={(location, href) => location === href}
      wrapContent={false}
    >
      {children}
    </UnifiedAppShell>
  );
}
