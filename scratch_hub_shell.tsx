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
            <Link href={user?.baseRole === "super_admin" ? SUPER_ADMIN_PROFILE_PATH : HUB_PROFILE_PATH}>
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
            <Link href={user?.baseRole === "super_admin" ? SUPER_ADMIN_PROFILE_PATH : HUB_PROFILE_PATH}>
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
