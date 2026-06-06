import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { userFacingErrorMessage } from "@/lib/error-messages";
import { STUDENT_CARD_CHROME } from "@/lib/student-ui";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Wallet } from "lucide-react";
import { useWallet } from "@/context/wallet-context";
import { useAuth } from "@/context/auth-context";
import { isPremiumOk } from "@/lib/rbac";

export type CheckoutFlowItem =
  | {
    kind: "hub";
    bookId: string;
    title: string;
    hubName: string;
    buyPrice: number;
    borrowPrice: number;
  }
  | {
    kind: "p2p";
    listingId: string;
    title: string;
    hubName: string | null;
    buyPrice: number;
    borrowPrice: number;
  };

type Step = "details" | "payment" | "success";

function fmtCredits(n: number) {
  return `${n.toLocaleString("en-IN")} Credits`;
}

export function CheckoutFlowDialog({
  open,
  onOpenChange,
  item,
  initialMode = "borrow",
  token,
  onComplete,
  deskAcquireHubs,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CheckoutFlowItem | null;
  initialMode?: "borrow" | "buy";
  token: string;
  onComplete: () => void;
  /** Hub desk: buying adds the on-shelf copy to this hub’s inventory (cross-hub / peer). */
  deskAcquireHubs?: readonly { id: string; name: string }[] | null;
}) {
  const [step, setStep] = useState<Step>("details");
  const [mode, setMode] = useState<"borrow" | "buy">(initialMode);
  const [payError, setPayError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [acquireHubId, setAcquireHubId] = useState("");
  const { balance, spendCredits } = useWallet();
  const { user } = useAuth();
  const isPremium = user ? isPremiumOk(user) : false;

  useEffect(() => {
    if (!open || !item) return;
    setStep("details");
    setMode(initialMode);
    setCardName("");
    setPayError(null);
  }, [open, item, initialMode]);

  useEffect(() => {
    if (!open || !deskAcquireHubs?.length) {
      setAcquireHubId("");
      return;
    }
    setAcquireHubId(deskAcquireHubs[0]!.id);
  }, [open, deskAcquireHubs]);

  if (!item) return null;

  if (!item) return null;

  const actualBorrowPrice = isPremium ? 0 : item.borrowPrice;
  const amount = mode === "borrow" ? actualBorrowPrice : item.buyPrice;
  const hubLine = item.kind === "hub" ? item.hubName : item.hubName ?? "Campus hub (TBD)";
  const pickupRef =
    item.kind === "hub" ? `REF-${item.bookId.slice(0, 8).toUpperCase()}` : `REF-${item.listingId.slice(0, 8).toUpperCase()}`;

  const shelfAcquireBody =
    mode === "buy" && deskAcquireHubs?.length
      ? {
        acquireForHubId:
          deskAcquireHubs.length === 1 ? deskAcquireHubs[0]!.id : acquireHubId,
      }
      : null;

  const runPayment = async () => {
    setPending(true);
    setPayError(null);
    try {
      if (item.kind === "hub") {
        if (mode === "borrow") {
          await apiFetch(`/api/books/${item.bookId}/checkout`, { method: "POST", token });
        } else {
          await apiFetch(`/api/books/${item.bookId}/purchase`, {
            method: "POST",
            token,
            ...(shelfAcquireBody ? { body: JSON.stringify(shelfAcquireBody) } : {}),
          });
        }
      } else {
        if (mode === "borrow") {
          await apiFetch(`/api/p2p/listings/${item.listingId}/borrow`, { method: "POST", token });
        } else {
          await apiFetch(`/api/p2p/listings/${item.listingId}/buy`, {
            method: "POST",
            token,
            ...(shelfAcquireBody ? { body: JSON.stringify(shelfAcquireBody) } : {}),
          });
        }
      }
      const success = await spendCredits(amount, `Purchased: ${item.title}`);
      if (!success) {
        throw new Error("Payment failed due to insufficient credits.");
      }
      setStep("success");
      onComplete();
    } catch (e: any) {
      setPayError(e.message || userFacingErrorMessage(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden p-0 w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] sm:max-w-md sm:rounded-xl",
          STUDENT_CARD_CHROME,
        )}
      >
        <div className="border-b border-border px-6 pb-4 pt-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="font-serif text-xl font-light tracking-tight">
              {step === "success"
                ? "You’re all set"
                : mode === "borrow"
                  ? "Borrow copy"
                  : "Buy copy"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {step === "success"
                ? "Your campus desk will confirm pickup per local process."
                : "Review details, then confirm mock payment (no real card charge)."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          {step === "details" && (
            <>
              <div className="rounded-xl border border-border bg-card/60 p-4 text-sm">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-muted-foreground">
                  <span className="text-foreground/90">{hubLine}</span>
                  {item.kind === "p2p" ? " · Peer listing" : " · Hub catalog"}
                </p>
                <div className="mt-4 grid gap-2 border-t border-border pt-3">
                  <button
                    type="button"
                    onClick={() => setMode("borrow")}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border border-border px-3 py-2.5 text-left text-sm transition-colors",
                      mode === "borrow"
                        ? "border-primary bg-primary/30"
                        : "border-border hover:shadow-sm",
                    )}
                  >
                    <span className="font-medium">Borrow</span>
                    <span className="tabular-nums text-primary">
                      {isPremium ? "Free (Premium)" : fmtCredits(item.borrowPrice)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("buy")}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border border-border px-3 py-2.5 text-left text-sm transition-colors",
                      mode === "buy"
                        ? "border-primary bg-primary/30"
                        : "border-border hover:shadow-sm",
                    )}
                  >
                    <span className="font-medium">Buy</span>
                    <span className="tabular-nums text-primary">
                      {fmtCredits(item.buyPrice)}
                    </span>
                  </button>
                </div>
              </div>
              {deskAcquireHubs &&
                deskAcquireHubs.length > 0 &&
                mode === "buy" &&
                (deskAcquireHubs.length > 1 ? (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Add purchased copy to shelf inventory at
                    </Label>
                    <Select value={acquireHubId} onValueChange={setAcquireHubId}>
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue placeholder="Choose hub" />
                      </SelectTrigger>
                      <SelectContent>
                        {deskAcquireHubs.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="caption-scale leading-relaxed text-muted-foreground">
                      Hub desk buy moves the on-shelf copy into this hub’s inventory as hub-owned stock
                      (other hubs and peer consignment).
                    </p>
                  </div>
                ) : (
                  <p className="rounded-xl border border-border px-3 py-2 caption-scale leading-relaxed text-muted-foreground">
                    Buying adds this copy to <span className="font-medium text-foreground">{deskAcquireHubs[0]!.name}</span>{" "}
                    shelf inventory as hub-owned stock.
                  </p>
                ))}
              <Button
                className="h-11 w-full rounded-xl bg-primary/90 text-accent-foreground hover:bg-primary-400"
                onClick={() => setStep("payment")}
              >
                Continue to payment
              </Button>
            </>
          )}

          {step === "payment" && (
            <>
              <div className="rounded-xl border border-border bg-card/60 p-4 text-sm">
                <p className="text-muted-foreground">Amount due</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {amount.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">Credits</span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {mode === "borrow"
                    ? isPremium
                      ? "Premium Benefit Applied. Borrow Cost: Free. Return the copy on time."
                      : "Borrow fee for this loan period. Return the copy on time."
                    : deskAcquireHubs?.length
                      ? "Desk shelf acquisition — copy becomes hub-owned stock at the hub you selected."
                      : "Full purchase, you keep this copy (hub or peer rules apply at pickup)."}
                </p>
              </div>
              <div className="space-y-2 mt-4 p-4 border border-primary/20 bg-primary/5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">Wallet Balance</p>
                  <p className="text-xl font-bold">{balance.toLocaleString()} <span className="text-xs font-normal">Credits</span></p>
                </div>
                <Wallet className="h-8 w-8 text-primary/50" />
              </div>
              {payError && <p className="text-sm text-destructive mt-4">{payError}</p>}
              <div className="flex flex-row gap-2 sm:flex-row mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl"
                  disabled={pending}
                  onClick={() => setStep("details")}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-primary/90 text-primary-foreground hover:bg-primary/80"
                  disabled={pending || balance < amount || !!(shelfAcquireBody && deskAcquireHubs && deskAcquireHubs.length > 1 && !acquireHubId)}
                  onClick={() => void runPayment()}
                >
                  {pending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing…
                    </>
                  ) : balance < amount ? (
                    "Insufficient Credits"
                  ) : (
                    `Pay ${amount.toLocaleString()} Credits`
                  )}
                </Button>
              </div>
            </>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <CheckCircle2 className="h-14 w-14 text-secondary" aria-hidden />
              <div className="w-full rounded-xl border border-border  p-3 text-left">
                <p className="text-sm font-medium text-foreground">Pick up at {hubLine}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Bring your student ID, mention this reference at the desk, and collect within desk hours.
                  {mode === "borrow"
                    ? " Returns are processed at the same hub desk."
                    : " Staff will confirm handover before completion."}
                </p>
                <p className="mt-2 text-xs text-accent">
                  Pickup ref: {pickupRef}
                </p>
                <p className="mt-1 caption-scale text-muted-foreground">QR support can be added on top of this ref in the next phase.</p>
              </div>
              <Button
                className="w-full rounded-xl"
                onClick={() => {
                  onOpenChange(false);
                  setStep("details");
                }}
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
function setCardName(arg0: string) {
  throw new Error("Function not implemented.");
}

