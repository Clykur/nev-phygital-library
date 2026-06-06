import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Loader2, ShieldCheck } from "lucide-react";

export function MockCheckoutDialog({
  open,
  onOpenChange,
  intentId,
  amount,
  planName,
  onVerify,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intentId: string;
  amount: number;
  planName: string;
  onVerify: (intentId: string, status: "success" | "failure") => Promise<void>;
}) {
  const [loading, setLoading] = useState<"success" | "failure" | null>(null);

  const handleSimulate = async (status: "success" | "failure") => {
    try {
      setLoading(status);
      await onVerify(intentId, status);
    } finally {
      setLoading(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Secure Checkout</DialogTitle>
          <DialogDescription className="text-center">
            You are subscribing to <strong>{planName}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <div className="rounded-xl border border-border p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Amount</span>
            <span className="text-2xl font-bold">₹{(amount / 100).toFixed(2)}</span>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-4">
            This is a simulated Razorpay checkout environment. No real funds will be charged.
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-col gap-2">
          <Button 
            className="w-full" 
            onClick={() => handleSimulate("success")}
            disabled={!!loading}
          >
            {loading === "success" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simulate Successful Payment
          </Button>
          <Button 
            variant="destructive" 
            className="w-full sm:mt-0" 
            onClick={() => handleSimulate("failure")}
            disabled={!!loading}
          >
            {loading === "failure" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simulate Failed Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
