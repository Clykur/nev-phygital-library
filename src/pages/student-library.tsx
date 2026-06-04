import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { useStudentShell } from "@/components/layout/StudentAppShell";
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
import {
  STATUS_CHIP_AMBER_SOFT,
  STATUS_CHIP_DESTRUCTIVE_SOFT,
  STATUS_CHIP_EMERALD,
} from "@/lib/status-chip-tones";
import { isHubAccount } from "@/lib/app-paths";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

type Hub = { id: string; name: string };
type BookRow = {
  id: string;
  title: string;
  hubId: string;
  status: string;
  borrowerUserId: string | null;
  dueAt?: string | null;
  soldToUserId?: string | null;
  soldAt?: string | null;
};
type P2pRow = {
  id: string;
  bookTitle: string;
  status: string;
  buyerId: string | null;
  borrowerUserId?: string | null;
  borrowDueAt?: string | null;
  dropoffHubId?: string | null;
  soldAt?: string | null;
};
type RequestRow = {
  id: string;
  hubId: string;
  bookTitle?: string | null;
  status: string;
};

function fmtDue(iso: string | undefined | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function dueState(dueAt: string | null | undefined): "active" | "soon" | "overdue" {
  if (!dueAt) return "active";
  const due = new Date(dueAt).getTime();
  const now = Date.now();
  if (Number.isNaN(due)) return "active";
  if (due < now) return "overdue";
  if (due - now < 2 * 24 * 60 * 60 * 1000) return "soon";
  return "active";
}

function statusLabel(state: "active" | "soon" | "overdue") {
  if (state === "soon") return "Due soon";
  if (state === "overdue") return "Overdue";
  return "Active";
}

function StatusChip({ state }: { state: "active" | "soon" | "overdue" }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-sm border px-3 text-[10px] font-semibold uppercase tracking-wide",
        state === "active" && STATUS_CHIP_EMERALD,
        state === "soon" && STATUS_CHIP_AMBER_SOFT,
        state === "overdue" && STATUS_CHIP_DESTRUCTIVE_SOFT,
      )}
    >
      {statusLabel(state)}
    </span>
  );
}

function Section({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    id: string;
    title: string;
    hub: string;
    due: string;
    state: "active" | "soon" | "overdue";
    ctaLabel: string;
    onCta?: () => void;
    ctaHref?: string;
  }>;
}) {
  return (
    <section className="rounded-md border border-border bg-background">
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-6 text-sm text-muted-foreground">
          No items here yet. <Link href="/student/borrow" className="underline underline-offset-2">Browse books</Link>.
        </div>
      ) : (
        <div className="overflow-x-auto pb-4 pt-3">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="pl-5">Title</TableHead>
                <TableHead>Pickup hub</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="pr-5 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow
                  key={r.id}
                  className={cn(
                    "even:bg-muted/[0.35]",
                    r.state === "overdue" && "border-l-2 border-l-destructive/80",
                    r.state === "soon" && "border-l-2 border-l-accent/80",
                  )}
                  data-library-row-id={r.id}
                >
                  <TableCell className="pl-5 font-medium">{r.title}</TableCell>
                  <TableCell className="text-muted-foreground">{r.hub || "Hub"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.due}</TableCell>
                  <TableCell>
                    {r.onCta ? (
                      <Button size="sm" variant="outline" className="rounded-md" onClick={r.onCta}>
                        {r.ctaLabel}
                      </Button>
                    ) : r.ctaHref ? (
                      <Button size="sm" variant="outline" className="rounded-md" asChild>
                        <Link href={r.ctaHref}>{r.ctaLabel}</Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-5 text-right"><StatusChip state={r.state} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

export default function StudentLibraryPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const inShell = useStudentShell();
  const hubDesk = !!user && isHubAccount(user);
  const top = inShell ? "" : "pt-24";
  const pageWrap = inShell ? "w-full" : PORTAL_PAGE_CONTAINER;
  const [confirmReturn, setConfirmReturn] = useState<{ type: "hub" | "peer"; id: string; hubName: string; title: string } | null>(null);

  const hubsQ = useQuery({
    queryKey: ["catalog", "hubs"],
    enabled: !!token,
    queryFn: () => apiFetch<{ hubs: Hub[] }>("/api/catalog/hubs", { token: token! }),
  });
  const booksQ = useQuery({
    queryKey: ["catalog", "books", "student-library", user?.userId],
    enabled: !!token && !!user,
    queryFn: () => apiFetch<{ books: BookRow[] }>("/api/catalog/books", { token: token! }),
  });
  const p2pQ = useQuery({
    queryKey: ["p2p-listings", "student-library", user?.userId],
    enabled: !!token && !!user,
    queryFn: () => apiFetch<{ listings: P2pRow[] }>("/api/p2p/listings", { token: token! }),
  });
  const reqQ = useQuery({
    queryKey: ["book-requests", "mine"],
    enabled: !!token,
    queryFn: () => apiFetch<{ requests: RequestRow[] }>("/api/book-requests/mine", { token: token! }),
  });

  const returnHubBook = useMutation({
    mutationFn: async (bookId: string) => {
      await apiFetch(`/api/books/${bookId}/return`, { method: "POST", token: token! });
    },
    onSuccess: () => {
      toast.success("Return recorded.");
      setConfirmReturn(null);
      void qc.invalidateQueries({ queryKey: ["catalog", "books"] });
      void qc.invalidateQueries({ queryKey: ["book-requests"] });
    },
    onError: () => toast.error("Could not process return."),
  });
  const returnPeerBorrow = useMutation({
    mutationFn: async (listingId: string) => {
      await apiFetch(`/api/p2p/listings/${listingId}/return-borrow`, { method: "POST", token: token! });
    },
    onSuccess: () => {
      toast.success("Peer borrow return recorded.");
      setConfirmReturn(null);
      void qc.invalidateQueries({ queryKey: ["p2p-listings"] });
      void qc.invalidateQueries({ queryKey: ["book-requests"] });
    },
    onError: () => toast.error("Could not process return."),
  });

  const hubName = (hubId: string | undefined | null) =>
    hubId ? hubsQ.data?.hubs.find((h) => h.id === hubId)?.name ?? "Hub" : "Hub";

  const borrowedFromHub = useMemo(() => {
    const rows = booksQ.data?.books ?? [];
    return rows
      .filter(
        (b) => b.borrowerUserId === user?.userId && (b.status === "checked_out" || b.status === "overdue"),
      )
      .map((b) => ({
        id: b.id,
        title: b.title,
        hub: hubName(b.hubId),
        due: fmtDue(b.dueAt),
        state: dueState(b.dueAt),
        ctaLabel: "Return this book",
        onCta: () =>
          setConfirmReturn({ type: "hub", id: b.id, hubName: hubName(b.hubId), title: b.title }),
      }));
  }, [booksQ.data?.books, user?.userId, hubsQ.data?.hubs]);

  const peerBorrows = useMemo(() => {
    const rows = p2pQ.data?.listings ?? [];
    return rows
      .filter((l) => l.borrowerUserId === user?.userId && l.status === "reserved")
      .map((l) => ({
        id: l.id,
        title: l.bookTitle,
        hub: hubName(l.dropoffHubId),
        due: fmtDue(l.borrowDueAt),
        state: dueState(l.borrowDueAt),
        ctaLabel: "Return to hub",
        onCta: () =>
          setConfirmReturn({
            type: "peer",
            id: l.id,
            hubName: hubName(l.dropoffHubId),
            title: l.bookTitle,
          }),
      }));
  }, [p2pQ.data?.listings, user?.userId, hubsQ.data?.hubs]);

  const pendingPickupPurchases = useMemo(() => {
    const ready = (reqQ.data?.requests ?? [])
      .filter((r) => r.status === "ready")
      .map((r) => ({
        id: r.id,
        title: r.bookTitle?.trim() || "Requested title",
        hub: hubName(r.hubId),
        due: "Pickup pending",
        state: "active" as const,
        ctaLabel: "View pickup details",
        ctaHref: `/student/borrow?focus=request&ref=${encodeURIComponent(r.id)}`,
      }));
    return ready;
  }, [reqQ.data?.requests, hubsQ.data?.hubs]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const focus = params.get("focus");
    const ref = params.get("ref");
    if (focus !== "request" || !ref) return;
    const el = document.querySelector(`[data-library-row-id="${CSS.escape(ref)}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary/50", "bg-primary/5");
    const t = window.setTimeout(() => {
      el.classList.remove("ring-2", "ring-primary/50", "bg-primary/5");
    }, 2600);
    return () => window.clearTimeout(t);
  }, [pendingPickupPurchases]);

  return (
    <div className={cn("min-h-[100dvh] bg-background pb-20", top)}>
      <div className={cn("mx-auto", pageWrap)}>
        <div className="mb-8 border-b border-border/30 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#64748B]">
            {hubDesk ? "Hub portal" : "student"}
          </p>
          <h1 className="mt-1 font-[var(--font-display)] text-lg font-bold tracking-tight text-foreground">
            My library
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Active responsibilities only: rentals and pickup-pending items.
          </p>
        </div>
        <section className="space-y-8">
          <Section title="Borrowed from hub" rows={borrowedFromHub} />
          <Section title="Peer borrows" rows={peerBorrows} />
          <Section title="Purchased (not yet picked up)" rows={pendingPickupPurchases} />
        </section>
        <Separator className="my-8" />
      </div>
      <Dialog open={!!confirmReturn} onOpenChange={(o) => !o && setConfirmReturn(null)}>
        <DialogContent className="gap-0 p-0 sm:max-w-md">
          <div className="p-6 pb-0">
            <DialogHeader className="space-y-3 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Return book
              </p>
              <DialogTitle className="font-[var(--font-display)] text-xl font-bold tracking-tight text-foreground">
                Confirm return
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Hand the physical copy to the hub desk, then confirm here so your loan clears in Neev.
              </DialogDescription>
            </DialogHeader>
          </div>

          {confirmReturn ? (
            <div className="mx-6 mt-5 flex gap-3 rounded-md border border-border bg-muted/25 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
                <RotateCcw className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {confirmReturn.type === "hub" ? "Borrowed from hub" : "Peer borrow · drop-off hub"}
                </p>
                <p className="mt-1.5 font-medium leading-snug text-foreground">{confirmReturn.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{confirmReturn.hubName}</span>
                </p>
              </div>
            </div>
          ) : null}

          <DialogFooter className="mt-6 border-t border-border bg-muted/15 px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-none border-border sm:min-w-[100px]"
              disabled={returnHubBook.isPending || returnPeerBorrow.isPending}
              onClick={() => setConfirmReturn(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-11 rounded-none font-semibold sm:min-w-[160px]"
              disabled={returnHubBook.isPending || returnPeerBorrow.isPending || !confirmReturn}
              onClick={() => {
                if (!confirmReturn) return;
                if (confirmReturn.type === "hub") {
                  returnHubBook.mutate(confirmReturn.id);
                } else {
                  returnPeerBorrow.mutate(confirmReturn.id);
                }
              }}
            >
              {returnHubBook.isPending || returnPeerBorrow.isPending ? "Returning…" : "Confirm return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
