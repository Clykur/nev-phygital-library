import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ShieldAlert, Building2 } from "lucide-react";
import { MockCheckoutDialog } from "@/components/MockCheckoutDialog";
import { cn } from "@/lib/utils";
import { PORTAL_PAGE_GUTTER_X } from "@/lib/student-ui";

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
      const res = await apiFetch("/api/subscriptions/plans?target=hub");
      return res.plans as Plan[];
    },
  });

  const { data: activeData, isLoading: activeLoading } = useQuery({
    queryKey: ["subscriptions", "hub-active", hubId],
    queryFn: async () => {
      const res = await apiFetch(`/api/subscriptions/hub-active?hubId=${hubId}`);
      return res.active as ActiveSub | null;
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
      const res = await apiFetch("/api/subscriptions/verify", {
        method: "POST",
        body: JSON.stringify({ intentId, status }),
      });
      if (res.verified) {
        toast.success("Hub Plan updated successfully!");
        qc.invalidateQueries({ queryKey: ["subscriptions"] });
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
  const isPro = activePlan === "hub_pro";

  return (
    
      <div className={cn("py-8 max-w-5xl mx-auto", PORTAL_PAGE_GUTTER_X)}>
        <div className="mb-8 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 border text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <Building2 className="w-5 h-5" />
                <span className="font-medium tracking-wide uppercase text-sm">Hub Subscription</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Manage Hub Plan</h1>
              <p className="text-slate-300 text-lg">
                {isPro ? (
                  <span className="flex items-center text-emerald-400 font-medium">
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Your Hub is on the {activeData.planName} plan.
                  </span>
                ) : (
                  "Upgrade to Hub Pro to unlock advanced reporting and unlimited capacity."
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
                "relative flex flex-col rounded-2xl border p-8 shadow-sm transition-all hover:shadow-md bg-card",
                activePlan === plan.tier ? "border-primary ring-1 ring-primary" : "border-border"
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
                {plan.tier === "hub_basic" ? (
                  <>
                    <li className="flex items-center"><CheckCircle2 className="mr-2 h-4 w-4 text-slate-400" /> Basic Hub Listing</li>
                    <li className="flex items-center"><CheckCircle2 className="mr-2 h-4 w-4 text-slate-400" /> Standard Inventory Management</li>
                    <li className="flex items-center"><CheckCircle2 className="mr-2 h-4 w-4 text-slate-400" /> Accept up to 100 physical books</li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center"><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Priority Hub Discovery</li>
                    <li className="flex items-center"><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Unlimited Book Inventory</li>
                    <li className="flex items-center"><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Advanced Analytics & Reports</li>
                    <li className="flex items-center"><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Hub Premium Badge</li>
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
