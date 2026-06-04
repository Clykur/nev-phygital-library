import { useEffect, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import { useStudentShell } from "@/components/layout/StudentAppShell";
import { Button } from "@/components/ui/button";
import { PORTAL_PAGE_CONTAINER } from "@/lib/student-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { isHubAccount, portalPathsForUser } from "@/lib/app-paths";
import { STATUS_CHIP_EMERALD } from "@/lib/status-chip-tones";

type BookRow = {
  id: string;
  title: string;
  hubId: string;
  status: string;
  buyPrice?: number;
  borrowPrice?: number;
  borrowerUserId: string | null;
  dueAt?: string | null;
  soldToUserId?: string | null;
  soldAt?: string | null;
  createdAt?: string;
  acquiredFromHubId?: string | null;
  acquiredFromHubName?: string | null;
};

type RequestRow = {
  id: string;
  hubId: string;
  bookTitle?: string | null;
  notes?: string | null;
  status: string;
  readyAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type NotifRow = {
  id: string;
  kind: string;
  body: string;
  bookRequestId?: string | null;
  readAt?: string | null;
  createdAt?: string;
};

type Hub = { id: string; name: string };

type P2pRow = {
  id: string;
  refId?: string | null;
  bookTitle: string;
  price: number;
  borrowPrice?: number;
  status: string;
  ownerId: string;
  buyerId: string | null;
  borrowerUserId?: string | null;
  borrowDueAt?: string | null;
  dropoffHubId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  soldAt?: string | null;
};

function fmtInr(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

function fmtDateShort(iso: string | undefined | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function fmtDue(iso: string | undefined | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function fmtDateOnly(iso: string | undefined | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function tableShell(children: ReactNode) {
  return <div className="overflow-x-auto">{children}</div>;
}

const outline = "rounded-md border border-border bg-background";

function hubStatusLabel(status: string) {
  if (status === "checked_out") return "Checked out";
  if (status === "reserved") return "Set aside";
  if (status === "available") return "Available";
  return status.replace(/_/g, " ");
}

function requestStatusLabel(status: string) {
  if (status === "requested") return "Requested";
  if (status === "routed") return "Finding";
  if (status === "fulfilled") return "Set aside";
  if (status === "ready") return "Ready for pickup";
  if (status === "picked") return "Picked";
  if (status === "expired") return "Expired";
  if (status === "cancelled") return "Cancelled";
  return status.replace(/_/g, " ");
}

function requestStepIndex(status: string) {
  if (status === "requested") return 0;
  if (status === "routed") return 1;
  if (status === "fulfilled") return 2;
  if (status === "ready") return 3;
  if (status === "picked") return 4;
  return -1;
}

function requestNextText(status: string) {
  if (status === "requested") return "What happens next: desk starts matching copies.";
  if (status === "routed") return "What happens next: staff is finding an available copy.";
  if (status === "fulfilled") return "What happens next: copy is set aside for you.";
  if (status === "ready") return "What happens next: collect at hub desk (ready for pickup).";
  if (status === "picked") return "What happens next: completed and moved to history.";
  return "What happens next: no action required.";
}

function RequestProgress({ status }: { status: string }) {
  const steps = ["Requested", "Finding", "Set aside", "Ready for pickup", "Picked"];
  const idx = requestStepIndex(status);
  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-1.5">
        {steps.map((s, i) => (
          <span
            key={s}
            className={cn(
              "h-1.5 flex-1 rounded-sm",
              idx >= i ? "bg-primary/70" : "bg-muted",
            )}
            title={s}
          />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">
        {steps[Math.max(0, Math.min(idx, steps.length - 1))] ?? "Requested"}
      </p>
    </div>
  );
}

function FlatStatus({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "amber" | "emerald" | "destructive";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center whitespace-nowrap rounded-sm border px-3 text-[10px] font-semibold uppercase tracking-wide",
        tone === "emerald" && STATUS_CHIP_EMERALD,
        tone === "amber" && "border-primary/30 bg-primary/10 text-foreground dark:bg-primary/15",
        tone === "destructive" && "border-destructive/30 bg-destructive/10 text-destructive",
        tone === "neutral" && "border-border bg-muted/40 text-foreground",
      )}
    >
      {label}
    </span>
  );
}

function SectionHeading({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">{kicker}</p>
      <h2 className="mt-1 font-serif text-lg font-light tracking-tight text-foreground">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

function BlockCard({
  id,
  title,
  description,
  isLoading,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  isLoading: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn(outline, "overflow-hidden")}>
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 px-5 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary/80" />
          Loading…
        </div>
      ) : (
        <div className="pb-4 pt-3">{children}</div>
      )}
    </section>
  );
}

export default function StudentTrackingPage() {
  const { token, user } = useAuth();
  const portalPaths = portalPathsForUser(user);
  const inShell = useStudentShell();
  const hubDesk = !!user && isHubAccount(user);
  const qc = useQueryClient();

  const hubsQ = useQuery({
    queryKey: ["catalog", "hubs", "activity"],
    enabled: !!token,
    queryFn: () => apiFetch<{ hubs: Hub[] }>("/api/catalog/hubs", { token: token! }),
  });

  const booksQ = useQuery({
    queryKey: ["catalog", "books", "tracking", user?.userId],
    enabled: !!token && !!user,
    queryFn: () => apiFetch<{ books: BookRow[] }>("/api/catalog/books", { token: token! }),
  });

  const reqQ = useQuery({
    queryKey: ["book-requests", "mine"],
    enabled: !!token,
    queryFn: () => apiFetch<{ requests: RequestRow[] }>("/api/book-requests/mine", { token: token! }),
  });

  const notifQ = useQuery({
    queryKey: ["notifications", "mine"],
    enabled: !!token,
    queryFn: () =>
      apiFetch<{ notifications: NotifRow[] }>("/api/notifications/mine", { token: token! }),
  });

  const p2pQ = useQuery({
    queryKey: ["p2p-listings", "tracking", user?.userId],
    enabled: !!token && !!user,
    queryFn: () => apiFetch<{ listings: P2pRow[] }>("/api/p2p/listings", { token: token! }),
  });

  const hubLabel = (hubId: string | null | undefined) =>
    hubId ? (hubsQ.data?.hubs.find((h) => h.id === hubId)?.name ?? "") : "";

  const returnPeerBorrow = useMutation({
    mutationFn: async (listingId: string) => {
      await apiFetch(`/api/p2p/listings/${listingId}/return-borrow`, {
        method: "POST",
        token: token!,
      });
    },
    onSuccess: () => {
      toast.success("Peer borrow returned.");
      void qc.invalidateQueries({ queryKey: ["p2p-listings"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Return failed"),
  });

  const returnBook = useMutation({
    mutationFn: async (bookId: string) => {
      await apiFetch(`/api/books/${bookId}/return`, { method: "POST", token: token! });
    },
    onSuccess: () => {
      toast.success("Return recorded drop the copy at your hub desk when you can.");
      void qc.invalidateQueries({ queryKey: ["catalog", "books"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Return failed"),
  });

  const onLoan =
    booksQ.data?.books.filter(
      (b) =>
        b.borrowerUserId === user?.userId && (b.status === "checked_out" || b.status === "overdue"),
    ) ?? [];

  const hubPurchases =
    booksQ.data?.books.filter(
      (b) => b.soldToUserId === user?.userId && b.status === "sold",
    ) ?? [];
  const hubPurchasesOrdered = [...hubPurchases].sort((a, b) => {
    const ta = a.soldAt ? new Date(a.soldAt).getTime() : 0;
    const tb = b.soldAt ? new Date(b.soldAt).getTime() : 0;
    return tb - ta;
  });

  const requests = reqQ.data?.requests ?? [];
  const requestsByRecent = [...requests].sort((a, b) => {
    const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  const myListings =
    p2pQ.data?.listings
      .filter((l) => l.ownerId === user?.userId && ["sold", "cancelled", "rejected"].includes(l.status))
      .sort((a, b) => {
        const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return tb - ta;
      }) ?? [];
  const myPeerBorrows =
    p2pQ.data?.listings.filter(
      (l) => l.borrowerUserId === user?.userId && l.status === "reserved",
    ) ?? [];

  const myPurchases =
    p2pQ.data?.listings.filter((l) => l.buyerId === user?.userId && l.status === "sold") ?? [];
  const purchasesOrdered = [...myPurchases].sort((a, b) => {
    const ta = a.soldAt ? new Date(a.soldAt).getTime() : 0;
    const tb = b.soldAt ? new Date(b.soldAt).getTime() : 0;
    return tb - ta;
  });

  const notifications = notifQ.data?.notifications ?? [];
  const unreadAlerts = notifications.filter((n) => !n.readAt).length;

  const top = inShell ? "" : "pt-24";
  const pageWrap = inShell ? "w-full" : PORTAL_PAGE_CONTAINER;

  const rowStripe = "even:bg-muted/[0.35]";

  const purchaseRows = [
    ...hubPurchasesOrdered.map((b) => ({ kind: "hub" as const, hub: b })),
    ...purchasesOrdered.map((l) => ({ kind: "peer" as const, peer: l })),
  ].sort((a, b) => {
    const ta =
      a.kind === "hub"
        ? a.hub.soldAt
          ? new Date(a.hub.soldAt).getTime()
          : 0
        : a.peer.soldAt
          ? new Date(a.peer.soldAt).getTime()
          : 0;
    const tb =
      b.kind === "hub"
        ? b.hub.soldAt
          ? new Date(b.hub.soldAt).getTime()
          : 0
        : b.peer.soldAt
          ? new Date(b.peer.soldAt).getTime()
          : 0;
    return tb - ta;
  });

  const showBorrowed = false;
  const showPurchases =
    hubPurchasesOrdered.length > 0 ||
    purchasesOrdered.length > 0 ||
    booksQ.isLoading ||
    p2pQ.isLoading;
  const showRequests = requestsByRecent.length > 0 || reqQ.isLoading;
  const showListings = myListings.length > 0 || p2pQ.isLoading;
  const showYourActions = showPurchases || showRequests || showListings;
  const showPeerSection = false;

  const nextActions = useMemo(() => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const returnSoon = onLoan.filter((b) => {
      if (!b.dueAt) return false;
      const t = new Date(b.dueAt).getTime();
      if (t < now) return true;
      return t - now < weekMs;
    });
    const pickupReady = requestsByRecent.filter((r) => r.status === "ready");
    return { returnSoon, pickupReady };
  }, [onLoan, requestsByRecent]);

  const showNextActions = false;
  const totalSpent = purchaseRows.reduce((sum, row) => {
    if (row.kind === "hub") return sum + (row.hub.buyPrice ?? 0);
    return sum + row.peer.price;
  }, 0);
  const paymentRows = [
    ...purchaseRows.map((row) =>
      row.kind === "hub"
        ? { kind: "hub" as const, label: "Hub purchase", title: row.hub.title, amount: row.hub.buyPrice ?? 0, at: row.hub.soldAt }
        : { kind: "peer" as const, label: "Peer purchase", title: row.peer.bookTitle, amount: row.peer.price, at: row.peer.soldAt },
    ),
    ...onLoan.map((b) => ({
      kind: "borrow" as const,
      label: "Borrow fee",
      title: b.title,
      amount: b.borrowPrice ?? 0,
      at: b.createdAt,
    })),
  ].sort((a, b) => {
    const ta = a.at ? new Date(a.at).getTime() : 0;
    const tb = b.at ? new Date(b.at).getTime() : 0;
    return tb - ta;
  });
  const recentPayments = paymentRows.slice(0, 3);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const focus = params.get("focus");
    const ref = params.get("ref");
    if (!focus) return;
    let selector = "";
    if (focus === "request" && ref) selector = `[data-request-id="${CSS.escape(ref)}"]`;
    if ((focus === "purchase" || focus === "peer_purchase") && ref) {
      selector = `[data-purchase-id="${CSS.escape(ref)}"]`;
    }
    if (!selector && focus === "request") selector = "#requests";
    if (!selector && (focus === "purchase" || focus === "peer_purchase")) selector = "#purchases";
    const el = document.querySelector(selector);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary/50", "bg-primary/5");
    const t = window.setTimeout(() => {
      el.classList.remove("ring-2", "ring-primary/50", "bg-primary/5");
    }, 2600);
    return () => window.clearTimeout(t);
  }, [reqQ.data?.requests, p2pQ.data?.listings, booksQ.data?.books]);

  return (
    <div className={cn("min-h-[100dvh] bg-background pb-20", top)}>
      <div className={cn("mx-auto", pageWrap)}>
        <div className="mb-8 border-b border-border/30 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#64748B]">
            {user?.baseRole === "super_admin" ? "Super admin" : hubDesk ? "Hub portal" : "Student"}
          </p>
          <h1 className="mt-1 font-[var(--font-display)] text-lg font-bold tracking-tight text-foreground">
            Activity
          </h1>
        </div>

        <section aria-label="Summary">
          <SectionHeading
            kicker="Summary"
            title="Your counts"
            description="Personal totals only. Commerce is the hub-wide ledger; Inventory lists physical copies on the shelf."
          />
          <section className={cn(outline, "mt-4 overflow-hidden")} aria-label="Summary totals">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-5">History borrows</TableHead>
                    <TableHead>Hub buys</TableHead>
                    <TableHead>Peer buys</TableHead>
                    <TableHead>Peer borrows</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead className="pr-5">Alerts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className={rowStripe}>
                    <TableCell className="pl-5 text-lg font-semibold tabular-nums">0</TableCell>
                    <TableCell className="text-lg font-semibold tabular-nums">{hubPurchases.length}</TableCell>
                    <TableCell className="text-lg font-semibold tabular-nums">{myPurchases.length}</TableCell>
                    <TableCell className="text-lg font-semibold tabular-nums">0</TableCell>
                    <TableCell className="text-lg font-semibold tabular-nums">{requestsByRecent.length}</TableCell>
                    <TableCell className="pr-5 text-lg font-semibold tabular-nums">{unreadAlerts}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </section>
        </section>
        <Separator className="my-8" />
        <section aria-label="Spending">
          <SectionHeading
            kicker="Wallet"
            title="Spending summary"
            description="Basic view of your completed payments."
          />
          <section className={cn(outline, "mt-4 overflow-hidden")}>
            <div className="border-b border-border px-5 py-3">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Total spent: ₹{fmtInr(totalSpent)}
              </p>
            </div>
            <div className="p-4">
              {recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments yet.</p>
              ) : (
                <ul className="space-y-2">
                  {recentPayments.map((row, idx) => (
                    <li
                      key={`${row.kind}-${idx}`}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <span className="truncate pr-3 text-muted-foreground">
                        {row.label} · <span className="text-foreground">{row.title}</span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">
                        ₹{fmtInr(row.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </section>

        {showNextActions ? (
          <>
            <Separator className="my-8" />
            <section aria-label="Next actions">
              <SectionHeading
                kicker="Next"
                title="What needs attention"
                description="Returns coming due or ready for pickup. Everything else stays in the sections below."
              />
              <div className="mt-4 space-y-3">
                {nextActions.pickupReady.length > 0 ? (
                  <div className="rounded-md border border-emerald-500/25 bg-emerald-500/5 p-3 text-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-secondary/80 dark:text-emerald-200/90">
                      Pickup pending
                    </p>
                    <ul className="mt-2 list-inside list-disc text-muted-foreground">
                      {nextActions.pickupReady.map((r) => (
                        <li key={r.id}>
                          <span className="font-medium text-foreground">
                            {r.bookTitle?.trim() || "Book"}
                          </span>{" "}
                          · {hubLabel(r.hubId) || "Hub"}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {nextActions.returnSoon.length > 0 ? (
                  <div className="rounded-md border border-primary/25 bg-primary/5 p-3 text-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-foreground">
                      Return due or overdue
                    </p>
                    <ul className="mt-2 list-inside list-disc text-muted-foreground">
                      {nextActions.returnSoon.map((b) => (
                        <li key={b.id}>
                          <span className="font-medium text-foreground">{b.title}</span> · due{" "}
                          {fmtDue(b.dueAt) || "—"}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </section>
          </>
        ) : null}

        {showYourActions ? (
          <>
            <Separator className="my-8" />
            <section aria-label="Your actions">
              <SectionHeading
                kicker="History"
                title="Completed and historical activity"
              />
              <div className="mt-4 space-y-6">
                {showBorrowed ? (
                  <BlockCard
                    title={hubDesk ? "History borrows (hub)" : "History borrows"}
                    description="Borrow fee is what you paid to take the copy; return stops overdue charges."
                    isLoading={booksQ.isLoading}
                  >
                    {tableShell(
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border/50 hover:bg-transparent">
                            <TableHead className="w-[min(28%,200px)] pl-5">Title</TableHead>
                            <TableHead className="hidden md:table-cell">Hub</TableHead>
                            <TableHead className="whitespace-nowrap text-right">Borrow fee</TableHead>
                            <TableHead className="whitespace-nowrap text-right">Buy price</TableHead>
                            <TableHead className="whitespace-nowrap">Due</TableHead>
                            <TableHead className="pr-5 text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {onLoan.map((b) => (
                            <TableRow key={b.id} className={rowStripe}>
                              <TableCell className="pl-5 align-top font-medium">
                                <span className="line-clamp-2">{b.title}</span>
                                {hubLabel(b.hubId) ? (
                                  <p className="mt-1 font-mono text-[10px] text-muted-foreground md:hidden">
                                    {hubLabel(b.hubId)}
                                  </p>
                                ) : null}
                              </TableCell>
                              <TableCell className="hidden align-top text-sm text-muted-foreground md:table-cell">
                                {hubLabel(b.hubId) || null}
                              </TableCell>
                              <TableCell className="align-top text-right text-sm tabular-nums">
                                ₹{fmtInr(b.borrowPrice ?? 0)}
                              </TableCell>
                              <TableCell className="align-top text-right text-sm tabular-nums text-muted-foreground">
                                ₹{fmtInr(b.buyPrice ?? 0)}
                              </TableCell>
                              <TableCell className="align-top text-sm text-muted-foreground">
                                {fmtDue(b.dueAt) || null}
                              </TableCell>
                              <TableCell className="pr-5 align-top text-right">
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                  <FlatStatus
                                    label={hubStatusLabel(b.status)}
                                    tone={b.status === "available" ? "emerald" : b.status === "checked_out" ? "amber" : "neutral"}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-md"
                                    disabled={returnBook.isPending}
                                    onClick={() => returnBook.mutate(b.id)}
                                  >
                                    Return
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>,
                    )}
                  </BlockCard>
                ) : null}

                {showPurchases ? (
                  <BlockCard
                    id="purchases"
                    title="Purchases"
                    description="Completed purchases, sorted by most recent."
                    isLoading={booksQ.isLoading || p2pQ.isLoading}
                  >
                    {/* Mobile: card list */}
                    <div className="space-y-2 px-4 sm:hidden">
                      {purchaseRows.map((row) => {
                        const isHub = row.kind === "hub";
                        const title = isHub ? row.hub.title : row.peer.bookTitle;
                        const amount = isHub ? (row.hub.buyPrice ?? 0) : row.peer.price;
                        const when = isHub ? row.hub.soldAt : row.peer.soldAt;
                        const key = isHub ? `hub-p-${row.hub.id}` : `peer-p-${row.peer.id}`;
                        return (
                          <div
                            key={key}
                            className="rounded-lg border border-border bg-card/60 p-3 text-sm"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="font-medium text-foreground line-clamp-2 flex-1">{title}</p>
                              <FlatStatus label={isHub ? "Hub purchase" : "Peer purchase"} tone="neutral" />
                            </div>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span>Paid: <span className="font-semibold text-foreground tabular-nums">₹{fmtInr(amount)}</span></span>
                              {fmtDateShort(when) && <span>{fmtDateShort(when)}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop: table */}
                    {tableShell(
                      <Table className="hidden sm:table">
                        <TableHeader>
                          <TableRow className="border-border/50 hover:bg-transparent">
                            <TableHead className="w-[150px] pl-5">Channel</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead className="hidden md:table-cell">Hub / pickup</TableHead>
                            <TableHead className="whitespace-nowrap text-right">Paid ₹</TableHead>
                            <TableHead className="whitespace-nowrap pr-5 text-right">When</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {purchaseRows.map((row) =>
                            row.kind === "hub" ? (
                              <TableRow key={`hub-p-${row.hub.id}`} className={rowStripe} data-purchase-id={row.hub.id}>
                                <TableCell className="pl-5 align-top">
                                  <FlatStatus label="Hub purchase" tone="neutral" />
                                </TableCell>
                                <TableCell className="min-w-0 align-top">
                                  <span className="line-clamp-2 font-medium">{row.hub.title}</span>
                                  {hubLabel(row.hub.hubId) ? (
                                    <p className="mt-1 text-[10px] text-muted-foreground md:hidden">
                                      {hubLabel(row.hub.hubId)}
                                    </p>
                                  ) : null}
                                </TableCell>
                                <TableCell className="hidden align-top text-sm text-muted-foreground md:table-cell">
                                  {hubLabel(row.hub.hubId) || null}
                                </TableCell>
                                <TableCell className="align-top text-right tabular-nums">
                                  ₹{fmtInr(row.hub.buyPrice ?? 0)}
                                </TableCell>
                                <TableCell className="pr-5 align-top text-right">
                                  <time dateTime={row.hub.soldAt ?? undefined} className="text-xs tabular-nums text-muted-foreground">
                                    {fmtDateShort(row.hub.soldAt) || null}
                                  </time>
                                </TableCell>
                              </TableRow>
                            ) : (
                              <TableRow key={`peer-p-${row.peer.id}`} className={rowStripe} data-purchase-id={row.peer.id}>
                                <TableCell className="pl-5 align-top">
                                  <FlatStatus label="Peer purchase" tone="neutral" />
                                </TableCell>
                                <TableCell className="min-w-0 align-top">
                                  <span className="line-clamp-2 font-medium">{row.peer.bookTitle}</span>
                                  {hubLabel(row.peer.dropoffHubId) ? (
                                    <p className="mt-1 text-[10px] text-muted-foreground md:hidden">
                                      {hubLabel(row.peer.dropoffHubId)}
                                    </p>
                                  ) : null}
                                </TableCell>
                                <TableCell className="hidden align-top text-sm text-muted-foreground md:table-cell">
                                  {hubLabel(row.peer.dropoffHubId) || null}
                                </TableCell>
                                <TableCell className="align-top text-right tabular-nums">
                                  ₹{fmtInr(row.peer.price)}
                                </TableCell>
                                <TableCell className="pr-5 align-top text-right">
                                  <span className="text-xs tabular-nums text-muted-foreground">
                                    {fmtDateShort(row.peer.soldAt) || null}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ),
                          )}
                        </TableBody>
                      </Table>,
                    )}
                  </BlockCard>
                ) : null}

                {showRequests ? (
                  <BlockCard
                    id="requests"
                    title="Requests"
                    description="Request lifecycle timeline, sorted by most recent updates."
                    isLoading={reqQ.isLoading}
                  >
                    {tableShell(
                      <Table className="w-full table-fixed">
                        <TableHeader>
                          <TableRow className="border-border/50 hover:bg-transparent">
                            <TableHead className="w-[28%] pl-5">Book &amp; notes</TableHead>
                            <TableHead className="hidden w-[22%] lg:table-cell">Hub</TableHead>
                            <TableHead className="w-[12%] whitespace-nowrap">Requested</TableHead>
                            <TableHead className="hidden w-[12%] whitespace-nowrap sm:table-cell">Updated</TableHead>
                            <TableHead className="hidden w-[12%] whitespace-nowrap md:table-cell">Live since</TableHead>
                            <TableHead className="w-[14%] pr-5 text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {requestsByRecent.map((r) => (
                            <TableRow key={r.id} className={rowStripe} data-request-id={r.id}>
                              <TableCell className="min-w-0 pl-5 align-top">
                                <p className="font-medium text-foreground">
                                  {r.bookTitle?.trim() || "Book request"}
                                </p>
                                {r.notes?.trim() ? (
                                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                    {r.notes}
                                  </p>
                                ) : null}
                                <RequestProgress status={r.status} />
                                {hubLabel(r.hubId) ? (
                                  <p className="mt-1 text-[10px] text-muted-foreground lg:hidden">
                                    {hubLabel(r.hubId)}
                                  </p>
                                ) : null}
                              </TableCell>
                              <TableCell className="hidden align-top text-sm text-muted-foreground lg:table-cell">
                                {hubLabel(r.hubId) || null}
                              </TableCell>
                              <TableCell className="align-top text-xs text-muted-foreground">
                                {fmtDateOnly(r.createdAt) || null}
                              </TableCell>
                              <TableCell className="hidden align-top text-xs text-muted-foreground sm:table-cell">
                                {fmtDateShort(r.updatedAt ?? r.createdAt) || null}
                              </TableCell>
                              <TableCell className="hidden align-top text-xs text-muted-foreground md:table-cell">
                                {r.readyAt ? fmtDateShort(r.readyAt) : null}
                              </TableCell>
                              <TableCell className="pr-5 align-top text-right">
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                  <FlatStatus
                                    label={requestStatusLabel(r.status)}
                                    tone={
                                      r.status === "expired" || r.status === "cancelled"
                                        ? "destructive"
                                        : r.status === "ready" || r.status === "fulfilled"
                                          ? "amber"
                                          : "neutral"
                                    }
                                  />
                                </div>
                                <p className="mt-2 text-left text-[11px] text-muted-foreground sm:text-right">
                                  {requestNextText(r.status)}
                                </p>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>,
                    )}
                  </BlockCard>
                ) : null}

                {showListings ? (
                  <BlockCard
                    title="Completed peer transactions"
                    description="Closed listing outcomes only."
                    isLoading={p2pQ.isLoading}
                  >
                    {/* Mobile: card list */}
                    <div className="space-y-2 px-4 sm:hidden">
                      {myListings.map((l) => (
                        <div
                          key={l.id}
                          className="rounded-lg border border-border bg-card/60 p-3 text-sm"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="font-medium text-foreground line-clamp-2 flex-1">{l.bookTitle}</p>
                            <FlatStatus
                              label={
                                l.status === "listed"
                                  ? "Draft"
                                  : l.status === "pending_dropoff"
                                    ? "Pending drop-off"
                                    : l.status === "available"
                                      ? "On shelf"
                                      : l.status === "sold"
                                        ? "Sold"
                                        : l.status.replace(/_/g, " ")
                              }
                              tone={l.status === "sold" ? "emerald" : "destructive"}
                            />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>Buy: <span className="font-medium text-foreground tabular-nums">₹{fmtInr(l.price)}</span></span>
                            <span>Borrow: <span className="font-medium text-foreground tabular-nums">₹{fmtInr(l.borrowPrice ?? 0)}</span></span>
                            {l.refId && <span className="font-mono">{l.refId}</span>}
                            {fmtDateShort(l.updatedAt) && <span>{fmtDateShort(l.updatedAt)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop: table */}
                    {tableShell(
                      <Table className="hidden w-full table-fixed sm:table">
                        <TableHeader>
                          <TableRow className="border-border/50 hover:bg-transparent">
                            <TableHead className="w-[30%] pl-5">Title</TableHead>
                            <TableHead className="hidden w-[15%] sm:table-cell">Ref ID</TableHead>
                            <TableHead className="w-[10%] whitespace-nowrap text-right">Buy ₹</TableHead>
                            <TableHead className="w-[10%] whitespace-nowrap text-right">Borrow ₹</TableHead>
                            <TableHead className="hidden w-[16%] md:table-cell">Drop-off hub</TableHead>
                            <TableHead className="hidden w-[10%] whitespace-nowrap lg:table-cell">Updated</TableHead>
                            <TableHead className="w-[14%] pr-5 text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {myListings.map((l) => (
                            <TableRow key={l.id} className={rowStripe}>
                              <TableCell className="min-w-0 pl-5 align-top font-medium">
                                <span className="line-clamp-2">{l.bookTitle}</span>
                              </TableCell>
                              <TableCell className="hidden align-top font-mono text-[11px] text-muted-foreground sm:table-cell">
                                {l.refId ?? "—"}
                              </TableCell>
                              <TableCell className="align-top text-right tabular-nums">₹{fmtInr(l.price)}</TableCell>
                              <TableCell className="align-top text-right tabular-nums text-muted-foreground">
                                ₹{fmtInr(l.borrowPrice ?? 0)}
                              </TableCell>
                              <TableCell className="hidden align-top text-sm text-muted-foreground md:table-cell">
                                {hubLabel(l.dropoffHubId) || null}
                              </TableCell>
                              <TableCell className="hidden align-top text-xs text-muted-foreground lg:table-cell">
                                {fmtDateShort(l.updatedAt) || null}
                              </TableCell>
                              <TableCell className="pr-5 align-top text-right">
                                <div className="flex justify-end">
                                  <FlatStatus
                                    label={
                                      l.status === "listed"
                                        ? "Draft"
                                        : l.status === "pending_dropoff"
                                          ? "Pending drop-off"
                                          : l.status === "available"
                                            ? "On shelf"
                                            : l.status === "sold"
                                              ? "Sold"
                                              : l.status.replace(/_/g, " ")
                                    }
                                    tone={l.status === "sold" ? "emerald" : "destructive"}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>,
                    )}
                  </BlockCard>
                ) : null}
              </div>
            </section>
          </>
        ) : null}

        {showPeerSection ? (
          <>
            <Separator className="my-8" />
            <section aria-label="Peer interactions">
              <SectionHeading
                kicker="Peer interactions"
                title="Active peer rentals"
                description="Purchases you completed are under Purchases; this is only what you are borrowing."
              />
              <div className="mt-6">
                <BlockCard
                  title="Peer borrows"
                  description="Due date and pickup hub are binding; return when you drop the copy."
                  isLoading={false}
                >
                  {tableShell(
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead className="pl-5">Title</TableHead>
                          <TableHead className="hidden sm:table-cell">Pickup hub</TableHead>
                          <TableHead className="whitespace-nowrap">Due</TableHead>
                          <TableHead className="whitespace-nowrap text-right">Fee ₹</TableHead>
                          <TableHead className="whitespace-nowrap text-right">Buy was ₹</TableHead>
                          <TableHead className="pr-5 text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myPeerBorrows.map((l) => (
                          <TableRow key={l.id} className={rowStripe}>
                            <TableCell className="min-w-0 pl-5 align-top">
                              <span className="line-clamp-2 font-medium">{l.bookTitle}</span>
                              {hubLabel(l.dropoffHubId) ? (
                                <p className="mt-1 text-[10px] text-muted-foreground sm:hidden">
                                  {hubLabel(l.dropoffHubId)}
                                </p>
                              ) : null}
                            </TableCell>
                            <TableCell className="hidden align-top text-sm text-muted-foreground sm:table-cell">
                              {hubLabel(l.dropoffHubId) || null}
                            </TableCell>
                            <TableCell className="align-top text-sm text-muted-foreground">
                              {fmtDue(l.borrowDueAt) || null}
                            </TableCell>
                            <TableCell className="align-top text-right tabular-nums">
                              ₹{fmtInr(l.borrowPrice ?? 0)}
                            </TableCell>
                            <TableCell className="align-top text-right tabular-nums text-muted-foreground">
                              ₹{fmtInr(l.price)}
                            </TableCell>
                            <TableCell className="pr-5 align-top text-right">
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <FlatStatus label="Borrowed" tone="amber" />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-md"
                                  disabled={returnPeerBorrow.isPending}
                                  onClick={() => returnPeerBorrow.mutate(l.id)}
                                >
                                  Return
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>,
                  )}
                </BlockCard>
              </div>
            </section>
          </>
        ) : null}

      </div>
    </div>
  );
}
