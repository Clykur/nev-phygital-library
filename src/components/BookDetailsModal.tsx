import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { BookCoverImage } from "./ui/book-cover-image";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import {
  Star,
  Loader2,
  Calendar,
  BookOpen,
  Hash,
  Tag,
  Building,
  Info,
  ThumbsUp,
  Lock,
  CheckCircle2,
  Pencil,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BookDetailsModalProps {
  bookId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BookDetails {
  id: string;
  title: string;
  author: string;
  coverImageUrl: string | null;
  status: string;
  category: string | null;
  publisher: string | null;
  publicationDate: string | null;
  description: string | null;
  isbn: string | null;
  hubName: string;
  edition?: string | null;
  language?: string | null;
  numberOfPages?: number | null;
  condition?: string | null;
  shelfNumber?: string | null;
  numberOfCopies?: number | null;
  tags?: string | null;
  availableCopiesCount?: number;
}

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string;
  wouldRecommend?: boolean | null;
  createdAt: string;
  userName: string;
}

interface BorrowHistoryEntry {
  bookId: string;
  feedbackId: string | null;
  feedbackSubmitted: boolean;
  feedbackRating: number | null;
  feedbackComment: string | null;
  feedbackWouldRecommend: boolean | null;
}

export function BookDetailsModal({ bookId, open, onOpenChange }: BookDetailsModalProps) {
  const { token, user } = useAuth();
  const [book, setBook] = useState<BookDetails | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Borrow eligibility state
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [canLeaveFeedback, setCanLeaveFeedback] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<BorrowHistoryEntry | null>(null);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);

  // Feedback form state
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const reloadFeedbacks = useCallback(async () => {
    if (!bookId) return;
    try {
      const feedbackRes = await apiFetch<{ feedback: FeedbackItem[] }>(`/api/feedback/${bookId}`);
      setFeedbacks(feedbackRes.feedback || []);
    } catch {
      // non-fatal
    }
  }, [bookId]);

  useEffect(() => {
    if (!open || !bookId) {
      setBook(null);
      setFeedbacks([]);
      setSessionExpired(false);
      setCanLeaveFeedback(false);
      setExistingFeedback(null);
      setIsEditingFeedback(false);
      setRating(5);
      setComment("");
      setWouldRecommend(null);
      return;
    }

    async function loadBookData() {
      setLoading(true);
      setSessionExpired(false);
      try {
        // Book details — requires auth token
        const detailsRes = await apiFetch<{ book: BookDetails }>(`/api/books/${bookId}`, {
          token: token ?? undefined,
        });
        setBook(detailsRes.book);

        // Load public feedback
        await reloadFeedbacks();

        // Load borrow eligibility if logged in
        if (token && user) {
          setEligibilityLoading(true);
          try {
            const historyRes = await apiFetch<{ history: BorrowHistoryEntry[] }>(
              "/api/student/borrow-history",
              { token },
            );
            const entry = historyRes.history.find((h) => h.bookId === bookId) ?? null;
            setCanLeaveFeedback(!!entry);
            setExistingFeedback(entry);

            // Pre-fill form if editing existing feedback
            if (entry?.feedbackSubmitted) {
              setRating(entry.feedbackRating ?? 5);
              setComment(entry.feedbackComment ?? "");
              setWouldRecommend(entry.feedbackWouldRecommend ?? null);
            }
          } catch {
            setCanLeaveFeedback(false);
          } finally {
            setEligibilityLoading(false);
          }
        }
      } catch (err: any) {
        if (
          err?.status === 401 ||
          err?.message?.includes("401") ||
          err?.message?.toLowerCase().includes("unauthorized")
        ) {
          setSessionExpired(true);
          setLoading(false);
          return;
        }
        toast.error(err.message || "Failed to load book details");
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    }

    loadBookData();
  }, [bookId, open, token, user, reloadFeedbacks, onOpenChange]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please login to submit feedback");
      return;
    }
    if (!comment.trim()) {
      toast.error("Feedback comment cannot be empty");
      return;
    }

    setSubmittingFeedback(true);
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
            wouldRecommend: wouldRecommend,
          }),
        },
      );

      if (res.ok) {
        toast.success(
          res.updated ? "Review updated successfully!" : "Review submitted successfully!",
        );
        setIsEditingFeedback(false);
        await reloadFeedbacks();
        // Refresh eligibility to update existing feedback state
        if (token) {
          const historyRes = await apiFetch<{ history: BorrowHistoryEntry[] }>(
            "/api/student/borrow-history",
            { token },
          );
          const entry = historyRes.history.find((h) => h.bookId === bookId) ?? null;
          setExistingFeedback(entry);
        }
      }
    } catch (err: any) {
      if (err?.message?.includes("NOT_ELIGIBLE") || err?.status === 403) {
        toast.error("You need to borrow and return this book before leaving a review.");
      } else {
        toast.error(err.message || "Failed to submit feedback");
      }
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleEditFeedback = () => {
    if (existingFeedback) {
      setRating(existingFeedback.feedbackRating ?? 5);
      setComment(existingFeedback.feedbackComment ?? "");
      setWouldRecommend(existingFeedback.feedbackWouldRecommend ?? null);
      setIsEditingFeedback(true);
    }
  };

  const averageRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((sum, item) => sum + item.rating, 0) / feedbacks.length).toFixed(1)
      : null;

  const recommendCount = feedbacks.filter((f) => f.wouldRecommend === true).length;

  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === "available") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    if (s === "checked_out" || s === "issued")
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    if (s === "reserved") return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
  };

  const formatStatus = (status: string) => {
    const s = status.toLowerCase();
    if (s === "available") return "Available";
    if (s === "checked_out" || s === "issued") return "Issued";
    if (s === "reserved") return "Reserved";
    return "Out of Stock";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-background border border-border text-foreground shadow-2xl p-6 sm:p-8 rounded-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{book ? book.title : "Book Details"}</DialogTitle>
          <DialogDescription>Detailed view of the selected catalog book</DialogDescription>
        </DialogHeader>

        {/* Session expired state */}
        {sessionExpired ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Lock className="w-7 h-7 text-amber-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Session Expired</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Your session has expired. Please sign in again to continue.
              </p>
            </div>
            <button
              onClick={() => {
                onOpenChange(false);
                window.location.href = "/?segment=students&auth=login#auth-section";
              }}
              className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition"
            >
              Sign In Again
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading details and reviews...</p>
          </div>
        ) : book ? (
          <div className="space-y-8">
            {/* Top Section: Cover & Details */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Cover Column */}
              <div className="md:col-span-4 flex flex-col items-center">
                <div className="w-48 sm:w-full max-w-[220px] aspect-[2/3] rounded-xl overflow-hidden border border-border bg-muted shadow-lg relative group">
                  <BookCoverImage src={book.coverImageUrl} alt={book.title} />
                  <div className="absolute top-3 right-3 z-10"></div>
                </div>

                {/* Average Rating Badge */}
                {averageRating && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 w-full max-w-[220px] justify-center">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-bold text-amber-400">{averageRating}</span>
                    <span className="text-xs text-muted-foreground">
                      ({feedbacks.length} {feedbacks.length === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                )}
              </div>

              {/* Details Column */}
              <div className="md:col-span-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4 text-left">
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                      {book.title}
                    </h2>
                    <p className="text-lg text-primary font-medium">by {book.author}</p>
                    {book.availableCopiesCount !== undefined && (
                      <div className="mt-2 flex items-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                            book.availableCopiesCount > 0
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20",
                          )}
                        >
                          {book.availableCopiesCount}{" "}
                          {book.availableCopiesCount === 1 ? "Copy" : "Copies"} Available
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-4 bg-surface/50 border border-border p-4 rounded-xl text-xs sm:text-sm">
                    <div className="flex items-center space-x-2 text-left">
                      <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          Category
                        </p>
                        <p className="font-semibold text-foreground truncate">
                          {book.category || "General / Technical"}
                        </p>
                      </div>
                    </div>
                    {book.isbn && (
                      <div className="flex items-center space-x-2 text-left">
                        <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            ISBN
                          </p>
                          <p className="font-semibold text-foreground truncate">{book.isbn}</p>
                        </div>
                      </div>
                    )}
                    {book.edition && (
                      <div className="flex items-center space-x-2 text-left">
                        <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            Edition
                          </p>
                          <p className="font-semibold text-foreground truncate">{book.edition}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5 text-left">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      Summary &amp; Description
                    </h4>
                    <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl bg-surface/30 p-3 rounded-lg border border-border/50">
                      {book.description || "No description available for this textbook."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Bottom Section: Ratings & Feedback Feed */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
              {/* Ratings Summary & Form */}
              <div className="md:col-span-5 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Rating &amp; Reviews</h3>
                  {averageRating ? (
                    <div className="flex items-center space-x-3 mt-2">
                      <div className="text-4xl font-extrabold text-foreground">{averageRating}</div>
                      <div>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "w-4 h-4 shrink-0",
                                star <= Math.round(Number(averageRating))
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-muted border-muted",
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Based on {feedbacks.length} reviews
                          {recommendCount > 0 && (
                            <span className="ml-2 text-emerald-400">
                              · {recommendCount} recommend
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      No reviews yet for this copy.
                    </p>
                  )}
                </div>

                {/* Feedback Form / Eligibility Section */}
                {!token ? (
                  /* Not logged in */
                  <div className="p-4 border border-border bg-surface/40 rounded-xl space-y-2 text-center">
                    <Lock className="w-5 h-5 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground">
                      Sign in to leave a review for this book.
                    </p>
                  </div>
                ) : eligibilityLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                    <span className="text-xs text-muted-foreground">Checking eligibility...</span>
                  </div>
                ) : !canLeaveFeedback ? (
                  /* Borrowed but not returned, or never borrowed */
                  <div className="p-4 border border-dashed border-border bg-surface/30 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Review Locked
                      </p>
                    </div>
                    <p className="text-xs text-foreground/70 leading-relaxed">
                      You can only leave a review after you've borrowed <em>and returned</em> this
                      book. Complete your borrow cycle to unlock reviews.
                    </p>
                  </div>
                ) : existingFeedback?.feedbackSubmitted && !isEditingFeedback ? (
                  /* Already submitted — show existing + edit button */
                  <div className="p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                          Review Submitted
                        </p>
                      </div>
                      <button
                        onClick={handleEditFeedback}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "w-4 h-4 shrink-0",
                            star <= (existingFeedback.feedbackRating ?? 0)
                              ? "text-amber-400 fill-amber-400"
                              : "text-muted",
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-foreground/80 italic">
                      "{existingFeedback.feedbackComment}"
                    </p>
                    {existingFeedback.feedbackWouldRecommend !== null && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {existingFeedback.feedbackWouldRecommend
                          ? "You recommended this book"
                          : "You did not recommend this book"}
                      </p>
                    )}
                  </div>
                ) : (
                  /* Eligible — show the feedback form */
                  <form
                    onSubmit={handleFeedbackSubmit}
                    className="space-y-4 p-4 border border-border bg-surface/40 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-foreground">
                        {isEditingFeedback ? "Edit Your Review" : "Write a Review"}
                      </h4>
                      {isEditingFeedback && (
                        <button
                          type="button"
                          onClick={() => setIsEditingFeedback(false)}
                          className="text-xs text-muted-foreground hover:text-foreground transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {/* Rating Selector */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Your Rating
                      </label>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="p-0.5 focus:outline-none transition group"
                          >
                            <Star
                              className={cn(
                                "w-6 h-6 transition-all duration-150",
                                star <= (hoverRating ?? rating)
                                  ? "text-amber-400 fill-amber-400 scale-110"
                                  : "text-muted hover:text-amber-300",
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment Textarea */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Your Feedback
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Share your thoughts on this textbook..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full bg-surface border border-border focus:border-primary rounded-lg p-2.5 text-xs text-foreground outline-none resize-none transition"
                      />
                    </div>

                    {/* Would Recommend Toggle */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Would you recommend this book?
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setWouldRecommend(wouldRecommend === true ? null : true)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition",
                            wouldRecommend === true
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                              : "border-border text-muted-foreground hover:border-emerald-500/30",
                          )}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setWouldRecommend(wouldRecommend === false ? null : false)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition",
                            wouldRecommend === false
                              ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                              : "border-border text-muted-foreground hover:border-rose-500/30",
                          )}
                        >
                          <ThumbsUp className="w-3.5 h-3.5 rotate-180" />
                          No
                        </button>
                        {wouldRecommend !== null && (
                          <button
                            type="button"
                            onClick={() => setWouldRecommend(null)}
                            className="text-xs text-muted-foreground hover:text-foreground transition"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingFeedback}
                      className="w-full py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submittingFeedback && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {isEditingFeedback ? "Update Review" : "Submit Review"}
                    </button>
                  </form>
                )}
              </div>

              {/* Feedback Comments Feed */}
              <div className="md:col-span-7 space-y-4">
                <h4 className="text-sm font-bold text-foreground">
                  User Feedback ({feedbacks.length})
                </h4>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {feedbacks.length > 0 ? (
                    feedbacks.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-surface/20 border border-border/50 rounded-xl space-y-1.5 transition hover:border-border"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">{item.userName}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "w-3 h-3 shrink-0",
                                  star <= item.rating
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-muted",
                                )}
                              />
                            ))}
                          </div>
                          {item.wouldRecommend !== null && item.wouldRecommend !== undefined && (
                            <span
                              className={cn(
                                "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                                item.wouldRecommend
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-rose-500/10 text-rose-400",
                              )}
                            >
                              {item.wouldRecommend ? "Recommends" : "Not recommended"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground/80 leading-normal font-light">
                          {item.comment}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 border border-dashed border-border rounded-xl text-center text-muted-foreground p-4">
                      <Info className="w-5 h-5 mb-1.5 text-muted" />
                      <p className="text-xs font-medium">No reviews posted yet.</p>
                      <p className="text-[10px]">Be the first to share your experience!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">Could not load book details.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
