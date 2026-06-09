import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useStudentShell } from "@/components/layout/StudentAppShell";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import {
  BOUNTY_STUDENT_STEPS,
  bountyRequestStatusLabel,
  bountyRewardStatusLabel,
  bountySubmissionStep,
  bountySubmissionStatusLabel,
  fmtBountyReward,
  type BountyRequestRow,
  type BountySubmissionRow,
} from "@/lib/bounty";
import { refreshBountyQueries } from "@/lib/bounty-cache";
import { PORTAL_PAGE_LEAD, PORTAL_PAGE_TITLE } from "@/lib/portal-typography";
import { PORTAL_PAGE_CONTAINER, STUDENT_CARD_SURFACE } from "@/lib/student-ui";
import { cn } from "@/lib/utils";
import { BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { rupeesToCredits, fmtCreditWithRupeeEquivalent } from "@/lib/credits";

export default function StudentBountyBooksPage() {
  const { token } = useAuth();
  const inShell = useStudentShell();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [submitTarget, setSubmitTarget] = useState<BountyRequestRow | null>(null);
  const [condition, setCondition] = useState("good");
  const [edition, setEdition] = useState("");
  const [notes, setNotes] = useState("");
  const [rewardTarget, setRewardTarget] = useState<BountySubmissionRow | null>(null);

  const topPad = inShell ? "" : "pt-24";
  const pageWrap = inShell ? "w-full" : PORTAL_PAGE_CONTAINER;

  const requestsQ = useQuery({
    queryKey: ["bounty", "requests", token],
    enabled: !!token,
    queryFn: () =>
      apiFetch<{ requests: BountyRequestRow[] }>("/api/bounty/requests", { token: token! }),
  });

  const mySubmissionsQ = useQuery({
    queryKey: ["bounty", "my-submissions", token],
    enabled: !!token,
    queryFn: () =>
      apiFetch<{ submissions: BountySubmissionRow[] }>("/api/bounty/my-submissions", {
        token: token!,
      }),
  });

  const submitMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiFetch(`/api/bounty/requests/${id}/submit`, {
        token: token!,
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await refreshBountyQueries(qc);
      toast.success("Submission sent to the hub.");
      setSubmitTarget(null);
      setEdition("");
      setNotes("");
      setCondition("good");
    },
    onError: (err: ApiError) => toast.error(err.message),
  });

  const acceptRewardMutation = useMutation({
    mutationFn: ({ id, method }: { id: string; method: "credits" | "cash" }) =>
      apiFetch(`/api/bounty/submissions/${id}/accept-reward`, {
        token: token!,
        method: "POST",
        body: JSON.stringify({ method }),
      }),
    onSuccess: async (_data, variables) => {
      await refreshBountyQueries(qc);
      toast.success(
        variables.method === "credits"
          ? "Reward accepted. Credits added successfully."
          : "Cash payout request submitted.",
      );
      setRewardTarget(null);
    },
    onError: (err: ApiError) => toast.error(err.message || "Reward could not be accepted."),
  });

  const requests = requestsQ.data?.requests ?? [];
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return requests;
    return requests.filter(
      (r) =>
        r.title.toLowerCase().includes(t) ||
        (r.author?.toLowerCase().includes(t) ?? false) ||
        (r.hubName?.toLowerCase().includes(t) ?? false),
    );
  }, [requests, q]);

  const mySubmissions = mySubmissionsQ.data?.submissions ?? [];
  const rewardAlreadyAccepted = (sub: BountySubmissionRow) =>
    !!sub.rewardAcceptedAt ||
    !!sub.rewardMethod ||
    ["credits_accepted", "cash_requested", "completed", "paid"].includes(sub.rewardStatus ?? "");
  const canAcceptReward = (sub: BountySubmissionRow) =>
    (sub.status === "inventory_confirmed" && sub.rewardStatus === "awaiting_acceptance") ||
    (!rewardAlreadyAccepted(sub) &&
      (sub.rewardStatus === "awaiting_acceptance" ||
        sub.rewardStatus === "delivered" ||
        sub.rewardStatus === "approved" ||
        sub.status === "awaiting_acceptance" ||
        sub.status === "inventory_confirmed"));

  return (
    <div className={cn(PORTAL_PAGE_CONTAINER, "space-y-8 py-8")}>
      <header className="border-b border-border pb-6">
        <h1 className={PORTAL_PAGE_TITLE}>Bounty Books</h1>
        <p className={cn(PORTAL_PAGE_LEAD, "mt-2")}>
          Earn rewards by bringing books your library needs. Browse active acquisition requests and
          submit copies you own.
        </p>
      </header>

      <div className="mb-6">
        <Label htmlFor="bounty-search" className="section-kicker">
          Search bounties
        </Label>
        <Input
          id="bounty-search"
          className="mt-1.5 rounded-xl"
          placeholder="Title, author, hub…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {requestsQ.isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-9 w-9 animate-spin text-foreground-muted" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={cn(STUDENT_CARD_SURFACE, "p-8 text-center text-foreground-muted")}>
          No active bounty requests right now. Check back later.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => (
            <article key={row.id} className={cn(STUDENT_CARD_SURFACE, "flex flex-col p-5")}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold leading-snug text-foreground">{row.title}</h2>
                  {row.author ? (
                    <p className="caption-scale text-foreground-muted">{row.author}</p>
                  ) : null}
                  <p className="mt-1 caption-scale text-foreground-subtle">{row.hubName}</p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="caption-scale text-foreground-muted">Reward</dt>
                  <dd className="font-semibold tabular-nums text-primary">
                    {fmtBountyReward(row.rewardAmount)}
                  </dd>
                </div>
                <div>
                  <dt className="caption-scale text-foreground-muted">Qty needed</dt>
                  <dd className="tabular-nums text-foreground">{row.quantity}</dd>
                </div>
                {row.department ? (
                  <div className="col-span-2">
                    <dt className="caption-scale text-foreground-muted">Department</dt>
                    <dd className="text-foreground">{row.department}</dd>
                  </div>
                ) : null}
                <div className="col-span-2">
                  <dt className="caption-scale text-foreground-muted">Posted</dt>
                  <dd className="text-foreground-muted">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
              <div className="mt-3">
                <Badge variant="outline" status="neutral">
                  {bountyRequestStatusLabel(row.status)}
                </Badge>
              </div>
              <Button className="mt-4 w-full rounded-xl" onClick={() => setSubmitTarget(row)}>
                I have this book
              </Button>
            </article>
          ))}
        </div>
      )}

      <section className="mt-10" aria-label="My Bounty Books">
        <h2 className="h4-scale font-semibold text-foreground">My Bounty Books</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Track delivery, hub approval, inventory intake, and reward payout.
        </p>
        {mySubmissionsQ.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-foreground-muted" />
          </div>
        ) : mySubmissions.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {mySubmissions.map((sub) => (
              <li key={sub.id} className={cn(STUDENT_CARD_SURFACE, "p-5")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{sub.bountyTitle}</p>
                    <p className="caption-scale text-foreground-muted">{sub.hubName}</p>
                  </div>
                  <Badge variant="outline" status={sub.status === "rejected" ? "error" : "neutral"}>
                    {bountySubmissionStatusLabel(sub.status)}
                  </Badge>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="caption-scale text-foreground-muted">Requested reward</dt>
                    <dd className="font-semibold tabular-nums text-primary">
                      {fmtBountyReward(sub.rewardAmount ?? 0)} ·{" "}
                      {fmtCreditWithRupeeEquivalent(rupeesToCredits(sub.rewardAmount ?? 0))}
                    </dd>
                  </div>
                  <div>
                    <dt className="caption-scale text-foreground-muted">Inventory</dt>
                    <dd className="font-medium text-foreground">
                      {sub.status === "inventory_confirmed" ? "Added to Inventory" : "Pending"}
                    </dd>
                  </div>
                  <div>
                    <dt className="caption-scale text-foreground-muted">Reward payout</dt>
                    <dd className="font-medium text-foreground">
                      {bountyRewardStatusLabel(sub.rewardStatus)}
                    </dd>
                    {sub.rewardMethod ? (
                      <p className="caption-scale text-foreground-muted">
                        Selected: {sub.rewardMethod === "credits" ? "Credits" : "Cash offline"}
                      </p>
                    ) : null}
                  </div>
                </dl>

                {sub.status === "rejected" ? (
                  <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    This submission was not accepted by the hub.
                  </p>
                ) : (
                  <ol className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    {BOUNTY_STUDENT_STEPS.map((step, index) => {
                      const reached = index <= bountySubmissionStep(sub.status);
                      return (
                        <li
                          key={step.status}
                          className={cn(
                            "rounded-lg border px-2 py-2 text-center caption-scale font-medium",
                            reached
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-border text-foreground-subtle",
                          )}
                        >
                          {step.label}
                        </li>
                      );
                    })}
                  </ol>
                )}
                <p className="mt-3 caption-scale text-foreground-muted">
                  Updated {new Date(sub.updatedAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className={cn(STUDENT_CARD_SURFACE, "mt-4 p-6 text-center text-foreground-muted")}>
            You have not submitted a bounty book yet.
          </div>
        )}
      </section>

      <Dialog open={!!submitTarget} onOpenChange={(open) => !open && setSubmitTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>I have this book</DialogTitle>
            <DialogDescription>
              Submit your copy of &ldquo;{submitTarget?.title}&rdquo; to {submitTarget?.hubName}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label>Book condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger className="rounded-xl border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Edition (optional)</Label>
              <Input
                className="rounded-xl"
                value={edition}
                onChange={(e) => setEdition(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                className="rounded-xl min-h-[72px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setSubmitTarget(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              disabled={submitMutation.isPending}
              onClick={() => {
                if (!submitTarget) return;
                submitMutation.mutate({
                  id: submitTarget.id,
                  body: {
                    condition,
                    edition: edition || undefined,
                    notes: notes || undefined,
                  },
                });
              }}
            >
              Submit to hub
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!rewardTarget} onOpenChange={(open) => !open && setRewardTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accept Reward</DialogTitle>
            <DialogDescription>
              Choose how you want to receive this bounty reward. This can only be accepted once.
            </DialogDescription>
          </DialogHeader>
          {rewardTarget ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card/60 p-4 text-sm">
                <p className="font-medium text-foreground">{rewardTarget.bountyTitle}</p>
                <p className="mt-1 text-foreground-muted">
                  Reward: {fmtBountyReward(rewardTarget.rewardAmount ?? 0)} ·{" "}
                  {fmtCreditWithRupeeEquivalent(rupeesToCredits(rewardTarget.rewardAmount ?? 0))}
                </p>
              </div>
              <Button
                type="button"
                className="w-full rounded-xl"
                disabled={acceptRewardMutation.isPending}
                onClick={() =>
                  acceptRewardMutation.mutate({ id: rewardTarget.id, method: "credits" })
                }
              >
                Receive Credits
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl"
                disabled={acceptRewardMutation.isPending}
                onClick={() => acceptRewardMutation.mutate({ id: rewardTarget.id, method: "cash" })}
              >
                Receive Cash Offline
              </Button>
              <p className="caption-scale text-foreground-muted">
                Credits are added to your wallet with a bounty reward transaction. Cash requests do
                not change wallet balance.
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
