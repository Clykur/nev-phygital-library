import { useQuery } from "@tanstack/react-query";
import { HubCommerceSection } from "@/components/hub/HubCommerceSection";
import { HubStudentAnalytics, HubStudentsSection } from "@/components/hub/HubStudentsManagement";
import { Button } from "@/components/ui/button";
import { uniformBadgeShape } from "@/lib/status-badges";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudentShell } from "@/components/layout/StudentAppShell";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { hubKindLabel } from "@/lib/hub-display";
import { PORTAL_INLINE_LINK, PORTAL_PAGE_GUTTER_X, PORTAL_PANEL_SURFACE } from "@/lib/student-ui";
import { PORTAL_PAGE_LEAD, PORTAL_PAGE_TITLE, PORTAL_STAT_VALUE } from "@/lib/portal-typography";
import { adminSelectTrigger } from "@/lib/admin-desk-ui";
import { portalPathsForUser } from "@/lib/app-paths";
import { ClipboardList, Loader2, Package, Shield, Wallet, type LucideIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";

type Hub = { id: string; name: string; kind?: string };

type OverviewRange = "today" | "week" | "month";

type HubOverviewPayload = {
  range: OverviewRange;
  hub: {
    id: string;
    name: string;
    kind: string;
    isActive: boolean;
    description: string | null;
  } | null;
  hubScope: { all: boolean; hubCount: number; label: string };
  metrics: {
    totalBooks: number;
    available: number;
    checkedOut: number;
    reserved: number;
    unavailable: number;
    sold: number;
    activeRequests: number;
    pendingRequests: number;
    fulfilledRequestsToday: number;
    fulfilledRequestsInRange: number;
    readyForPickup: number;
    p2pPending: number;
    p2pOnShelf: number;
    bountyOpenRequests?: number;
    bountyBooksAcquired?: number;
    bountyPendingDeliveries?: number;
    bountyTotalRewardValue?: number;
    bountyFulfilledRequests?: number;
    transactionsToday: number;
    transactionsInRange: number;
  };
  requestBreakdown: Record<string, number>;
  recentActivity: Array<{
    id: string;
    action: string;
    label: string;
    createdAt: string;
    actorUserId: string | null;
  }>;
  inventory: {
    recent: Array<{
      id: string;
      title: string;
      status: string;
      hubId: string;
      createdAt: string;
    }>;
    lowAvailability: Array<{ id: string; title: string; hubId: string }>;
    unavailable: Array<{
      id: string;
      title: string;
      hubId: string;
      updatedAt: string;
    }>;
  };
  p2p: {
    pending: Array<{
      id: string;
      bookTitle: string;
      status: string;
      price: number;
      updatedAt: string;
    }>;
    onShelf: Array<{
      id: string;
      bookTitle: string;
      status: string;
      price: number;
      updatedAt: string;
    }>;
    recentSales: Array<{
      id: string;
      bookTitle: string;
      price: number;
      soldAt: string | null;
    }>;
  };
  alerts: Array<{
    kind: string;
    message: string;
    count?: number;
    severity: "critical" | "warning" | "info";
  }>;
  bounty?: {
    openRequests: number;
    booksAcquired: number;
    pendingDeliveries: number;
    totalRewardValue: number;
    fulfilledRequests: number;
  };
  topRequestedTitles: Array<{ title: string; count: number }>;
};

type SuperAdminNetworkKpis = {
  hubsTotal: number;
  hubsActive: number;
  usersTotal: number;
  studentAccounts: number;
  hubOperatorAccounts: number;
  superAdmins: number;
  activePremiumSubscribers: number;
};

type SuperAdminDerivatives = {
  periodLabelDays: number;
  transactionsPerDay: number;
  shelfUtilizationPct: number;
  requestTerminalSuccessPct: number | null;
  p2pDropoffBacklogRatio: number;
};

type HubAttentionRow = {
  hubId: string;
  hubName: string;
  isActive: boolean;
  kind: string;
  attentionScore: number;
  pendingDesk: number;
  readyPickup: number;
  p2pDropoffsPending: number;
  onShelfCopies: number;
  checkedOut: number;
  shelfUtilizationPct: number;
};

type SuperAdminOverviewPayload = HubOverviewPayload & {
  network: SuperAdminNetworkKpis;
  executive: {
    derivatives: SuperAdminDerivatives;
    hubAttention: HubAttentionRow[];
  };
};

/** Second-key sort: pending → ready pickup → consignment / low stock → expired. */

const REQUEST_KEYS = ["pending", "available_for_collection", "delivered", "cancelled"] as const;

function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="section-kicker">{children}</h2>;
}

function DeskQuickLink({
  href,
  title,
  hint,
  icon: Icon,
}: {
  href: string;
  title: string;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className={cn(PORTAL_PANEL_SURFACE, "flex items-start gap-3 p-4 transition-colors hover:")}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" aria-hidden />
      <div className="min-w-0">
        <p className="body-scale font-semibold leading-tight text-foreground">{title}</p>
        <p className="mt-0.5 caption-scale font-medium leading-snug text-foreground-muted">
          {hint}
        </p>
      </div>
    </Link>
  );
}

/** Label + value inside a grid cell (borders come from parent `divide-*`). */
function StatCell({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="p-3">
      <p className="section-kicker">{label}</p>
      <p className={cn("mt-1", PORTAL_STAT_VALUE)}>{value}</p>
      {sub ? <p className="mt-1 caption-scale font-medium text-foreground-subtle">{sub}</p> : null}
    </div>
  );
}

function pipelineBarLabel(key: string): string {
  switch (key) {
    case "pending":
      return "Pending";
    case "available_for_collection":
      return "Available for Collection";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return key.replace(/_/g, " ");
  }
}

function executiveFunnelFromBreakdown(requestBreakdown: HubOverviewPayload["requestBreakdown"]) {
  const g = (k: string) => requestBreakdown[k] ?? 0;
  return {
    needAction: g("pending"),
    inPrep: g("available_for_collection"),
    completed: g("delivered"),
    closed: g("cancelled"),
  };
}

export default function HubOverviewPage() {
  const { token, user, loading } = useAuth();
  const inShell = useStudentShell();
  const [overviewHubId, setOverviewHubId] = useState<string>("all");
  const [overviewRange, setOverviewRange] = useState<OverviewRange>("week");
  const isSuperAdmin = user?.baseRole === "super_admin";

  const deskPaths = useMemo(() => {
    if (!user || user.hubStaffHubIds.length === 0) return null;
    return portalPathsForUser(user);
  }, [user]);

  const hubsQ = useQuery({
    queryKey: ["catalog", "hubs", "hub-overview"],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: () => apiFetch<{ hubs: Hub[] }>("/api/catalog/hubs", { token: token! }),
  });

  const overviewQ = useQuery({
    queryKey: [
      "hub",
      isSuperAdmin ? "super-admin-overview" : "overview",
      token,
      overviewHubId,
      overviewRange,
    ],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: () => {
      const hubQ = overviewHubId === "all" ? "" : `&hubId=${encodeURIComponent(overviewHubId)}`;
      const path = isSuperAdmin ? "/api/hub/super-admin-overview" : "/api/hub/overview";
      return apiFetch<
        HubOverviewPayload & Partial<Pick<SuperAdminOverviewPayload, "network" | "executive">>
      >(`${path}?range=${overviewRange}${hubQ}`, { token: token! });
    },
  });

  const topPad = inShell ? "" : "pt-24";

  if (loading) {
    return (
      <div className={cn("flex min-h-[50dvh] items-center justify-center", topPad)}>
        <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (!user?.hubStaffHubIds.length) {
    return (
      <div
        className={cn(
          "mx-auto max-w-lg pb-20 text-center",
          PORTAL_PAGE_GUTTER_X,
          inShell ? "pt-8" : "pt-28",
        )}
      >
        <div
          className={cn(
            "mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-border ",
          )}
        >
          <Shield className="h-7 w-7 text-foreground-muted" />
        </div>
        <h1 className="mt-6 h3-scale font-bold tracking-tight">Dashboard restricted</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Hub staff memberships unlock this dashboard.
        </p>
        <Button asChild className="mt-8 rounded-md">
          <Link href={user ? portalPathsForUser(user).borrow : "/library"}>
            {user ? "Back to borrow" : "Browse catalog"}
          </Link>
        </Button>
      </div>
    );
  }

  const ov = overviewQ.data;
  const network: SuperAdminNetworkKpis | undefined =
    isSuperAdmin && ov && "network" in ov ? (ov as SuperAdminOverviewPayload).network : undefined;
  const executive =
    isSuperAdmin && ov && "executive" in ov
      ? (ov as SuperAdminOverviewPayload).executive
      : undefined;
  const rangeLabel =
    overviewRange === "today" ? "Today" : overviewRange === "week" ? "Last 7 days" : "Last 30 days";
  const execFunnel = ov
    ? executiveFunnelFromBreakdown(ov.requestBreakdown)
    : { needAction: 0, inPrep: 0, completed: 0, closed: 0 };

  const d = deskPaths!;

  return (
    <div className={cn(topPad, "pb-10 lg:pb-10")}>
      {/* Title + filters scroll with the page (not sticky) */}
      <div className="mb-6 border-b border-border pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1 font-sans">
            <h1 className={cn("mt-1", PORTAL_PAGE_TITLE)}>
              {isSuperAdmin ? "Network overview" : "Dashboard"}
            </h1>
            <p className={cn("mt-2 max-w-2xl", PORTAL_PAGE_LEAD)}>
              Manage and monitor your hub's inventory, requests, and student activity.
            </p>
            {isSuperAdmin ? (
              <p className={cn("mt-2 max-w-2xl", PORTAL_PAGE_LEAD)}>
                Prioritized queues, network KPIs, and rates. Not a product catalog. Use{" "}
                <span className="font-semibold text-foreground">Scope</span> to focus one hub.
              </p>
            ) : null}
          </div>

          <div
            className={cn(
              "grid w-full gap-3 shrink-0",
              user.hubStaffHubIds.length > 1
                ? "grid-cols-1 sm:grid-cols-2 sm:min-w-[22rem] lg:min-w-[24rem] lg:max-w-[min(32rem,100%)]"
                : "grid-cols-1 sm:max-w-[11rem] sm:justify-self-end",
            )}
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="hub-overview-period" className="section-kicker">
                Period
              </Label>
              <Select
                value={overviewRange}
                onValueChange={(v) => setOverviewRange(v as OverviewRange)}
              >
                <SelectTrigger
                  id="hub-overview-period"
                  className={cn(adminSelectTrigger, "text-primary")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {user.hubStaffHubIds.length > 1 ? (
              <div className="flex min-w-0 flex-col gap-1.5">
                <Label htmlFor="hub-overview-scope" className="section-kicker">
                  Network scope
                </Label>
                <Select value={overviewHubId} onValueChange={setOverviewHubId}>
                  <SelectTrigger id="hub-overview-scope" className={adminSelectTrigger}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All hubs ({user.hubStaffHubIds.length})</SelectItem>
                    {user.hubStaffHubIds.map((id) => (
                      <SelectItem key={id} value={id}>
                        {hubsQ.data?.hubs.find((h) => h.id === id)?.name ?? id.slice(0, 8) + "…"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {overviewQ.isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-9 w-9 animate-spin text-foreground-muted" />
        </div>
      ) : overviewQ.isError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Could not load overview.
        </p>
      ) : ov ? (
        <div className="space-y-6">
          {isSuperAdmin && network && executive ? (
            <>
              <section
                className={cn(PORTAL_PANEL_SURFACE, "px-4 py-3")}
                aria-label="System health strip"
              >
                <SectionLabel>Health</SectionLabel>
                <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                  <p className="text-foreground-muted">
                    Queue backlog: <span className="text-foreground">{execFunnel.needAction}</span>
                  </p>
                  <p className="text-foreground-muted">
                    Stale requests:{" "}
                    <span className="text-foreground">{ov.requestBreakdown["expired"] ?? 0}</span>
                  </p>
                </div>
              </section>
              <header className={cn(PORTAL_PANEL_SURFACE, "p-4 md:p-5")}>
                <h1 className="h4-scale font-semibold text-foreground">Business control tower</h1>
                <div className="mt-2 max-w-full overflow-x-auto overflow-y-hidden pb-0.5">
                  <p className="w-max whitespace-nowrap body-scale font-normal text-foreground-muted">
                    <span className="font-medium text-foreground">{ov.hubScope.label}</span>
                    {" · "}
                    {rangeLabel}. Queue scores rank hubs by pending desk, ready pickup, and peer
                    drop-off backlog.
                  </p>
                </div>
              </header>

              <section
                aria-label="Network footprint"
                className={cn(PORTAL_PANEL_SURFACE, "overflow-hidden")}
              >
                <div className="border-b border-border px-4 py-3">
                  <SectionLabel>Network</SectionLabel>
                </div>
                <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 lg:grid-cols-6">
                  <StatCell
                    label="Hubs live"
                    value={`${network.hubsActive}/${network.hubsTotal}`}
                    sub="active / total"
                  />
                  <StatCell label="Users" value={network.usersTotal} sub="all roles" />
                  <StatCell label="Students" value={network.studentAccounts} />
                  <StatCell label="Hub operators" value={network.hubOperatorAccounts} />
                  <StatCell
                    label="Premium"
                    value={network.activePremiumSubscribers}
                    sub="active subs"
                  />
                  <StatCell label="Super admins" value={network.superAdmins} />
                </div>
              </section>

              <section
                aria-label="Derived KPIs"
                className={cn(PORTAL_PANEL_SURFACE, "overflow-hidden")}
              >
                <div className="border-b border-border px-4 py-3">
                  <SectionLabel>Health · {rangeLabel.toLowerCase()}</SectionLabel>
                  <p className="mt-1 caption-scale font-medium text-foreground-muted">
                    Terminal desk success = picked ÷ (picked + expired + cancelled).
                  </p>
                </div>
                <div className="grid grid-cols-2 divide-x divide-y divide-border lg:grid-cols-4">
                  <StatCell
                    label="Throughput"
                    value={executive.derivatives.transactionsPerDay.toFixed(1)}
                    sub={`tx/day · ${ov.metrics.transactionsInRange} in ${executive.derivatives.periodLabelDays}d`}
                  />
                  <StatCell
                    label="Shelf in use"
                    value={`${executive.derivatives.shelfUtilizationPct}%`}
                    sub="out ÷ (avail+res+out)"
                  />
                  <StatCell
                    label="Desk success"
                    value={
                      executive.derivatives.requestTerminalSuccessPct == null
                        ? "—"
                        : `${executive.derivatives.requestTerminalSuccessPct}%`
                    }
                    sub="picked ÷ closed"
                  />
                  <StatCell
                    label="Peer drop-off share"
                    value={`${Math.round(executive.derivatives.p2pDropoffBacklogRatio * 100)}%`}
                    sub="pending ÷ peer queue"
                  />
                </div>
                <div className="grid grid-cols-2 divide-x divide-y divide-border border-t border-border md:grid-cols-4">
                  <StatCell
                    label="Open desk queue"
                    value={execFunnel.needAction}
                    sub="req + routed"
                  />
                  <StatCell
                    label="Fulfilment prep"
                    value={execFunnel.inPrep}
                    sub="fulfilled + ready"
                  />
                  <StatCell label="Completed" value={execFunnel.completed} sub="picked" />
                  <StatCell label="Closed" value={execFunnel.closed} sub="expired + withdrawn" />
                </div>
              </section>

              {executive.hubAttention.length > 0 ? (
                <section
                  className={cn(PORTAL_PANEL_SURFACE, "overflow-hidden")}
                  aria-label="Hubs by operational load"
                >
                  <div className="border-b border-border px-4 py-3">
                    <SectionLabel>Where to act first</SectionLabel>
                    <p className="mt-1 caption-scale font-medium text-foreground-muted">
                      Score = 3×pending + 2×ready + 2×P2P drop-off (higher = more load).
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[40rem] text-sm">
                      <thead>
                        <tr className="border-b border-border text-left section-kicker text-foreground">
                          <th className="px-4 py-2">Hub</th>
                          <th className="px-4 py-2">Score</th>
                          <th className="px-4 py-2">Pending</th>
                          <th className="px-4 py-2">Ready</th>
                          <th className="px-4 py-2">P2P</th>
                          <th className="px-4 py-2">Shelf</th>
                          <th className="px-4 py-2">Util</th>
                        </tr>
                      </thead>
                      <tbody>
                        {executive.hubAttention.map((row) => (
                          <tr key={row.hubId} className="border-b border-border last:border-0">
                            <td className="px-4 py-2 align-top">
                              <div className="text-foreground">{row.hubName}</div>
                              <div className="caption-scale font-medium text-foreground-muted">
                                {hubKindLabel(row.kind)}
                                {row.isActive ? "" : " · inactive"}
                              </div>
                            </td>
                            <td className="px-4 py-2 tabular-nums">{row.attentionScore}</td>
                            <td className="px-4 py-2 tabular-nums">{row.pendingDesk}</td>
                            <td className="px-4 py-2 tabular-nums">{row.readyPickup}</td>
                            <td className="px-4 py-2 tabular-nums">{row.p2pDropoffsPending}</td>
                            <td className="px-4 py-2 tabular-nums">{row.onShelfCopies}</td>
                            <td className="px-4 py-2 tabular-nums">{row.shelfUtilizationPct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}

              <section aria-label="Operations">
                <SectionLabel>Operations</SectionLabel>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <DeskQuickLink
                    href={d.requests}
                    title="Book Requests"
                    hint="Global request queue"
                    icon={ClipboardList}
                  />
                  <DeskQuickLink
                    href={d.inventory}
                    title="Inventory"
                    hint="Stock & status"
                    icon={Package}
                  />
                  <DeskQuickLink
                    href="#wallet"
                    title="Wallet"
                    hint="Revenue & borrows"
                    icon={Wallet}
                  />
                </div>
              </section>
            </>
          ) : !isSuperAdmin ? (
            <>
              <section
                className={cn(PORTAL_PANEL_SURFACE, "px-4 py-3")}
                aria-label="What to do next"
              >
                <SectionLabel>What to do next</SectionLabel>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {ov.metrics.pendingRequests > 0 ? (
                    <Link href={d.requests} className={cn("text-sm", PORTAL_INLINE_LINK)}>
                      Pending requests need action ({ov.metrics.pendingRequests}) → Open Book
                      Requests
                    </Link>
                  ) : (
                    <p className="body-scale font-normal text-foreground-muted">
                      Request queue is healthy.
                    </p>
                  )}
                  {ov.metrics.totalBooks === 0 ? (
                    <Link href={d.inventory} className={cn("text-sm", PORTAL_INLINE_LINK)}>
                      No inventory yet → Open Inventory
                    </Link>
                  ) : (
                    <p className="body-scale font-normal text-foreground-muted">
                      Inventory is populated.
                    </p>
                  )}
                </div>
              </section>

              <section className={cn(PORTAL_PANEL_SURFACE, "overflow-hidden")} aria-label="Metrics">
                <div className="border-b border-border px-4 py-3">
                  <SectionLabel>Metrics</SectionLabel>
                </div>
                <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3">
                  <StatCell label="Total books" value={ov.metrics.totalBooks} />
                  <StatCell label="Available" value={ov.metrics.available} />
                  <StatCell label="Checked out" value={ov.metrics.checkedOut} />
                  <StatCell label="Reserved" value={ov.metrics.reserved} />
                  <StatCell
                    label="Active requests"
                    value={ov.metrics.activeRequests}
                    sub={`${ov.metrics.pendingRequests} need action`}
                  />
                  <StatCell
                    label="Transactions"
                    value={ov.metrics.transactionsToday}
                    sub={`${rangeLabel}: ${ov.metrics.transactionsInRange}`}
                  />
                </div>
              </section>

              <section
                className={cn(PORTAL_PANEL_SURFACE, "overflow-hidden")}
                aria-label="Bounty Books"
              >
                <div className="border-b border-border px-4 py-3">
                  <SectionLabel>Bounty Books</SectionLabel>
                  <p className="mt-1 caption-scale font-medium text-foreground-muted">
                    Library acquisition requests.{" "}
                    <Link
                      href={d.bountyBooks ?? d.p2pListings}
                      className="underline underline-offset-2"
                    >
                      Manage bounties
                    </Link>
                  </p>
                </div>
                <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3">
                  <StatCell
                    label="Open requests"
                    value={ov.bounty?.openRequests ?? ov.metrics.bountyOpenRequests ?? 0}
                  />
                  <StatCell
                    label="Pending deliveries"
                    value={ov.bounty?.pendingDeliveries ?? ov.metrics.bountyPendingDeliveries ?? 0}
                  />
                  <StatCell
                    label="Books acquired"
                    value={ov.bounty?.booksAcquired ?? ov.metrics.bountyBooksAcquired ?? 0}
                  />
                  <StatCell
                    label="Fulfilled"
                    value={ov.bounty?.fulfilledRequests ?? ov.metrics.bountyFulfilledRequests ?? 0}
                  />
                  <StatCell
                    label="Total reward value"
                    value={`₹${(ov.bounty?.totalRewardValue ?? ov.metrics.bountyTotalRewardValue ?? 0).toLocaleString("en-IN")}`}
                    sub="open bounties"
                  />
                </div>
              </section>
            </>
          ) : (
            <p className={cn(PORTAL_PANEL_SURFACE, "px-4 py-3 text-sm text-foreground-muted")}>
              Executive analytics did not load. Refresh the page or update the API.
            </p>
          )}

          <section className={cn(PORTAL_PANEL_SURFACE, "overflow-hidden")}>
            <div className="border-b border-border px-4 py-3">
              <SectionLabel>Request pipeline</SectionLabel>
              <p className="mt-1 caption-scale font-medium text-foreground-muted">
                By stage.{" "}
                <Link href={d.requests} className="underline underline-offset-2">
                  Open requests
                </Link>
              </p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4">
              {REQUEST_KEYS.map((key) => (
                <div key={key} className="p-3 text-center">
                  <p className="section-kicker text-foreground">{pipelineBarLabel(key)}</p>
                  <p className="mt-1 text-base tabular-nums text-foreground">
                    {ov.requestBreakdown[key] ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {ov.topRequestedTitles && ov.topRequestedTitles.length > 0 ? (
            <section
              className={cn(PORTAL_PANEL_SURFACE, "overflow-hidden")}
              aria-label="Top requested titles"
            >
              <div className="border-b border-border px-4 py-3">
                <SectionLabel>Top requested titles</SectionLabel>
                <p className="mt-1 caption-scale font-medium text-foreground-muted">
                  By volume in {rangeLabel.toLowerCase()}. Fulfilment is tracked on{" "}
                  <Link href={d.requests} className="underline underline-offset-2">
                    Book requests
                  </Link>
                  .
                </p>
              </div>
              <ul className="divide-y divide-border">
                {ov.topRequestedTitles.map((t) => (
                  <li
                    key={t.title}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                  >
                    <span className="min-w-0 text-foreground">{t.title}</span>
                    <span className="shrink-0 tabular-nums text-foreground-muted">{t.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
