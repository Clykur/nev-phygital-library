import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useAuth } from "./auth-context";
import { INITIAL_FREE_CREDITS } from "@/lib/credits";

export type Transaction = {
  id: string;
  type:
    | "credit"
    | "debit"
    | "transfer"
    | "bounty_reward_credit"
    | "bounty_reward_cash_request"
    | string;
  amount: number;
  creditsAdded?: number;
  creditsDeducted?: number;
  rupeeValue?: number;
  rewardAmount?: number;
  status?: string;
  description: string;
  createdAt: string;
};

export type SubscriptionPlan = "free" | "pro";

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  subscription: SubscriptionPlan;
  loading: boolean;
  subscribe: (plan: SubscriptionPlan) => Promise<void>;
  spendCredits: (amount: number, description: string) => Promise<boolean>;
  refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionPlan>("free");
  const [loading, setLoading] = useState(true);

  const refreshWallet = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [balanceRes, txRes, subRes] = await Promise.all([
        apiFetch<{ balance?: number }>("/api/wallet/balance", { token }),
        apiFetch<{ transactions?: Transaction[] }>("/api/wallet/transactions", { token }),
        apiFetch<{ active?: { plan: string } }>("/api/subscriptions/active", { token }),
      ]);
      if (balanceRes.balance !== undefined) setBalance(balanceRes.balance);
      else setBalance(INITIAL_FREE_CREDITS);
      if (txRes.transactions) setTransactions(txRes.transactions);
      if (subRes.active?.plan) setSubscription(subRes.active.plan as SubscriptionPlan);
    } catch (err) {
      console.error("Failed to load wallet data", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      refreshWallet();
    } else {
      setBalance(0);
      setTransactions([]);
      setSubscription("free");
      setLoading(false);
    }
  }, [user, token, refreshWallet]);

  const spendCredits = async (amount: number, description: string) => {
    if (!token) return false;
    try {
      await apiFetch("/api/wallet/debit", {
        method: "POST",
        token,
        body: JSON.stringify({ amount, description }),
      });
      await refreshWallet();
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to debit wallet");
      return false;
    }
  };

  const subscribe = async (plan: SubscriptionPlan) => {
    if (!token) return;
    try {
      await apiFetch("/api/subscriptions/subscribe", {
        method: "POST",
        token,
        body: JSON.stringify({ tier: plan }),
      });
      toast.success("Your subscription request has been submitted and is awaiting admin approval.");
      await refreshWallet();
    } catch (err: any) {
      toast.error(err.message || "Failed to subscribe");
    }
  };

  return (
    <WalletContext.Provider
      value={{
        balance,
        transactions,
        subscription,
        loading,
        subscribe,
        spendCredits,
        refreshWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
