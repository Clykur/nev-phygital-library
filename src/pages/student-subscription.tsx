import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PORTAL_PAGE_CONTAINER } from "@/lib/student-ui";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { MockCheckoutDialog } from "@/components/MockCheckoutDialog";
import { cn } from "@/lib/utils";
import { INITIAL_FREE_CREDITS, fmtCreditWithRupeeEquivalent } from "@/lib/credits";

type Plan = {
  id: string;
  name: string;
  tier: string;
  price: number;
  creditReward: number;
};

type ActiveSub = {
  id: string;
  status: string;
  plan: string;
  planName: string;
  currentPeriodEnd: string;
};

type HistoryEntry = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
};

export default function StudentSubscriptionPage() {
  const qc = useQueryClient();
  const [checkoutState, setCheckoutState] = useState<{
    open: boolean;
    intentId: string;
    amount: number;
    planName: string;
  }>({ open: false, intentId: "", amount: 0, planName: "" });

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ["subscriptions", "plans", "student"],
    queryFn: async () => {
      const res = await apiFetch<{ plans: Plan[] }>("/api/subscriptions/plans?target=student");
      return res.plans;
    },
  });

  const { data: activeData, isLoading: activeLoading } = useQuery({
    queryKey: ["subscriptions", "active"],
    queryFn: async () => {
      const res = await apiFetch<{ active: ActiveSub | null }>("/api/subscriptions/active");
      return res.active;
    },
  });

  const { data: historyData } = useQuery({
    queryKey: ["subscriptions", "history"],
    queryFn: async () => {
      const res = await apiFetch<{ history: HistoryEntry[] }>("/api/subscriptions/history");
      return res.history;
    },
  });

  const createIntent = useMutation({
    mutationFn: async (planId: string) => {
      return await apiFetch<{ intentId: string; amount: number }>(
        "/api/subscriptions/create-intent",
        {
          method: "POST",
          body: JSON.stringify({ planId }),
        },
      );
    },
    onSuccess: (data, planId) => {
      const plan = plansData?.find((p) => p.id === planId);
      if (plan) {
        setCheckoutState({
          open: true,
          intentId: data.intentId,
          amount: data.amount,
          planName: plan.name,
        });
      }
    },
    onError: () => toast.error("Failed to initiate checkout"),
  });

  const handleVerify = async (intentId: string, status: "success" | "failure") => {
    try {
      const res = await apiFetch<{ verified: boolean }>("/api/subscriptions/verify", {
        method: "POST",
        body: JSON.stringify({ intentId, status }),
      });
      if (res.verified) {
        toast.success("Subscription updated successfully!");
        qc.invalidateQueries({ queryKey: ["subscriptions"] });
        qc.invalidateQueries({ queryKey: ["wallet"] });
        qc.invalidateQueries({ queryKey: ["student-dashboard"] });
      } else {
        toast.error("Payment failed");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to verify payment");
    }
  };

  if (plansLoading || activeLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activePlan = activeData?.plan;
  const isPremium = activePlan === "pro";

  return (
    <div className={cn("mx-auto max-w-5xl py-8", PORTAL_PAGE_CONTAINER)}>
      <div className="mb-8 rounded-xl border border-primary/20 bg-primary/5 p-8 border border-primary/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Your Subscription</h1>
            <p className="text-muted-foreground text-lg">
              {isPremium ? (
                <span className="flex items-center text-primary font-medium">
                  <CheckCircle2 className="w-5 h-5 mr-2" /> You are on the {activeData.planName}{" "}
                  plan.
                </span>
              ) : (
                "Free members can borrow with wallet credits. Upgrade for credit-free borrowing."
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {plansData?.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-xl border p-8 shadow-sm transition-all hover:shadow-md",
              activePlan === plan.tier ? "border-primary ring-1 ring-primary" : "border-border",
            )}
          >
            {activePlan === plan.tier && (
              <div className="absolute -top-3 right-6 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                CURRENT PLAN
              </div>
            )}
            <div className="mb-5">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">₹{plan.price}</span>
                <span className="text-muted-foreground">/year</span>
              </div>
            </div>

            <ul className="flex-1 space-y-3 mb-8 text-sm text-muted-foreground">
              {plan.tier === "free" ? (
                <>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-primary" /> Basic access to hub
                    resources
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-primary" /> Initial{" "}
                    {fmtCreditWithRupeeEquivalent(INITIAL_FREE_CREDITS)} wallet balance
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-primary" /> Borrow and buy with
                    credits
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-primary" /> Standard support
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-primary" /> Unlimited borrowing
                    across all hubs — no credits required
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-primary" /> Free initial peer-to-peer
                    delivery
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-primary" /> Priority requests and
                    reservations
                  </li>
                  {plan.creditReward > 0 && (
                    <li className="flex items-center">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-primary" /> Includes{" "}
                      {fmtCreditWithRupeeEquivalent(plan.creditReward)} wallet credit
                    </li>
                  )}
                </>
              )}
            </ul>

            <Button
              size="lg"
              variant={activePlan === plan.tier ? "outline" : "default"}
              disabled={activePlan === plan.tier || createIntent.isPending}
              onClick={() => createIntent.mutate(plan.id)}
              className="w-full"
            >
              {createIntent.isPending && createIntent.variables === plan.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {activePlan === plan.tier ? "Current Plan" : `Upgrade to ${plan.name}`}
            </Button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Billing History</h2>
        </div>
        <div className="p-0">
          {historyData && historyData.length > 0 ? (
            <div className="divide-y divide-border">
              {historyData.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-6">
                  <div>
                    <p className="font-medium">Subscription Update</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(h.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{(h.amount / 100).toFixed(2)}</p>
                    <span
                      className={cn(
                        "inline-flex mt-1 items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        h.status === "succeeded"
                          ? "bg-success-surface text-success-foreground"
                          : h.status === "failed"
                            ? "bg-error-surface text-error-foreground"
                            : "bg-warning-surface text-warning-foreground",
                      )}
                    >
                      {h.status.charAt(0).toUpperCase() + h.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <ShieldAlert className="h-8 w-8 mb-3 opacity-20" />
              <p>No billing history available yet.</p>
            </div>
          )}
        </div>
      </div>

      <MockCheckoutDialog
        open={checkoutState.open}
        onOpenChange={(o) => setCheckoutState((prev) => ({ ...prev, open: o }))}
        intentId={checkoutState.intentId}
        amount={checkoutState.amount}
        planName={checkoutState.planName}
        onVerify={handleVerify}
      />
    </div>
  );
}
