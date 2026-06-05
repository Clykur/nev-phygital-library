import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { useStudentShell } from "@/components/layout/StudentAppShell";
import { useAuth } from "@/context/auth-context"; 
import { apiFetch, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PORTAL_KICKER_COLOR, PORTAL_PAGE_GUTTER_X } from "@/lib/student-ui";
import { portalPathsForUser } from "@/lib/app-paths";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Shield } from "lucide-react";

type Hub = { id: string; name: string; kind?: string };

type CommerceRow = {
  id: string;
  action: string;
  summary: string;
  atHubId: string | null;
  atHubName: string | null;
  actorUserId?: string;
  resourceType: string | null;
  resourceId: string | null;
  createdAt: string;
};

type HubCommercePayload = {
  hubScope: { all: boolean; hubCount: number; label: string };
  inbound: CommerceRow[];
  outbound: CommerceRow[];
};

/** One border, flat panel — matches hub book requests. */
const outline = "rounded-md border border-border bg-background";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="caption-scale font-bold uppercase tracking-[0.18em] text-foreground">{children}</h2>
  );
}

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function commerceEventKind(
  r: Pick<CommerceRow, "action" | "resourceType">,
): "borrow" | "buy" | "return" {
  const a = r.action;
  if (a === "BOOK_RETURN" || a === "P2P_BORROW_RETURN") return "return";
  if (a === "PURCHASE_BOOK" || a === "BUY_P2P") return "buy";
  if (a === "CHECKOUT_BOOK" || a === "BORROW_P2P") return "borrow";
  return "borrow";
}

function commerceEventSource(
  r: Pick<CommerceRow, "action" | "resourceType">,
): "hub" | "p2p" {
  if (
    r.resourceType === "p2p_listing" ||
    r.action === "BUY_P2P" ||
    r.action === "BORROW_P2P" ||
    r.action === "P2P_BORROW_RETURN"
  ) {
    return "p2p";
  }
  return "hub";
}

export function HubCommerceSection() {
  const { token, user, loading } = useAuth();
  const inShell = useStudentShell();
  const [commerceHubId, setCommerceHubId] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "borrow" | "buy" | "return">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "hub" | "p2p">("all");
  

  const hubsQ = useQuery({
    queryKey: ["catalog", "hubs", "hub-commerce"],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: () => apiFetch<{ hubs: Hub[] }>("/api/catalog/hubs", { token: token! }),
  });

  const commerceQ = useQuery({
    queryKey: ["hub", "commerce", token, commerceHubId],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: async () => {
      const q =
        commerceHubId === "all" ? "?limit=80" : `?hubId=${encodeURIComponent(commerceHubId)}&limit=80`;
      return apiFetch<HubCommercePayload>(`/api/hub/commerce${q}`, { token: token! });
    },
  });

  

  if (loading) {
    return (
      <div className={cn("flex min-h-[50dvh] items-center justify-center")}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const rawInbound = commerceQ.data?.inbound ?? [];
  const rawOutbound = commerceQ.data?.outbound ?? [];
  const inbound = useMemo(() => {
    return rawInbound.filter((r) => {
      if (typeFilter !== "all" && commerceEventKind(r) !== typeFilter) return false;
      if (sourceFilter !== "all" && commerceEventSource(r) !== sourceFilter) return false;
      return true;
    });
  }, [rawInbound, typeFilter, sourceFilter]);
  const outbound = useMemo(() => {
    return rawOutbound.filter((r) => {
      if (typeFilter !== "all" && commerceEventKind(r) !== typeFilter) return false;
      if (sourceFilter !== "all" && commerceEventSource(r) !== sourceFilter) return false;
      return true;
    });
  }, [rawOutbound, typeFilter, sourceFilter]);
  const scopeLabel = commerceQ.data?.hubScope.label ?? "—";

  const selectTriggerClass = "h-10 w-full rounded-md border-border bg-background";

  const clearCommerceFilters = () => {
    setTypeFilter("all");
    setSourceFilter("all");
    if (user && user.hubStaffHubIds.length > 1) {
      setCommerceHubId("all");
    }
  };

  return (
    <div className="space-y-6 pt-8 mt-8 border-t border-border">
      <div className="mb-6 border-b border-border pb-5">
        <div className="mt-4 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-end sm:gap-3">
          {user.hubStaffHubIds.length > 1 ? (
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Label
                htmlFor="hub-commerce-scope"
                className="caption-scale font-bold uppercase tracking-wide text-foreground"
              >
                Scope
              </Label>
              <Select value={commerceHubId} onValueChange={setCommerceHubId}>
                <SelectTrigger id="hub-commerce-scope" className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All managed hubs</SelectItem>
                  {user.hubStaffHubIds.map((id) => (
                    <SelectItem key={id} value={id}>
                      {hubsQ.data?.hubs.find((h) => h.id === id)?.name ?? id.slice(0, 8) + "…"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label
              htmlFor="hub-commerce-event-type"
              className="caption-scale font-bold uppercase tracking-wide text-foreground"
            >
              Event type
            </Label>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
              <SelectTrigger id="hub-commerce-event-type" className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="borrow">Borrow / checkout</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="return">Return</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label
              htmlFor="hub-commerce-source"
              className="caption-scale font-bold uppercase tracking-wide text-foreground"
            >
              Source
            </Label>
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as typeof sourceFilter)}>
              <SelectTrigger id="hub-commerce-source" className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="hub">Hub catalog</SelectItem>
                <SelectItem value="p2p">Peer (P2P)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full shrink-0 rounded-md sm:min-w-[8.5rem] sm:w-auto"
            onClick={clearCommerceFilters}
          >
            Reset filters
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <section className={cn(outline, "overflow-hidden")} aria-label="Member commerce events">
          <div className="border-b border-border px-4 py-3">
            <SectionLabel>Hub-wide · member actions</SectionLabel>
            <p className="mt-1 text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{scopeLabel}</span>. All members’ borrow /
              buy / return events tied to your managed shelf scope (audit). Excludes rows for this hub login.
              those are personal and belong in Activity when you act as a shopper.
            </p>
          </div>
          {commerceQ.isError ? (
            <p className="px-4 py-10 text-sm text-destructive sm:px-4">
              {commerceQ.error instanceof ApiError
                ? commerceQ.error.message
                : "Could not load commerce data."}
            </p>
          ) : commerceQ.isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />
            </div>
          ) : inbound.length === 0 ? (
            <p className="px-4 py-10 text-sm text-muted-foreground sm:px-4">
              {rawInbound.length === 0
                ? "No inbound events yet."
                : "No events match these filters. Try adjusting type or source."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-4 sm:pl-6">When</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead className="hidden md:table-cell">Hub</TableHead>
                    <TableHead className="hidden lg:table-cell pr-4 sm:pr-6">Member</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inbound.map((r) => (
                    <TableRow key={`${r.id}-${r.createdAt}`} className="border-border">
                      <TableCell className="whitespace-nowrap pl-4 align-top text-xs text-muted-foreground sm:pl-6">
                        {fmtWhen(r.createdAt)}
                      </TableCell>
                      <TableCell className="min-w-0 align-top text-sm">{r.summary}</TableCell>
                      <TableCell className="hidden align-top text-xs text-muted-foreground md:table-cell">
                        {r.atHubName ?? "—"}
                      </TableCell>
                      <TableCell className="hidden align-top font-mono caption-scale text-muted-foreground lg:table-cell pr-4 sm:pr-6">
                        {r.actorUserId ? `${r.actorUserId.slice(0, 8)}…` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <section className={cn(outline, "overflow-hidden")} aria-label="This login shopping elsewhere">
          <div className="border-b border-border px-4 py-3">
            <SectionLabel>This login · shopping elsewhere</SectionLabel>
            <p className="mt-1 text-xs text-muted-foreground">
              When this hub account borrows or buys on other campuses or peer listings, still audit, still
              ledger-style (not the same as Activity’s personal summary tiles).
            </p>
          </div>
          {commerceQ.isError ? (
            <p className="px-4 py-10 text-sm text-destructive sm:px-4">
              {commerceQ.error instanceof ApiError
                ? commerceQ.error.message
                : "Could not load commerce data."}
            </p>
          ) : commerceQ.isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />
            </div>
          ) : outbound.length === 0 ? (
            <p className="px-4 py-10 text-sm text-muted-foreground sm:px-4">
              {rawOutbound.length === 0
                ? "No hub-account events yet."
                : "No events match these filters. Try adjusting type or source."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-4 sm:pl-6">When</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead className="hidden md:table-cell pr-4 sm:pr-6">Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outbound.map((r) => (
                    <TableRow key={`${r.id}-${r.createdAt}`} className="border-border">
                      <TableCell className="whitespace-nowrap pl-4 align-top text-xs text-muted-foreground sm:pl-6">
                        {fmtWhen(r.createdAt)}
                      </TableCell>
                      <TableCell className="min-w-0 align-top text-sm">{r.summary}</TableCell>
                      <TableCell className="hidden align-top text-xs text-muted-foreground md:table-cell pr-4 sm:pr-6">
                        {r.atHubName ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
