import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { Star, ThumbsUp, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FeedbackFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  bookTitle: string;
  token: string;
  /** Pre-fill values for edit mode */
  existingFeedbackId?: string | null;
  existingRating?: number | null;
  existingComment?: string | null;
  existingWouldRecommend?: boolean | null;
  onSuccess?: () => void;
}

export function FeedbackFormDialog({
  open,
  onOpenChange,
  bookId,
  bookTitle,
  token,
  existingFeedbackId,
  existingRating,
  existingComment,
  existingWouldRecommend,
  onSuccess,
}: FeedbackFormDialogProps) {
  const isEditing = !!existingFeedbackId;

  const [rating, setRating] = useState<number>(existingRating ?? 5);
  const [comment, setComment] = useState(existingComment ?? "");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(
    existingWouldRecommend ?? null,
  );
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Please write a comment before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{ ok: boolean; feedback: any; updated?: boolean }>(
        "/api/feedback",
        {
          method: "POST",
          token,
          body: JSON.stringify({
            bookId,
            rating,
            comment: comment.trim(),
            wouldRecommend,
          }),
        },
      );

      if (res.ok) {
        toast.success(
          res.updated ? "Your review has been updated!" : "Review submitted — thank you!",
          { description: `"${bookTitle}"`, duration: 4000 },
        );
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (err: any) {
      if (err?.message?.includes("NOT_ELIGIBLE") || err?.status === 403) {
        toast.error("You need to borrow and return this book before leaving a review.");
      } else {
        toast.error(err.message || "Failed to submit review. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background border border-border rounded-2xl p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground leading-tight">
              {isEditing ? "Edit Your Review" : "Write a Review"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{bookTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Overall Rating
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                >
                  <Star
                    className={cn(
                      "w-7 h-7 transition-all duration-150",
                      star <= (hoverRating ?? rating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-muted-foreground/30",
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {["", "Poor", "Fair", "Good", "Great", "Excellent"][(hoverRating ?? rating) || 0]}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Your Review
            </label>
            <textarea
              required
              rows={4}
              placeholder="What did you think of this book? Share your honest experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-surface border border-border focus:border-primary rounded-xl p-3 text-sm text-foreground outline-none resize-none transition placeholder:text-muted-foreground/50"
            />
            <p className="text-[10px] text-muted-foreground text-right">{comment.length} chars</p>
          </div>

          {/* Would Recommend */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Would you recommend this book?
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWouldRecommend(wouldRecommend === true ? null : true)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition",
                  wouldRecommend === true
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "border-border text-muted-foreground hover:border-emerald-500/30 hover:text-emerald-400",
                )}
              >
                <ThumbsUp className="w-4 h-4" />
                Yes
              </button>
              <button
                type="button"
                onClick={() => setWouldRecommend(wouldRecommend === false ? null : false)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition",
                  wouldRecommend === false
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                    : "border-border text-muted-foreground hover:border-rose-500/30 hover:text-rose-400",
                )}
              >
                <ThumbsUp className="w-4 h-4 rotate-180" />
                No
              </button>
              {wouldRecommend !== null && (
                <button
                  type="button"
                  onClick={() => setWouldRecommend(null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition"
                >
                  Skip
                </button>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:bg-surface/60 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="flex-1 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Update Review" : "Submit Review"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
