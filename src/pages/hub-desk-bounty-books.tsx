import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useStudentShell } from "@/components/layout/StudentAppShell";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import { portalPathsForUser } from "@/lib/app-paths";
import { adminPanel, adminSearchInput, adminSelectTrigger } from "@/lib/admin-desk-ui";
import { PORTAL_PAGE_LEAD, PORTAL_PAGE_TITLE } from "@/lib/portal-typography";
import { PORTAL_INLINE_LINK, PORTAL_PAGE_GUTTER_X } from "@/lib/student-ui";
import {
  bountyRequestStatusLabel,
  bountyRewardStatusLabel,
  bountySubmissionStatusLabel,
  fmtBountyReward,
  type BountyRequestRow,
  type BountySubmissionRow,
} from "@/lib/bounty";
import { refreshBountyQueries } from "@/lib/bounty-cache";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Shield } from "lucide-react";
import { toast } from "sonner";

type Hub = { id: string; name: string; kind?: string };

const REQUEST_STATUSES = [
  "all",
  "open",
  "paused",
  "pending_student_delivery",
  "under_review",
  "approved",
  "completed",
  "closed",
] as const;

const emptyForm = {
  title: "",
  author: "",
  edition: "",
  department: "",
  semester: "",
  subject: "",
  isbn: "",
  quantity: "1",
  rewardAmount: "0",
  notes: "",
  expiryDate: "",
};

function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="section-kicker">{children}</h2>;
}

export default function HubDeskBountyBooksPage() {
  const { token, user, loading } = useAuth();
  const inShell = useStudentShell();
  const qc = useQueryClient();
  const [hubId, setHubId] = useState<string>("all");
  const [statusQ, setStatusQ] = useState<string>("all");
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [createHubId, setCreateHubId] = useState("");
  const [inventoryPricingTarget, setInventoryPricingTarget] = useState<BountySubmissionRow | null>(null);
  const [inventoryBorrowPrice, setInventoryBorrowPrice] = useState("");
  const [inventoryBuyPrice, setInventoryBuyPrice] = useState("");

  const topPad = inShell ? "" : "pt-24";
  const overviewHubId =
    user && user.hubStaffHubIds.length === 1 ? user.hubStaffHubIds[0]! : hubId === "all" ? undefined : hubId;

  const listUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (overviewHubId) p.set("hubId", overviewHubId);
    const qs = p.toString();
    return `/api/bounty/hub/requests${qs ? `?${qs}` : ""}`;
  }, [overviewHubId]);

  const hubsQ = useQuery({
    queryKey: ["catalog", "hubs", "bounty-desk"],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: () => apiFetch<{ hubs: Hub[] }>("/api/catalog/hubs", { token: token! }),
  });

  const listQ = useQuery({
    queryKey: ["bounty", "hub-requests", listUrl, token],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: () => apiFetch<{ requests: BountyRequestRow[] }>(listUrl, { token: token! }),
  });

  const detailQ = useQuery({
    queryKey: ["bounty", "hub-request-detail", detailId, token],
    enabled: !!token && !!detailId,
    queryFn: () =>
      apiFetch<{ request: BountyRequestRow; submissions: BountySubmissionRow[] }>(
        `/api/bounty/hub/requests/${detailId}`,
        { token: token! },
      ),
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch("/api/bounty/hub/requests", {
        token: token!,
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await refreshBountyQueries(qc);
      toast.success("Bounty request created.");
      setCreateOpen(false);
      setForm(emptyForm);
    },
    onError: (err: ApiError) => toast.error(err.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/api/bounty/hub/requests/${id}`, {
        token: token!,
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: async () => {
      await refreshBountyQueries(qc);
      toast.success("Bounty request updated.");
    },
    onError: (err: ApiError) => toast.error(err.message),
  });

  const submissionMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/api/bounty/hub/submissions/${id}`, {
        token: token!,
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: async () => {
      await refreshBountyQueries(qc);
      toast.success("Submission updated.");
    },
    onError: (err: ApiError) => toast.error(err.message),
  });

  const confirmReceiptMutation = useMutation({
    mutationFn: ({
      submissionId,
      borrowPrice,
      buyPrice,
    }: {
      submissionId: string;
      borrowPrice: number;
      buyPrice: number;
    }) =>
      apiFetch(`/api/bounty/hub/submissions/${submissionId}/confirm-receipt`, {
        token: token!,
        method: "POST",
        body: JSON.stringify({ borrowPrice, buyPrice }),
      }),
    onSuccess: async () => {
      await refreshBountyQueries(qc);
      toast.success("Book added to inventory.");
      setInventoryPricingTarget(null);
      setInventoryBorrowPrice("");
      setInventoryBuyPrice("");
    },
    onError: (err: ApiError) => toast.error(err.message),
  });

  const rows = listQ.data?.requests ?? [];
  const filtered = useMemo(() => {
    let r = rows;
    if (statusQ !== "all") r = r.filter((x) => x.status === statusQ);
    const t = q.trim().toLowerCase();
    if (t) {
      r = r.filter(
        (x) =>
          x.title.toLowerCase().includes(t) ||
          (x.author?.toLowerCase().includes(t) ?? false) ||
          (x.department?.toLowerCase().includes(t) ?? false),
      );
    }
    return [...r].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [rows, statusQ, q]);

  if (loading) {
    return (
      <div className={cn("flex min-h-[50dvh] items-center justify-center", topPad)}>
        <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (!user?.hubStaffHubIds.length) {
    return (
      <div className={cn("mx-auto max-w-lg pb-20 text-center", PORTAL_PAGE_GUTTER_X, inShell ? "pt-8" : "pt-28")}>
        <Shield className="mx-auto h-7 w-7 text-foreground-muted" />
        <h1 className="mt-6 h4-scale font-semibold text-foreground">Restricted</h1>
        <p className="mt-2 body-scale text-foreground-muted">Hub staff only.</p>
        <Button asChild className="mt-8 rounded-full">
          <Link href={user ? portalPathsForUser(user).overview : "/library"}>Back</Link>
        </Button>
      </div>
    );
  }

  const p = portalPathsForUser(user!);
  const defaultHub =
    user.hubStaffHubIds.length === 1
      ? user.hubStaffHubIds[0]!
      : createHubId || user.hubStaffHubIds[0]!;

  const handleCreate = () => {
    if (!form.title.trim()) {
      toast.error("Book title is required.");
      return;
    }
    createMutation.mutate({
      hubId: defaultHub,
      title: form.title,
      author: form.author || undefined,
      edition: form.edition || undefined,
      department: form.department || undefined,
      semester: form.semester || undefined,
      subject: form.subject || undefined,
      isbn: form.isbn || undefined,
      quantity: Number(form.quantity) || 1,
      rewardAmount: Number(form.rewardAmount) || 0,
      notes: form.notes || undefined,
      expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
    });
  };

  const openInventoryPricing = (sub: BountySubmissionRow) => {
    setInventoryPricingTarget(sub);
    setInventoryBorrowPrice("");
    setInventoryBuyPrice(String(sub.rewardAmount ?? ""));
  };

  const submitInventoryPricing = () => {
    if (!inventoryPricingTarget) return;
    const borrowPrice = Number.parseInt(inventoryBorrowPrice, 10);
    const buyPrice = Number.parseInt(inventoryBuyPrice, 10);
    if (!Number.isFinite(borrowPrice) || borrowPrice < 0) {
      toast.error("Enter a valid borrow price in credits.");
      return;
    }
    if (!Number.isFinite(buyPrice) || buyPrice <= 0) {
      toast.error("Enter a valid buy/new book price.");
      return;
    }
    confirmReceiptMutation.mutate({
      submissionId: inventoryPricingTarget.id,
      borrowPrice,
      buyPrice,
    });
  };

  return (
    <div className={cn(topPad, "pb-10 lg:pb-10")}>
      <div className="mb-6 w-full min-w-0 border-b border-border pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className={cn("mt-1", PORTAL_PAGE_TITLE)}>Bounty Books</h1>
            <p className={cn("mt-2 w-full max-w-none", PORTAL_PAGE_LEAD)}>
              Library acquisition requests — post books you need and reward students who bring them in.
              Accepted copies move to{" "}
              <Link href={p.inventory} className={PORTAL_INLINE_LINK}>
                Inventory
              </Link>{" "}
              automatically after hub receipt confirmation.
            </p>
          </div>
          <Button className="shrink-0 rounded-xl" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New bounty request
          </Button>
        </div>

        <div className="mt-4 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-end sm:gap-3">
          <div className="flex min-w-0 w-full flex-[3] flex-col gap-1.5">
            <Label htmlFor="bounty-desk-search" className="section-kicker">
              Search
            </Label>
            <Input
              id="bounty-desk-search"
              className={adminSearchInput}
              placeholder="Title, author, department…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {user.hubStaffHubIds.length > 1 ? (
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Label htmlFor="bounty-desk-scope" className="section-kicker">
                Scope
              </Label>
              <Select value={hubId} onValueChange={setHubId}>
                <SelectTrigger id="bounty-desk-scope" className={cn(adminSelectTrigger, "text-primary")}>
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
            <Label htmlFor="bounty-desk-status" className="section-kicker">
              Status
            </Label>
            <Select value={statusQ} onValueChange={setStatusQ}>
              <SelectTrigger id="bounty-desk-status" className={cn(adminSelectTrigger, "text-primary")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All statuses" : bountyRequestStatusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <section className={cn(adminPanel, "overflow-hidden")} aria-label="Bounty requests">
        <div className="border-b border-border px-4 py-3">
          <SectionLabel>Requested books</SectionLabel>
          <p className="mt-1 caption-scale font-medium text-foreground-muted">
            {listQ.isLoading ? "…" : `${filtered.length} shown · ${rows.length} in scope`}
          </p>
        </div>
        {listQ.isError ? (
          <p className="px-4 py-10 text-sm text-destructive">Could not load bounty requests.</p>
        ) : listQ.isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-9 w-9 animate-spin text-foreground-muted" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center body-scale text-foreground-muted">
            No bounty requests yet. Create one to start acquiring books from students.
          </div>
        ) : (
          <Table>
            <TableHeader sticky>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Book</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id} className="border-border">
                  <TableCell>
                    <div className="font-medium text-foreground">{row.title}</div>
                    {row.author ? (
                      <div className="caption-scale text-foreground-muted">{row.author}</div>
                    ) : null}
                    {row.hubName ? (
                      <div className="caption-scale text-foreground-subtle">{row.hubName}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-foreground-muted">
                    {[row.department, row.semester].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                  <TableCell className="tabular-nums">{row.quantity}</TableCell>
                  <TableCell className="tabular-nums">{fmtBountyReward(row.rewardAmount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" status="neutral">
                      {bountyRequestStatusLabel(row.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setDetailId(row.id)}>
                        Review
                      </Button>
                      {row.status === "open" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-xl"
                          onClick={() => updateStatusMutation.mutate({ id: row.id, status: "paused" })}
                        >
                          Pause
                        </Button>
                      ) : null}
                      {["paused", "closed"].includes(row.status) ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-xl"
                          onClick={() => updateStatusMutation.mutate({ id: row.id, status: "open" })}
                        >
                          Reopen
                        </Button>
                      ) : null}
                      {!["completed", "closed"].includes(row.status) ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-xl text-destructive"
                          onClick={() => updateStatusMutation.mutate({ id: row.id, status: "closed" })}
                        >
                          Close
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New bounty request</DialogTitle>
            <DialogDescription>
              Students can submit matching books and earn the reward after physical delivery.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {user.hubStaffHubIds.length > 1 ? (
              <div className="space-y-1.5">
                <Label>Hub</Label>
                <Select value={defaultHub} onValueChange={setCreateHubId}>
                  <SelectTrigger className="rounded-xl border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {user.hubStaffHubIds.map((id) => (
                      <SelectItem key={id} value={id}>
                        {hubsQ.data?.hubs.find((h) => h.id === id)?.name ?? id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label>Book title *</Label>
              <Input className="rounded-xl" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Author</Label>
                <Input className="rounded-xl" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Edition</Label>
                <Input className="rounded-xl" value={form.edition} onChange={(e) => setForm({ ...form, edition: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input className="rounded-xl" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Semester</Label>
                <Input className="rounded-xl" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input className="rounded-xl" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>ISBN</Label>
                <Input className="rounded-xl" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Desired quantity</Label>
                <Input type="number" min={1} className="rounded-xl" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Reward amount (₹)</Label>
                <Input type="number" min={0} className="rounded-xl" value={form.rewardAmount} onChange={(e) => setForm({ ...form, rewardAmount: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea className="rounded-xl min-h-[72px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={handleCreate} disabled={createMutation.isPending}>
              Create request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detailQ.data?.request.title ?? "Bounty detail"}</DialogTitle>
            <DialogDescription>
              Review student submissions and confirm physical receipt to add copies to inventory.
            </DialogDescription>
          </DialogHeader>
          {detailQ.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
            </div>
          ) : detailQ.data ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card/60 p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-foreground-muted">Request status:</span>
                  <Badge variant="outline" status="neutral">
                    {bountyRequestStatusLabel(detailQ.data.request.status)}
                  </Badge>
                </div>
                <p className="mt-2">
                  <span className="text-foreground-muted">Reward:</span>{" "}
                  {fmtBountyReward(detailQ.data.request.rewardAmount)} ·{" "}
                  <span className="text-foreground-muted">Qty:</span> {detailQ.data.request.quantity}
                </p>
                {detailQ.data.request.notes ? (
                  <p className="mt-2 text-foreground-muted">{detailQ.data.request.notes}</p>
                ) : null}
              </div>
              {(detailQ.data.submissions ?? []).length === 0 ? (
                <p className="text-sm text-foreground-muted">No student submissions yet.</p>
              ) : (
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {detailQ.data.submissions.map((sub) => (
                    <li key={sub.id} className="space-y-2 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{sub.studentName ?? "Student"}</p>
                          <p className="caption-scale text-foreground-muted">
                            {bountySubmissionStatusLabel(sub.status)} · Condition: {sub.condition}
                          </p>
                        </div>
                        <Badge variant="outline" status="neutral">
                          {bountySubmissionStatusLabel(sub.status)}
                        </Badge>
                      </div>
                      {sub.notes ? <p className="text-sm text-foreground-muted">{sub.notes}</p> : null}
                      <dl className="grid gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="caption-scale text-foreground-muted">Inventory state</dt>
                          <dd className="font-medium text-foreground">
                            {sub.status === "inventory_confirmed" ? "Added to Inventory" : "Not added"}
                          </dd>
                        </div>
                        <div>
                          <dt className="caption-scale text-foreground-muted">Reward state</dt>
                          <dd className="font-medium text-foreground">
                            {bountyRewardStatusLabel(sub.rewardStatus)}
                          </dd>
                          {sub.rewardMethod ? (
                            <p className="caption-scale text-foreground-muted">
                              Method: {sub.rewardMethod === "credits" ? "Credits issued" : "Cash offline"}
                              {sub.cashPayoutStatus ? ` · ${sub.cashPayoutStatus.replace(/_/g, " ")}` : ""}
                            </p>
                          ) : null}
                        </div>
                      </dl>
                      <div className="flex flex-wrap gap-2">
                        {sub.status === "submitted" ? (
                          <>
                            <Button
                              size="sm"
                              className="rounded-xl"
                              disabled={submissionMutation.isPending}
                              onClick={() => submissionMutation.mutate({ id: sub.id, status: "awaiting_drop_off" })}
                            >
                              Approve submission
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="rounded-xl"
                              disabled={submissionMutation.isPending}
                              onClick={() => submissionMutation.mutate({ id: sub.id, status: "rejected" })}
                            >
                              Reject
                            </Button>
                          </>
                        ) : null}
                        {sub.status === "awaiting_drop_off" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            disabled={submissionMutation.isPending}
                            onClick={() => submissionMutation.mutate({ id: sub.id, status: "delivered" })}
                          >
                            Mark delivered
                          </Button>
                        ) : null}
                        {sub.status === "delivered" ? (
                          <Button
                            size="sm"
                            className="rounded-xl"
                            disabled={confirmReceiptMutation.isPending}
                            onClick={() => openInventoryPricing(sub)}
                          >
                            Confirm Receipt → Add to Inventory
                          </Button>
                        ) : null}
                        {sub.status === "inventory_confirmed" ? (
                          <Button size="sm" className="rounded-xl" disabled variant="outline">
                            Added to Inventory
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!inventoryPricingTarget}
        onOpenChange={(open) => !open && setInventoryPricingTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Inventory</DialogTitle>
            <DialogDescription>
              Set pricing for "{inventoryPricingTarget?.bountyTitle}" before adding to inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="borrow-price">Borrow Price (Credits)</Label>
              <Input
                id="borrow-price"
                type="number"
                min={0}
                className="rounded-xl"
                value={inventoryBorrowPrice}
                onChange={(e) => setInventoryBorrowPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="buy-price">Buy Price (New Book Cost)</Label>
              <Input
                id="buy-price"
                type="number"
                min={0}
                className="rounded-xl"
                value={inventoryBuyPrice}
                onChange={(e) => setInventoryBuyPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setInventoryPricingTarget(null)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              disabled={confirmReceiptMutation.isPending}
              onClick={submitInventoryPricing}
            >
              Confirm & Add to Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!inventoryPricingTarget}
        onOpenChange={(open) => !open && setInventoryPricingTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Inventory Pricing</DialogTitle>
            <DialogDescription>
              Set borrowing and purchase prices before adding this bounty book to hub inventory.
            </DialogDescription>
          </DialogHeader>
          {inventoryPricingTarget ? (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-border bg-card/60 p-4 text-sm">
                <p className="font-medium text-foreground">
                  {inventoryPricingTarget.bountyTitle ?? detailQ.data?.request.title ?? "Bounty book"}
                </p>
                <p className="mt-1 text-foreground-muted">
                  Student: {inventoryPricingTarget.studentName ?? "Student"} · Condition: {inventoryPricingTarget.condition}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bounty-inventory-borrow-price">Borrow Price (Credits)</Label>
                <Input
                  id="bounty-inventory-borrow-price"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className="rounded-xl"
                  value={inventoryBorrowPrice}
                  onChange={(e) => setInventoryBorrowPrice(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="e.g. 50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bounty-inventory-buy-price">Buy Price (New Book Cost)</Label>
                <Input
                  id="bounty-inventory-buy-price"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  className="rounded-xl"
                  value={inventoryBuyPrice}
                  onChange={(e) => setInventoryBuyPrice(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="e.g. 450"
                />
                <p className="caption-scale text-foreground-muted">
                  This price is used when students purchase the copy from the hub.
                </p>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={confirmReceiptMutation.isPending}
              onClick={() => setInventoryPricingTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={
                confirmReceiptMutation.isPending ||
                inventoryBorrowPrice.trim() === "" ||
                inventoryBuyPrice.trim() === ""
              }
              onClick={submitInventoryPricing}
            >
              Add to Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}