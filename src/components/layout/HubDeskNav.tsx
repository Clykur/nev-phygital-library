import { Link, useLocation } from "wouter";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Building2,
  ClipboardList,
  History,
  LayoutDashboard,
  ListOrdered,
  Library,
  Package,
  Radio,
  Tag,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/rbac";
import { useAuth } from "@/context/auth-context";
import {
  ADMIN_HUBS_PATH,
  ADMIN_USERS_PATH,
  HUB_CATALOG_PATH,
  HUB_INVENTORY_PATH,
  SUPER_ADMIN_OPERATIONS_PATH,
  SUPER_ADMIN_CATALOG_PATH,
  SUPER_ADMIN_INVENTORY_PATH,
  SUPER_ADMIN_P2P_LISTINGS_PATH,
  HUB_P2P_LISTINGS_PATH,
  hubOverviewPathForUser,
  portalPathsForUser,
} from "@/lib/app-paths";

type DeskTab = {
  href: string;
  label: string;
  hint: string;
  Icon: LucideIcon;
};

type DeskGroup = {
  id: string;
  title: string;
  subtitle: string;
  tabs: DeskTab[];
};

/** Student shell: same grouping + link styling as hub desk. */
export function studentDeskGroupsForUser(user: AuthUser): DeskGroup[] {
  const p = portalPathsForUser(user);
  return [
    {
      id: "library",
      title: "Library",
      subtitle: "Books",
      tabs: [
        {
          href: p.borrow,
          label: "Browse books",
          hint: "Find available books",
          Icon: BookOpen,
        },
        {
          href: p.sell,
          label: "Sell books",
          hint: "Manage your listings",
          Icon: Tag,
        },
      ],
    },
    {
      id: "you",
      title: "You",
      subtitle: "Your account",
      tabs: [
        {
          href: p.library,
          label: "My library",
          hint: "Books you hold",
          Icon: Library,
        },
        {
          href: p.activity,
          label: "My activity",
          hint: "History and status",
          Icon: ClipboardList,
        },
        {
          href: p.alerts,
          label: "Alerts",
          hint: "Updates and reminders",
          Icon: Bell,
        },
      ],
    },
  ];
}

/**
 * Hub desk nav: merge inventory + catalog into one row. Super admin uses `/superadmin/…` URLs; hub staff use `/hub/…`.
 */
export function hubDeskGroupsForUser(user: AuthUser): DeskGroup[] {
  const p = portalPathsForUser(user);
  const overviewHref = hubOverviewPathForUser(user);
  const allCopiesTab: DeskTab = {
    href: p.inventory,
    label: "Inventory",
    hint: "Physical inventory · hub & peer",
    Icon: Package,
  };
  if (user.baseRole === "super_admin") {
    return [
      {
        id: "monitor",
        title: "Monitor",
        subtitle: "Overview & triage",
        tabs: [
          {
            href: overviewHref,
            label: "Dashboard",
            hint: "Control tower & KPIs",
            Icon: LayoutDashboard,
          },
          {
            href: SUPER_ADMIN_OPERATIONS_PATH,
            label: "Health",
            hint: "Issues & alerts",
            Icon: Radio,
          },
        ],
      },
      {
        id: "operate",
        title: "Operate",
        subtitle: "Inventory & pipeline",
        tabs: [
          allCopiesTab,
          {
            href: p.p2pListings,
            label: "Peer-to-Peer",
            hint: "Pre-shelf pipeline",
            Icon: ListOrdered,
          },
        ],
      },

      {
        id: "directory",
        title: "Directory",
        subtitle: "Accounts & access",
        tabs: [
          {
            href: ADMIN_USERS_PATH,
            label: "Users",
            hint: "Accounts & access",
            Icon: Users,
          },
          {
            href: ADMIN_HUBS_PATH,
            label: "Hubs",
            hint: "Locations & permissions",
            Icon: Building2,
          },
        ],
      },
    ];
  }

  return [
    {
      id: "operations",
      title: "Operations",
      subtitle: "Run the desk",
      tabs: [
        {
          href: overviewHref,
          label: "Dashboard",
          hint: "Alerts & metrics",
          Icon: LayoutDashboard,
        },
        {
          href: p.requests,
          label: "Requests",
          hint: "Request lifecycle",
          Icon: ClipboardList,
        },
        allCopiesTab,
        {
          href: p.p2pListings,
          label: "Peer-to-Peer",
          hint: "Pipeline · not on shelf yet",
          Icon: ListOrdered,
        },
        {
          href: p.activity,
          label: "Activity",
          hint: "Personal loans & requests",
          Icon: History,
        },
      ],
    },

  ];
}

function isHubDeskPathActive(location: string, href: string): boolean {
  if (href === HUB_INVENTORY_PATH || href === SUPER_ADMIN_INVENTORY_PATH) {
    return (
      location === HUB_INVENTORY_PATH ||
      location === HUB_CATALOG_PATH ||
      location === SUPER_ADMIN_INVENTORY_PATH ||
      location === SUPER_ADMIN_CATALOG_PATH
    );
  }
  if (href === HUB_P2P_LISTINGS_PATH || href === SUPER_ADMIN_P2P_LISTINGS_PATH) {
    return location === HUB_P2P_LISTINGS_PATH || location === SUPER_ADMIN_P2P_LISTINGS_PATH;
  }
  if (href === ADMIN_USERS_PATH) {
    return location === ADMIN_USERS_PATH || location.startsWith(`${ADMIN_USERS_PATH}/`);
  }
  if (href === ADMIN_HUBS_PATH) {
    return location === ADMIN_HUBS_PATH || location.startsWith(`${ADMIN_HUBS_PATH}/`);
  }
  return location === href;
}

/** Grouped vertical nav — shared by hub desk and student shell. */
export function DeskSidebarNav({
  groups,
  headerTitle,
  onNavigate,
}: {
  groups: DeskGroup[];
  headerTitle: string;
  onNavigate?: () => void;
}) {
  const [location] = useLocation();
  return (
    <div className="flex flex-col gap-0">
      {headerTitle ? (
        <div className="mb-3 px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {headerTitle}
          </p>
        </div>
      ) : null}

      {groups.map((group, gi) => (
        <div key={group.id}>
          {gi > 0 ? <div className="mb-2 border-t border-border/60 pt-3" aria-hidden /> : null}
          <div className="mb-1.5 px-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/90">
              {group.title}
            </p>
            <p className="text-[9px] text-muted-foreground/65">{group.subtitle}</p>
          </div>
          <div className="flex flex-col gap-0.5">
            {group.tabs.map((tab) => {
              const active = isHubDeskPathActive(location, tab.href);
              const Icon = tab.Icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-foreground dark:bg-primary/15"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-primary" : "opacity-80",
                    )}
                    aria-hidden
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-tight">
                    <span className="truncate">{tab.label}</span>
                    <span
                      className={cn(
                        "truncate text-[10px] font-normal",
                        active ? "text-primary/75" : "text-muted-foreground/90",
                      )}
                    >
                      {tab.hint}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Hub desk — desktop sidebar & mobile sheet. */
export function HubDeskSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  if (!user) return null;
  const groups = hubDeskGroupsForUser(user);
  const headerTitle = user.baseRole === "super_admin" ? "Network desk" : "";
  return <DeskSidebarNav groups={groups} headerTitle={headerTitle} onNavigate={onNavigate} />;
}

/** Horizontal strip for small screens (no persistent sidebar). */
export function HubDeskMobileTabStrip() {
  const [location] = useLocation();
  const { user } = useAuth();
  const tabs = user ? hubDeskGroupsForUser(user).flatMap((g) => g.tabs) : [];
  return (
    <div className="mb-3 md:hidden">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const active = isHubDeskPathActive(location, tab.href);
          const Icon = tab.Icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-primary/35 bg-primary/10 text-foreground dark:border-primary/40 dark:bg-primary/12"
                  : "border-border/50 text-muted-foreground hover:border-primary/25 hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** @deprecated Use {@link HubDeskMobileTabStrip}; kept for StudentAppShell import name. */
export function HubDeskTabBar() {
  return <HubDeskMobileTabStrip />;
}
