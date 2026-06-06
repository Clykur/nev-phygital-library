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
  bountyRequestStatusLabel,
  bountySubmissionStatusLabel,
  fmtBountyReward,
  type BountyRequestRow,
  type BountySubmissionRow,
} from "@/lib/bounty";
import { PORTAL_PAGE_LEAD, PORTAL_PAGE_TITLE } from "@/lib/portal-typography";
import { PORTAL_PAGE_CONTAINER, STUDENT_CARD_SURFACE } from "@/lib/student-ui";
import { cn } from "@/lib/utils";
import { BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function StudentBountyBooksPage() {
  const { token } = useAuth();
  const inShell = useStudentShell();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [submitTarget, setSubmitTarget] = useState<BountyRequestRow | null>(null);
  const [condition, setCondition] = useState("good");
  const [edition, setEdition] = useState("");
  const [notes, setNotes] = useState("");

  const topPad = inShell ? "" : "pt-24";
  const pageWrap = inShell ? "w-full" : PORTAL_PAGE_CONTAINER;

  const requestsQ = useQuery({
    queryKey: ["bounty", "requests", token],
    enabled: !!token,
    queryFn: () => apiFetch<{ requests: BountyRequestRow[] }>("/api/bounty/requests", { token: token! }),
  });

  const mySubmissionsQ = useQuery({
    queryKey: ["bounty", "my-submissions", token],
    enabled: !!token,
    queryFn: () =>
      apiFetch<{ submissions: BountySubmissionRow[] }>("/api/bounty/my-submissions", { token: token! }),
  });

  const submitMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiFetch(`/api/bounty/requests/${id}/submit`, {
        token: token!,
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bounty"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Submission sent to the hub.");
      setSubmitTarget(null);
      setEdition("");
      setNotes("");
      setCondition("good");
    },
    onError: (err: ApiError) => toast.error(err.message),
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
                    <dd className="font-semibold tabular-nums text-primary">{fmtBountyReward(row.rewardAmount)}</dd>
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

        {mySubmissions.length > 0 ? (
          <section className="mt-10" aria-label="My submissions">
            <h2 className="h4-scale font-semibold text-foreground">My submissions</h2>
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
              {mySubmissions.map((sub) => (
                <li key={sub.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-medium text-foreground">{sub.bountyTitle}</p>
                    <p className="caption-scale text-foreground-muted">
                      {sub.hubName} · {bountySubmissionStatusLabel(sub.status)}
                    </p>
                  </div>
                  {sub.rewardAmount != null ? (
                    <span className="text-sm font-semibold tabular-nums text-primary">
                      {fmtBountyReward(sub.rewardAmount)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

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
              <Input className="rounded-xl" value={edition} onChange={(e) => setEdition(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea className="rounded-xl min-h-[72px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
    </div>
  );
}
