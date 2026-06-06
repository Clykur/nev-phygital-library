import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Building2 } from "lucide-react";
import { MockCheckoutDialog } from "@/components/MockCheckoutDialog";
import { cn } from "@/lib/utils";
import { PORTAL_PAGE_CONTAINER } from "@/lib/student-ui";
import {
  PORTAL_PAGE_LEAD,
  PORTAL_PAGE_TITLE,
  PORTAL_SECTION_LABEL,
  PORTAL_STAT_VALUE,
} from "@/lib/portal-typography";

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

export default function HubBillingPage({ hubId }: { hubId: string }) {
  const qc = useQueryClient();
  const [checkoutState, setCheckoutState] = useState<{
    open: boolean;
    intentId: string;
    amount: number;
    planName: string;
  }>({ open: false, intentId: "", amount: 0, planName: "" });

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ["subscriptions", "plans", "hub"],
    queryFn: async () => {
      const res = await apiFetch<{ plans: Plan[] }>("/api/subscriptions/plans?target=hub");
      return res.plans;
    },
  });

  const { data: activeData, isLoading: activeLoading } = useQuery({
    queryKey: ["subscriptions", "hub-active", hubId],
    queryFn: async () => {
      const res = await apiFetch<{ active: ActiveSub | null }>(`/api/subscriptions/hub-active?hubId=${hubId}`);
      return res.active;
    },
  });

  const createIntent = useMutation({
    mutationFn: async (planId: string) => {
      return await apiFetch("/api/subscriptions/create-intent", {
        method: "POST",
        body: JSON.stringify({ planId, hubId }),
      });
    },
    onSuccess: (data, planId) => {
      const plan = plansData?.find((p) => p.id === planId);
      if (plan) {
        setCheckoutState({
          open: true,
          intentId: (data as any).intentId,
          amount: (data as any).amount,
          planName: plan.name,
        });
      }
    },
    onError: () => toast.error("Failed to initiate checkout"),
  });

  const handleVerify = async (intentId: string, status: "success" | "failure") => {
    try {
      const res = await apiFetch("/api/subscriptions/verify", {
        method: "POST",
        body: JSON.stringify({ intentId, status }),
      });
      if ((res as any).verified) {
        toast.success("Hub plan updated successfully!");
        qc.invalidateQueries({ queryKey: ["subscriptions"] });
      } else {
        toast.error("Payment failed");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to verify payment";
      toast.error(msg);
    }
  };

  if (plansLoading || activeLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
      </div>
    );
  }

  const activePlan = activeData?.plan;
  const isPro = activePlan === "hub_pro";

  return (
    <div className={cn(PORTAL_PAGE_CONTAINER, "space-y-8 py-8")}>
      <Card variant="elevated" className="overflow-hidden border-primary/20">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" aria-hidden />
                <span className={PORTAL_SECTION_LABEL}>Hub subscription</span>
              </div>
              <h1 className={PORTAL_PAGE_TITLE}>Manage hub plan</h1>
              <p className={cn(PORTAL_PAGE_LEAD, "mt-2 max-w-xl")}>
                {isPro ? (
                  <span className="inline-flex items-center gap-2 font-medium text-success">
                    <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
                    Your hub is on the {activeData?.planName} plan.
                  </span>
                ) : (
                  "Upgrade to Hub Pro to unlock advanced reporting and unlimited capacity."
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {plansData?.map((plan) => (
          <Card
            key={plan.id}
            variant={activePlan === plan.tier ? "bento" : "default"}
            className={cn(
              "relative flex flex-col",
              activePlan === plan.tier && "border-primary ring-1 ring-primary",
            )}
          >
            {activePlan === plan.tier ? (
              <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 caption-scale font-bold uppercase tracking-kicker text-primary-foreground">
                Current plan
              </span>
            ) : null}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className={PORTAL_STAT_VALUE}>
                ₹{plan.price}
                <span className="ml-1 body-scale font-normal text-foreground-muted">/year</span>
              </p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="mb-6 flex-1 space-y-3 body-scale text-foreground-muted">
                {plan.tier === "hub_basic" ? (
                  <>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-foreground-muted" aria-hidden />
                      Basic hub listing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-foreground-muted" aria-hidden />
                      Standard inventory management
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-foreground-muted" aria-hidden />
                      Accept up to 100 physical books
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                      Priority hub discovery
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                      Unlimited book inventory
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                      Advanced analytics and reports
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                      Hub premium badge
                    </li>
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                {activePlan === plan.tier ? "Current plan" : `Upgrade to ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
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
