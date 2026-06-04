import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import { useStudentShell } from "@/components/layout/StudentAppShell";
import { PORTAL_PAGE_CONTAINER } from "@/lib/student-ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { isHubAccount, portalPathsForUser } from "@/lib/app-paths";
import { Link } from "wouter";

type NotifRow = {
  id: string;
  kind: string;
  body: string;
  bookRequestId?: string | null;
  readAt?: string | null;
  createdAt?: string;
};

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

function fmtKindLabel(kind: string) {
  return kind.replace(/_/g, " ");
}

function notificationPriority(kind: string) {
  if (kind === "book_request_ready") return 1;
  if (kind === "book_request_routed" || kind === "book_request_fulfilled") return 2;
  if (kind === "hub_return_confirmation" || kind === "p2p_return_confirmation") return 3;
  if (kind === "p2p_purchase_confirmation" || kind === "hub_purchase_confirmation") return 3;
  if (kind === "book_request_expired" || kind === "book_request_cancelled") return 4;
  return 5;
}

type AlertNav = {
  type: "request_update" | "ready_for_pickup" | "purchase_confirmation" | "peer_purchase";
  referenceId: string | null;
  href: string;
};

function resolveAlertNav(n: NotifRow, activity: string, borrow: string): AlertNav {
  const requestUpdateKinds = new Set([
    "book_request_routed",
    "book_request_fulfilled",
    "book_request_cancelled",
    "book_request_expired",
    "book_request_picked",
  ]);
  if (n.kind === "book_request_ready") {
    const ref = n.bookRequestId ?? null;
    return {
      type: "ready_for_pickup",
      referenceId: ref,
      href: ref ? `/student/library?focus=request&ref=${encodeURIComponent(ref)}` : "/student/library",
    };
  }
  if (requestUpdateKinds.has(n.kind)) {
    const ref = n.bookRequestId ?? null;
    return {
      type: "request_update",
      referenceId: ref,
      href: ref
        ? `${activity}?focus=request&ref=${encodeURIComponent(ref)}#requests`
        : activity,
    };
  }
  if (n.kind === "p2p_purchase_confirmation") {
    return {
      type: "peer_purchase",
      referenceId: null,
      href: `${activity}#purchases`,
    };
  }
  if (n.kind === "hub_purchase_confirmation") {
    return {
      type: "purchase_confirmation",
      referenceId: null,
      href: `${activity}#purchases`,
    };
  }
  if (n.kind === "hub_return_confirmation" || n.kind === "p2p_return_confirmation") {
    return {
      type: "request_update",
      referenceId: null,
      href: activity,
    };
  }
  return {
    type: "request_update",
    referenceId: n.bookRequestId ?? null,
    href: activity,
  };
}

const outline = "rounded-md border border-border bg-background";

function FlatStatus({ label }: { label: string }) {
  return (
    <span className="inline-flex h-6 items-center whitespace-nowrap rounded-md border border-border bg-muted/30 px-2.5 text-[9px] font-semibold uppercase tracking-[0.03em] text-foreground">
      {label}
    </span>
  );
}

export default function StudentAlertsPage() {
  const { token, user } = useAuth();
  const inShell = useStudentShell();
  const hubDesk = !!user && isHubAccount(user);
  const portalPaths = portalPathsForUser(user);
  const top = inShell ? "" : "pt-24";
  const pageWrap = inShell ? "w-full" : PORTAL_PAGE_CONTAINER;
  const rowStripe = "even:bg-muted/[0.35]";

  const notifQ = useQuery({
    queryKey: ["notifications", "mine", "alerts-page"],
    enabled: !!token,
    queryFn: () =>
      apiFetch<{ notifications: NotifRow[] }>("/api/notifications/mine", { token: token! }),
  });

  const notifications = useMemo(() => {
    const actionableKinds = new Set([
      "book_request_ready",
      "book_request_routed",
      "book_request_fulfilled",
      "book_request_cancelled",
      "book_request_expired",
      "book_request_picked",
      "p2p_purchase_confirmation",
      "hub_purchase_confirmation",
      "hub_return_confirmation",
      "p2p_return_confirmation",
    ]);
    const rows = (notifQ.data?.notifications ?? []).filter(
      (n) => actionableKinds.has(n.kind) && !(n.readAt && notificationPriority(n.kind) >= 4),
    );
    return [...rows].sort((a, b) => {
      const pa = notificationPriority(a.kind);
      const pb = notificationPriority(b.kind);
      if (pa !== pb) return pa - pb;
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [notifQ.data?.notifications]);
  const notificationBuckets = useMemo(() => {
    const requiresAction = notifications.filter((n) => notificationPriority(n.kind) <= 3);
    const informational = notifications.filter((n) => notificationPriority(n.kind) > 3);
    return { requiresAction, informational };
  }, [notifications]);

  return (
    <div className={cn("min-h-[100dvh] bg-background pb-20", top)}>
      <div className={cn("mx-auto", pageWrap)}>
        <div className="mb-8 border-b border-border/30 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#64748B]">
            {user?.baseRole === "super_admin" ? "Super admin" : hubDesk ? "Hub portal" : "Student"}
          </p>
          <h1 className="mt-1 font-[var(--font-display)] text-lg font-bold tracking-tight text-foreground">
            Alerts
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Prioritized for pickup, request updates, and purchase confirmations.
          </p>
        </div>

        <section aria-label="Notifications">
          <div className={cn(outline, "overflow-hidden")}>
            <div className="border-b border-border px-5 py-3">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">Hub notifications</h3>
            </div>
            <div className="p-4">
              {notifQ.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : notifQ.isError ? (
                <p className="text-sm text-destructive">
                  {notifQ.error instanceof ApiError ? notifQ.error.message : "Could not load notifications."}
                </p>
              ) : notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No alerts yet. <Link href={portalPaths.borrow} className="underline underline-offset-2">Browse books</Link>,{" "}
                  <Link href={portalPaths.activity} className="underline underline-offset-2">request a book</Link>, or{" "}
                  <Link href={portalPaths.sell} className="underline underline-offset-2">list a book</Link>.
                </p>
              ) : (
                <div className="space-y-6">
                  {(
                    [
                      { label: "Requires action", rows: notificationBuckets.requiresAction },
                      { label: "Informational", rows: notificationBuckets.informational },
                    ] as const
                  ).map((bucket) =>
                    bucket.rows.length > 0 ? (
                      <div key={bucket.label}>
                        <p className="mb-2 pl-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          {bucket.label}
                        </p>

                        {/* Mobile: card list */}
                        <div className="space-y-2 sm:hidden">
                          {bucket.rows.map((n) => {
                            const nav = resolveAlertNav(n, portalPaths.activity, portalPaths.borrow);
                            return (
                              <div
                                key={n.id}
                                className={cn(
                                  "rounded-lg border border-border p-3 text-sm",
                                  !n.readAt && "border-gray-500/30",
                                )}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <FlatStatus label={fmtKindLabel(n.kind)} />
                                  {n.createdAt && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {fmtDateShort(n.createdAt)}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-2 leading-relaxed text-foreground">{n.body}</p>
                                <Link href={nav.href} className="mt-2 block">
                                  <span className="inline-flex h-8 items-center rounded-md border border-border bg-muted/30 px-3 text-xs font-medium text-foreground">
                                    Take action
                                  </span>
                                </Link>
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop: table */}
                        <Table className="hidden w-full table-fixed sm:table">
                          <TableHeader>
                            <TableRow className="border-border/50 hover:bg-transparent">
                              <TableHead className="w-[18%] pl-5">When</TableHead>
                              <TableHead className="w-[20%]">Type</TableHead>
                              <TableHead className="w-[62%] pr-5">Message</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bucket.rows.map((n) => (
                              <TableRow key={n.id} className={cn(rowStripe, "align-top")}>
                                <TableCell className="whitespace-nowrap pl-5 py-3 align-top text-[11px] text-muted-foreground">
                                  {fmtDateShort(n.createdAt) || null}
                                </TableCell>
                                <TableCell className="py-3 align-top">
                                  <FlatStatus label={fmtKindLabel(n.kind)} />
                                </TableCell>
                                <TableCell className="min-w-[200px] pr-5 py-3 align-top text-sm leading-relaxed text-foreground">
                                  <div className="space-y-1">
                                    <p>{n.body}</p>
                                    <Link href={resolveAlertNav(n, portalPaths.activity, portalPaths.borrow).href}>
                                      <span className="inline-flex h-7 items-center rounded-md border border-border bg-muted/30 px-3 text-xs font-medium text-foreground">
                                        Take action
                                      </span>
                                    </Link>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
        <Separator className="my-8" />
      </div>
    </div>
  );
}
