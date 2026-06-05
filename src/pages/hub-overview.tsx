import { useQuery } from "@tanstack/react-query";
import { HubCommerceSection } from "@/components/hub/HubCommerceSection";
import { HubStudentAnalytics, HubStudentsSection } from "@/components/hub/HubStudentsManagement";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStatusColorClasses, uniformBadgeShape } from "@/lib/status-badges";
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
import { PORTAL_INLINE_LINK, PORTAL_KICKER_COLOR, PORTAL_PAGE_GUTTER_X } from "@/lib/student-ui";
import { portalPathsForUser } from "@/lib/app-paths";
import {
  BookOpen,
  ClipboardList,
  History,
  Loader2,
  Package,
  Shield,
  Wallet,
  type LucideIcon,
} from "lucide-react";
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

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };

/** Second-key sort: pending → ready pickup → consignment / low stock → expired. */

const REQUEST_KEYS = [
  "requested",
  "routed",
  "fulfilled",
  "ready",
  "picked",
  "expired",
  "cancelled",
] as const;

/** One border, no card chrome — sections read as flat panels. */
const outline = "rounded-md border border-border bg-background";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[12px] font-[500] uppercase tracking-wider text-[#1F2937]/70">
      {children}
    </h2>
  );
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
      className={cn(
        outline,
        "flex items-start gap-3 p-3 transition-colors hover:bg-muted/30",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#1F2937]/70" aria-hidden />
      <div className="min-w-0">
        <p className="text-[14px] font-[600] leading-tight text-[#1F2937]">{title}</p>
        <p className="mt-0.5 text-[12px] font-[500] leading-snug text-[#1F2937]/70">{hint}</p>
      </div>
    </Link>
  );
}

/** Label + value inside a grid cell (borders come from parent `divide-*`). */
function StatCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="p-3">
      <p className="text-[12px] font-[500] uppercase tracking-wider text-[#1F2937]/70">{label}</p>
      <p className="mt-1 font-mono text-[24px] font-[600] tracking-tight text-[#1F2937]">
        {value}
      </p>
      {sub ? <p className="mt-1 text-[12px] font-[500] text-[#1F2937]/50">{sub}</p> : null}
    </div>
  );
}

function hubNameInScope(hubId: string, hubs: Hub[] | undefined): string | null {
  const n = hubs?.find((h) => h.id === hubId)?.name;
  return n && n.length > 0 ? n : null;
}

function pipelineBarLabel(key: string): string {
  switch (key) {
    case "requested":
      return "Requested";
    case "routed":
      return "Finding";
    case "fulfilled":
      return "Set aside";
    case "ready":
      return "Ready for pickup";
    case "picked":
      return "Picked";
    case "expired":
      return "Timed out";
    case "cancelled":
      return "Withdrawn";
    default:
      return key.replace(/_/g, " ");
  }
}

function executiveFunnelFromBreakdown(
  requestBreakdown: HubOverviewPayload["requestBreakdown"],
) {
  const g = (k: string) => requestBreakdown[k] ?? 0;
  return {
    needAction: g("requested") + g("routed"),
    inPrep: g("fulfilled") + g("ready"),
    completed: g("picked"),
    closed: g("expired") + g("cancelled"),
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
      const hubQ =
        overviewHubId === "all"
          ? ""
          : `&hubId=${encodeURIComponent(overviewHubId)}`;
      const path = isSuperAdmin ? "/api/hub/super-admin-overview" : "/api/hub/overview";
      return apiFetch<HubOverviewPayload & Partial<Pick<SuperAdminOverviewPayload, "network" | "executive">>>(
        `${path}?range=${overviewRange}${hubQ}`,
        { token: token! },
      );
    },
  });

  const topPad = inShell ? "" : "pt-24";

  if (loading) {
    return (
      <div className={cn("flex min-h-[50dvh] items-center justify-center", topPad)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user?.hubStaffHubIds.length) {
    return (
      <div className={cn("mx-auto max-w-lg pb-20 text-center", PORTAL_PAGE_GUTTER_X, inShell ? "pt-8" : "pt-28")}>
        <div
          className={cn(
            "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/30",
          )}
        >
          <Shield className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="mt-6 font-serif text-[32px] font-[700] tracking-tight">Dashboard restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
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
    isSuperAdmin && ov && "network" in ov
      ? (ov as SuperAdminOverviewPayload).network
      : undefined;
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
            <h1 className="mt-1 text-[36px] font-[700] leading-tight tracking-tight text-[#1F2937]">
              {isSuperAdmin ? "Network overview" : "Dashboard"}
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] font-[400] leading-relaxed text-[#1F2937]/70">
              Manage and monitor your hub's inventory, requests, and student activity.
            </p>
            {isSuperAdmin ? (
              <p className="mt-2 max-w-2xl text-[14px] font-[400] leading-relaxed text-[#1F2937]/70">
                Prioritized queues, network KPIs, and rates. Not a product catalog. Use{" "}
                <span className="font-[600] text-[#1F2937]">Scope</span> to focus one hub.
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
              <Label
                htmlFor="hub-overview-period"
                className="text-[12px] text-muted-foreground font-[500] uppercase tracking-wider"
              >
                Period
              </Label>
              <Select
                value={overviewRange}
                onValueChange={(v) => setOverviewRange(v as OverviewRange)}
              >
                <SelectTrigger
                  id="hub-overview-period"
                  className="h-10 w-full text-primary rounded-md border-border bg-background"
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
                <Label
                  htmlFor="hub-overview-scope"
                  className="text-[12px] font-[500] uppercase tracking-wider text-[#1F2937]/70"
                >
                  Network scope
                </Label>
                <Select value={overviewHubId} onValueChange={setOverviewHubId}>
                  <SelectTrigger
                    id="hub-overview-scope"
                    className="h-10 w-full rounded-md border-border bg-background"
                  >
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

      <div className="space-y-6 pt-6 pb-6">
        <HubStudentAnalytics overviewHubId={overviewHubId} />
        <HubStudentsSection overviewHubId={overviewHubId} />
      </div>

      {overviewQ.isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />
        </div>
      ) : overviewQ.isError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Could not load overview.
        </p>
      ) : ov ? (
        <div className="space-y-6">
          {isSuperAdmin && network && executive ? (
            <>
              <section className={cn(outline, "px-4 py-3")} aria-label="System health strip">
                <SectionLabel>Health</SectionLabel>
                <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                  <p className="text-[#1F2937]/70">
                    Queue backlog: <span className="font-mono text-[#1F2937]">{execFunnel.needAction}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Stale requests:{" "}
                    <span className="font-mono text-foreground">{ov.requestBreakdown["expired"] ?? 0}</span>
                  </p>
                </div>
              </section>
              <header className={cn(outline, "p-4 md:p-5")}>
                <h1 className="text-[20px] font-[600] tracking-tight text-[#1F2937] md:text-[24px]">
                  Business control tower
                </h1>
                <div className="mt-2 max-w-full overflow-x-auto overflow-y-hidden pb-0.5">
                  <p className="w-max whitespace-nowrap text-[13px] font-[400] text-[#1F2937]/70">
                    <span className="font-[500] text-[#1F2937]">{ov.hubScope.label}</span>
                    {" · "}
                    {rangeLabel}. Queue scores rank hubs by pending desk, ready pickup, and peer drop-off backlog.
                  </p>
                </div>
              </header>

              <section aria-label="Network footprint" className={cn(outline, "overflow-hidden")}>
                <div className="border-b border-border px-4 py-3">
                  <SectionLabel>Network</SectionLabel>
                </div>
                <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 lg:grid-cols-6">
                  <StatCell label="Hubs live" value={`${network.hubsActive}/${network.hubsTotal}`} sub="active / total" />
                  <StatCell label="Users" value={network.usersTotal} sub="all roles" />
                  <StatCell label="Students" value={network.studentAccounts} />
                  <StatCell label="Hub operators" value={network.hubOperatorAccounts} />
                  <StatCell label="Premium" value={network.activePremiumSubscribers} sub="active subs" />
                  <StatCell label="Super admins" value={network.superAdmins} />
                </div>
              </section>

              <section aria-label="Derived KPIs" className={cn(outline, "overflow-hidden")}>
                <div className="border-b border-border px-4 py-3">
                  <SectionLabel>Health · {rangeLabel.toLowerCase()}</SectionLabel>
                  <p className="mt-1 text-[11px] font-[500] text-[#1F2937]/70">
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
                  <StatCell label="Open desk queue" value={execFunnel.needAction} sub="req + routed" />
                  <StatCell label="Fulfilment prep" value={execFunnel.inPrep} sub="fulfilled + ready" />
                  <StatCell label="Completed" value={execFunnel.completed} sub="picked" />
                  <StatCell label="Closed" value={execFunnel.closed} sub="expired + withdrawn" />
                </div>
              </section>

              {executive.hubAttention.length > 0 ? (
                <section className={cn(outline, "overflow-hidden")} aria-label="Hubs by operational load">
                  <div className="border-b border-border px-4 py-3">
                    <SectionLabel>Where to act first</SectionLabel>
                    <p className="mt-1 text-[11px] font-[500] text-[#1F2937]/70">
                      Score = 3×pending + 2×ready + 2×P2P drop-off (higher = more load).
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[40rem] text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-[12px] font-[500] uppercase tracking-wider text-[#1F2937]">
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
                              <div className="text-[#1F2937]">{row.hubName}</div>
                              <div className="text-[12px] font-[500] text-[#1F2937]/70">
                                {hubKindLabel(row.kind)}
                                {row.isActive ? "" : " · inactive"}
                              </div>
                            </td>
                            <td className="px-4 py-2 font-mono tabular-nums">{row.attentionScore}</td>
                            <td className="px-4 py-2 font-mono tabular-nums">{row.pendingDesk}</td>
                            <td className="px-4 py-2 font-mono tabular-nums">{row.readyPickup}</td>
                            <td className="px-4 py-2 font-mono tabular-nums">{row.p2pDropoffsPending}</td>
                            <td className="px-4 py-2 font-mono tabular-nums">{row.onShelfCopies}</td>
                            <td className="px-4 py-2 font-mono tabular-nums">{row.shelfUtilizationPct}%</td>
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
                    title="Requests"
                    hint="Triage the desk queue"
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
              <section className={cn(outline, "px-4 py-3")} aria-label="What to do next">
                <SectionLabel>What to do next</SectionLabel>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {ov.metrics.pendingRequests > 0 ? (
                    <Link href={d.requests} className={cn("text-sm", PORTAL_INLINE_LINK)}>
                      Pending requests need action ({ov.metrics.pendingRequests}) → Open Requests
                    </Link>
                  ) : (
                    <p className="text-[13px] font-[400] text-[#1F2937]/70">Request queue is healthy.</p>
                  )}
                  {ov.metrics.totalBooks === 0 ? (
                    <Link href={d.inventory} className={cn("text-sm", PORTAL_INLINE_LINK)}>
                      No inventory yet → Open Inventory
                    </Link>
                  ) : (
                    <p className="text-[13px] font-[400] text-[#1F2937]/70">Inventory is populated.</p>
                  )}
                </div>
              </section>

              <section className={cn(outline, "overflow-hidden")} aria-label="Metrics">
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
            </>
          ) : (
            <p className={cn(outline, "px-4 py-3 text-sm text-muted-foreground")}>
              Executive analytics did not load. Refresh the page or update the API.
            </p>
          )}

          <section className={cn(outline, "overflow-hidden")}>
            <div className="border-b border-border px-4 py-3">
              <SectionLabel>Request pipeline</SectionLabel>
              <p className="mt-1 text-[11px] font-[500] text-[#1F2937]/70">
                By stage.{" "}
                <Link href={d.requests} className="underline underline-offset-2">
                  Open requests
                </Link>
              </p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 lg:grid-cols-7">
              {REQUEST_KEYS.map((key) => (
                <div key={key} className="p-3 text-center">
                  <p className="text-[12px] font-[500] uppercase tracking-wider text-[#1F2937]">
                    {pipelineBarLabel(key)}
                  </p>
                  <p className="mt-1 font-mono text-[16px] tabular-nums text-[#1F2937]">
                    {ov.requestBreakdown[key] ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {ov.topRequestedTitles && ov.topRequestedTitles.length > 0 ? (
            <section className={cn(outline, "overflow-hidden")} aria-label="Top requested titles">
              <div className="border-b border-border px-4 py-3">
                <SectionLabel>Top requested titles</SectionLabel>
                <p className="mt-1 text-[11px] font-[500] text-[#1F2937]/70">
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
                    <span className="min-w-0 text-[#1F2937]">{t.title}</span>
                    <span className="shrink-0 font-mono tabular-nums text-[#1F2937]/70">{t.count}</span>
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
