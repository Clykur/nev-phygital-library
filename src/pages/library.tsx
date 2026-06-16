import {
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import { DEMO_LIBRARY_ROWS } from "@/lib/browse-demos";
import { signInHref } from "@/lib/sign-in-return";
import { isHubAccount, portalPathsForUser } from "@/lib/app-paths";
import { ACTIONS, authorize, isPremiumOk, type AuthUser } from "@/lib/rbac";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  ChevronsUpDown,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useStudentShell } from "@/components/layout/StudentAppShell";
import { CheckoutFlowDialog, type CheckoutFlowItem } from "@/components/checkout-flow-dialog";
import { BookDetailsModal } from "@/components/BookDetailsModal";

import { hasBookCover } from "@/lib/book-cover-display";
import { BookCoverImage } from "@/components/ui/book-cover-image";
import { CATALOG_PAGE_SIZE, hubStatusRank, peerShelfStatusLabel } from "@/lib/catalog-sort";
import {
  HubBookStatusBadge,
  P2pPipelineCoverStatusBadge,
  shelfFilterChipOnDarkClass,
  ShelfPeerStatusBadge,
} from "@/lib/status-badges";
import { STUDENT_CARD_CHROME, STUDENT_CARD_SURFACE } from "@/lib/student-ui";
import { cn } from "@/lib/utils";
import { Portal } from "@radix-ui/react-portal";

type Hub = { id: string; name: string; location: string };
export type InventoryStats = {
  total: number;
  available: number;
  issued: number;
  reserved: number;
};

export type LibraryCatalogBook = {
  id: string;
  refId?: string | null;
  source?: string;
  title: string;
  author?: string | null;
  isbn?: string | null;
  coverImageUrl?: string | null;
  hubId: string;
  status: string;
  dueAt?: string | null;
  createdAt?: string;
  /** Whole rupees — purchase from hub. */
  buyPrice?: number;
  /** Whole rupees — borrow / checkout fee. */
  borrowPrice?: number;
  /** Previous hub after desk shelf acquisition (provenance). */
  acquiredFromHubId?: string | null;
  acquiredFromHubName?: string | null;
  targetHubName?: string | null;
  originalHubName?: string | null;
  inventoryStats?: InventoryStats;
  distanceKm?: number | null;
};

type Book = LibraryCatalogBook;

/** Compact relative time: "1 min ago", "1 hour ago", "1 day ago", … */
export function addedLabel(createdAt: string | undefined) {
  if (!createdAt) return "—";
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return "—";
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 45) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return min === 1 ? "1 min ago" : `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr === 1 ? "1 hour ago" : `${hr} hours ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return day === 1 ? "1 day ago" : `${day} days ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return wk === 1 ? "1 week ago" : `${wk} weeks ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return mo === 1 ? "1 month ago" : `${mo} months ago`;
  const yr = Math.floor(day / 365);
  return yr === 1 ? "1 year ago" : `${yr} years ago`;
}

export function catalogRefLabel(id: string, sampleIndex: number | null) {
  if (sampleIndex != null) return `S${sampleIndex + 1}`;
  if (/^REF[2-9A-HJ-KMNP-Z]{8}[2-9A-HJ-KMNP-Z]$/.test(id)) return id;
  const hex = id.replace(/-/g, "");
  const tail = (hex.slice(-6) || hex).toUpperCase();
  return `#${tail}`;
}

export function CatalogBookCard({
  title,
  coverUrl,
  hubName,
  fromHubName,
  refDisplay,
  addedText,
  fullIdForTitle,
  addedAtTitle,
  isSample,
  shelfStatus,
  /** P2P pipeline listing state — shown on cover (takes priority over `shelfStatus` when both set). */
  pipelineListingStatus,
  action,
  onOpen,
  /** Square cover area — no radius on placeholder/image clip (e.g. marketplace grid). */
  sharpCover,
  hideBottomTitle,
  distanceKm,
}: {
  title: string;
  coverUrl: string | null | undefined;
  hubName: string;
  /** Provenance: acquired from another hub (desk purchase). */
  fromHubName?: string | null;
  refDisplay: string;
  addedText: string;
  fullIdForTitle?: string;
  /** Exact catalog time (hover on Added). */
  addedAtTitle?: string;
  isSample: boolean;
  /** Hub catalog lifecycle status (borrow page). */
  shelfStatus?: string;
  inventoryStats?: InventoryStats;
  pipelineListingStatus?: string;
  action: ReactNode;
  onOpen?: () => void;
  sharpCover?: boolean;
  hideBottomTitle?: boolean;
  distanceKm?: number | null;
}) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen?.();
    }
  };

  return (
    <motion.article
      role="button"
      tabIndex={0}
      layout={!sharpCover}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        STUDENT_CARD_SURFACE,
        "group relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "w-full",
      )}
      onClick={onOpen}
      onKeyDown={onKeyDown}
    >
      <div className={cn("relative w-full overflow-hidden bg-shimmer", "aspect-[2/3]")}>
        {!isSample && (pipelineListingStatus || shelfStatus) ? (
          <div className="absolute right-2 top-2 z-10 max-w-[min(100%,12rem)]">
            {pipelineListingStatus ? (
              <P2pPipelineCoverStatusBadge status={pipelineListingStatus} />
            ) : (
              <HubBookStatusBadge status={shelfStatus!} />
            )}
          </div>
        ) : null}
        {!isSample && distanceKm != null ? (
          <div className="absolute left-2 top-2 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-overlay-backdrop/70 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-on-media border border-overlay-glass-border">
              <MapPin className="h-3 w-3 text-accent" />
              {distanceKm.toFixed(1)} km away
            </span>
          </div>
        ) : null}
        <BookCoverImage
          src={coverUrl}
          alt={title}
          className={cn(
            "h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]",
            sharpCover && "rounded-xl",
          )}
        />

        {/* Resting label */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-overlay-backdrop via-overlay-backdrop to-transparent p-4 pt-24 transition-opacity duration-300 group-hover:opacity-0 group-focus-within:opacity-0">
          <p className="font-serif text-[1.1rem] font-bold leading-snug text-on-media drop-shadow-sm line-clamp-2">
            {title}
          </p>
          {!isSample && fromHubName ? (
            <p className="mt-1.5 text-xs font-medium leading-snug text-on-media-muted line-clamp-1">
              From: {fromHubName}
            </p>
          ) : null}
          {isSample && <span className={cn(shelfFilterChipOnDarkClass, "mt-2")}>Sample</span>}
        </div>

        {/* Hover / focus overlay — desktop only (hidden on touch) */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-overlay-backdrop via-overlay-backdrop to-overlay-scrim opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
          <div className="space-y-2 p-3 pt-10 text-on-media">
            <div>
              <p className="font-serif text-lg font-medium leading-snug tracking-tight">{title}</p>
              {isSample && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-200/95">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  Illustrative layout — connect your catalog to see live copies.
                </p>
              )}
            </div>
            <dl className="grid gap-1.5 text-xs text-on-media-muted">
              <div className="flex gap-2">
                <dt className="shrink-0 text-on-media-subtle">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Hub
                  </span>
                </dt>
                <dd className="min-w-0 font-medium leading-snug">{hubName}</dd>
              </div>
              {fromHubName ? (
                <div className="flex gap-2">
                  <dt className="shrink-0 text-on-media-subtle">From</dt>
                  <dd className="min-w-0 text-on-media-muted leading-snug">{fromHubName}</dd>
                </div>
              ) : null}
              <div className="flex gap-2">
                <dt className="shrink-0 text-on-media-subtle">Added</dt>
                <dd className="font-medium" title={addedAtTitle}>
                  {addedText}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 text-on-media-subtle">Ref</dt>
                <dd className="caption-scale font-semibold tracking-wide" title={fullIdForTitle}>
                  {refDisplay}
                </dd>
              </div>
            </dl>
            <div
              className="pt-1"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                }
              }}
            >
              {action}
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/** Peer / P2P tile — same chrome, hover overlay, and motion as {@link CatalogBookCard}. */
export function PeerListingCard({
  title,
  coverUrl,
  refDisplay,
  addedText,
  addedAtTitle,
  fullIdForTitle,
  isSample,
  listingStatus,
  priceDisplay,
  borrowPriceDisplay,
  priceOk,
  onOpen,
  sharpCover,
  hideBottomTitle,
  distanceKm,
}: {
  title: string;
  coverUrl: string | null | undefined;
  refDisplay: string;
  addedText: string;
  addedAtTitle?: string;
  fullIdForTitle?: string;
  isSample: boolean;
  listingStatus: string;
  priceDisplay: string;
  /** Shown when peer listing has a borrow fee (e.g. "Borrow ₹55"). */
  borrowPriceDisplay?: string;
  priceOk: boolean;
  onOpen: () => void;
  sharpCover?: boolean;
  hideBottomTitle?: boolean;
  inventoryStats?: InventoryStats;
  distanceKm?: number | null;
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <motion.article
      role="button"
      tabIndex={0}
      layout={!sharpCover}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        STUDENT_CARD_SURFACE,
        "group relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "w-full",
      )}
      onClick={onOpen}
      onKeyDown={onKeyDown}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-shimmer">
        {listingStatus && !isSample && (
          <div className="absolute right-2 top-2 z-10">
            <ShelfPeerStatusBadge status={listingStatus} />
          </div>
        )}
        {!isSample && distanceKm != null && (
          <div className="absolute left-2 top-2 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-overlay-backdrop/70 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-on-media border border-overlay-glass-border">
              <MapPin className="h-3 w-3 text-accent" />
              {distanceKm.toFixed(1)} km away
            </span>
          </div>
        )}
        <BookCoverImage
          src={coverUrl}
          alt={title}
          className={cn(
            "h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]",
            sharpCover && "rounded-xl",
          )}
        />

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-overlay-backdrop via-overlay-backdrop to-transparent px-3 pb-3 transition-opacity duration-300 group-hover:opacity-0 group-focus-within:opacity-0",
            "pt-16",
          )}
        >
          <p className="font-serif text-[0.95rem] font-medium leading-snug text-on-media drop-shadow-sm line-clamp-2">
            title={title}
          </p>
          {priceOk && (
            <p className="mt-1 font-serif text-sm font-semibold tabular-nums text-amber-200/95">
              {priceDisplay}
              {borrowPriceDisplay ? (
                <span className="mt-0.5 block text-xs font-medium text-on-media-muted">
                  {borrowPriceDisplay}
                </span>
              ) : null}
            </p>
          )}
          {isSample && <span className={cn(shelfFilterChipOnDarkClass, "mt-1.5")}>Sample</span>}
        </div>

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-overlay-backdrop via-overlay-backdrop to-overlay-scrim opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
          <div className="space-y-2 p-3 pt-10 text-on-media">
            <div>
              <p className="font-serif text-lg font-medium leading-snug tracking-tight">{title}</p>
              {isSample && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-200/95">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  Sample peer listing — sign in to publish a real copy.
                </p>
              )}
            </div>
            <dl className="grid gap-1.5 text-xs text-on-media-muted">
              <div className="flex gap-2">
                <dt className="shrink-0 text-on-media-subtle">
                  <span className="inline-flex items-center gap-1">
                    <ShoppingBag className="h-3 w-3" />
                    Source
                  </span>
                </dt>
                <dd className="min-w-0 font-medium leading-snug">Peer listing</dd>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <dt className="shrink-0 text-on-media-subtle">Status</dt>
                <dd className="m-0">
                  <span className={shelfFilterChipOnDarkClass}>
                    {peerShelfStatusLabel(listingStatus)}
                  </span>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 text-on-media-subtle">Buy</dt>
                <dd
                  className={cn(
                    "font-medium tabular-nums",
                    priceOk ? "text-amber-200/95" : "text-on-media-subtle",
                  )}
                  title={priceOk ? priceDisplay : undefined}
                >
                  {priceOk ? priceDisplay : "—"}
                </dd>
              </div>
              {borrowPriceDisplay ? (
                <div className="flex gap-2">
                  <dt className="shrink-0 text-on-media-subtle">Borrow</dt>
                  <dd className="font-medium tabular-nums text-amber-200/95">
                    {borrowPriceDisplay}
                  </dd>
                </div>
              ) : null}
              <div className="flex gap-2">
                <dt className="shrink-0 text-on-media-subtle">Added</dt>
                <dd className="font-medium" title={addedAtTitle}>
                  {addedText}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 text-on-media-subtle">Ref</dt>
                <dd className="caption-scale font-semibold tracking-wide" title={fullIdForTitle}>
                  {refDisplay}
                </dd>
              </div>
            </dl>
            <div className="pt-1">
              <p className="text-center text-xs text-on-media-muted">Click for details</p>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function LibraryPage() {
  const { token, user } = useAuth();
  const portalPaths = portalPathsForUser(user);
  const inShell = useStudentShell();
  const qc = useQueryClient();
  const [catalogSearch, setCatalogSearch] = useState("");
  const [checkout, setCheckout] = useState<{
    item: CheckoutFlowItem;
    initialMode?: "borrow" | "buy";
  } | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const hubsQ = useQuery({
    queryKey: ["catalog", "hubs"],
    queryFn: () => apiFetch<{ hubs: Hub[] }>("/api/catalog/hubs", { token: token ?? undefined }),
  });

  const booksUrl = useMemo(() => {
    const q = catalogSearch.trim();
    return q ? `/api/catalog/books?q=${encodeURIComponent(q)}` : "/api/catalog/books";
  }, [catalogSearch]);

  const booksQ = useQuery({
    queryKey: ["catalog", "books", booksUrl],
    queryFn: () => apiFetch<{ books: Book[] }>(booksUrl, { token: token ?? undefined }),
  });

  const hubName = (id: string) => hubsQ.data?.hubs.find((h) => h.id === id)?.name ?? id.slice(0, 8);

  const invalidateAfterCheckout = () => {
    void qc.invalidateQueries({ queryKey: ["catalog", "books"] });
    void qc.invalidateQueries({ queryKey: ["activity", "timeline"] });
    void qc.invalidateQueries({ queryKey: ["hub", "books"] });
    void qc.invalidateQueries({ queryKey: ["hub", "overview"] });
    void qc.invalidateQueries({ queryKey: ["book-requests", "hub"] });
    void qc.invalidateQueries({ queryKey: ["wallet"] });
    void qc.invalidateQueries({ queryKey: ["student-dashboard"] });
    void qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const deskAcquireHubs = useMemo(() => {
    if (!user || !isHubAccount(user) || !user.hubStaffHubIds.length || !hubsQ.data?.hubs.length)
      return null;
    return user.hubStaffHubIds.map((hid) => ({
      id: hid,
      name: hubsQ.data!.hubs.find((h) => h.id === hid)?.name ?? `${hid.slice(0, 8)}…`,
    }));
  }, [user, hubsQ.data?.hubs]);

  const rowsAll = booksQ.data?.books ?? [];
  const rowsOrdered = useMemo(() => {
    const sorted = [...rowsAll].sort((a, b) => {
      const d = hubStatusRank(a.status) - hubStatusRank(b.status);
      if (d !== 0) return d;
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    const result: typeof rowsAll = [];
    const groupedKeys = new Set<string>();

    for (const b of sorted) {
      const titleKey = b.title.trim().toLowerCase();
      const authorKey = (b.author || "").trim().toLowerCase();
      const isbnKey = (b.isbn || "").trim().toLowerCase();
      const key = `${b.hubId}:${titleKey}:${authorKey}:${isbnKey}`;

      if (b.status === "available") {
        if (!groupedKeys.has(key)) {
          groupedKeys.add(key);
          result.push(b);
        }
      } else {
        result.push(b);
      }
    }
    return result;
  }, [rowsAll]);

  const [catalogPage, setCatalogPage] = useState(1);
  useEffect(() => {
    setCatalogPage(1);
  }, [catalogSearch]);

  const catalogTotalPages = Math.max(1, Math.ceil(rowsOrdered.length / CATALOG_PAGE_SIZE));
  const rowsPage = useMemo(
    () => rowsOrdered.slice((catalogPage - 1) * CATALOG_PAGE_SIZE, catalogPage * CATALOG_PAGE_SIZE),
    [rowsOrdered, catalogPage],
  );

  const loading = hubsQ.isLoading || booksQ.isLoading;
  const fetchError = hubsQ.isError || booksQ.isError;
  const refetchAll = () => {
    void hubsQ.refetch();
    void booksQ.refetch();
  };

  const showSampleLayout =
    booksQ.isSuccess &&
    hubsQ.isSuccess &&
    rowsAll.length === 0 &&
    !booksQ.isFetching &&
    !hubsQ.isFetching;

  const topPad = inShell ? "" : "pt-24";

  return (
    <div className={cn("min-h-[100dvh] bg-background pb-12", topPad)}>
      <div className={cn("mx-auto w-full", inShell ? "max-w-none" : "max-w-7xl px-6 lg:px-10")}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <p className="caption-scale font-semibold uppercase tracking-[0.45em] text-accent/90">
              {user?.baseRole === "super_admin" ? "Super admin" : inShell ? "Student" : "Catalog"}
            </p>
            <h1 className="mt-3 font-serif text-4xl font-light tracking-tight md:text-[2.75rem]">
              {inShell ? "Books at your hub" : "Campus copies"}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
              {inShell ? (
                <>
                  Physical copies you can check out from your college hub. Request a hold if nothing
                  is on the shelf. For used copies, open{" "}
                  <Link
                    href={portalPaths.borrow}
                    className="font-medium text-accent underline-offset-4 hover:underline"
                  >
                    Borrow &amp; buy
                  </Link>{" "}
                  in the student app.
                </>
              ) : (
                <>
                  On-shelf copies sort first; other statuses follow. Hover a tile for details.{" "}
                  <Link
                    href={signInHref("/library")}
                    className="font-medium text-accent underline-offset-4 hover:underline"
                  >
                    Sign in
                  </Link>{" "}
                  to check out or request a hold.
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-stretch sm:items-end sm:pt-1">
            {!user ? (
              <Button variant="secondary" className="rounded-full px-6" asChild>
                <Link href={signInHref("/library")}>Request a book</Link>
              </Button>
            ) : (
              <RequestBookSection
                token={token!}
                user={user}
                onDone={() => {
                  void qc.invalidateQueries({ queryKey: ["book-requests"] });
                  void qc.invalidateQueries({ queryKey: ["notifications", "mine"] });
                }}
                trigger={
                  <Button type="button" variant="secondary" className="rounded-full px-6">
                    Request a book
                  </Button>
                }
              />
            )}
          </div>
        </motion.div>

        {user && !isPremiumOk(user) && (
          <div className={cn(STUDENT_CARD_SURFACE, "mb-8 bg-card/80 px-5 py-4 text-sm")}>
            Free members can borrow and buy with credits. Premium members borrow free; book requests
            still require an upgrade.
          </div>
        )}

        {fetchError && (
          <div className="mb-8 flex flex-col gap-4 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="font-medium text-foreground">Couldn’t load the catalog</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Check that the API is running and{" "}
                  <code className="rounded bg-shimmer px-1">/api</code> is reachable from this app.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="shrink-0 rounded-full"
              onClick={() => refetchAll()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        {showSampleLayout && (
          <div className="mb-8 rounded-xl border border-accent/25 bg-accent/5 px-4 py-3 text-sm text-foreground">
            <span className="font-medium text-accent">Live shelf is empty.</span> Tiles below are a
            sample layout — start the API with{" "}
            <code className="rounded bg-shimmer px-1 text-xs">AUTO_SEED=1</code> (default in{" "}
            <code className="rounded bg-shimmer px-1 text-xs">npm run dev</code>) to load real
            copies.
          </div>
        )}

        {!showSampleLayout && !fetchError && (
          <div className={cn(STUDENT_CARD_CHROME, "mb-8 flex bg-card/95 p-2")}>
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search catalog — available copies sort first"
                className="h-12 border-0 bg-transparent pl-12 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading catalog…</p>
          </div>
        ) : fetchError ? null : (
          <>
            <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 sm:items-stretch sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {showSampleLayout
                ? DEMO_LIBRARY_ROWS.map((b, idx) => (
                    <CatalogBookCard
                      key={`sample-${idx}`}
                      title={b.title}
                      coverUrl={b.coverImageUrl}
                      hubName={b.hubName}
                      refDisplay={catalogRefLabel("sample", idx)}
                      addedText="—"
                      isSample
                      action={
                        <p className="text-center text-xs text-on-media-muted">
                          Preview — not a live copy
                        </p>
                      }
                    />
                  ))
                : rowsPage.map((b) => {
                    const canCheckout =
                      !!user &&
                      authorize(user, ACTIONS.CHECKOUT_BOOK, {
                        type: "book",
                        hubId: b.hubId,
                        bookId: b.id,
                      });
                    const isAvailable = b.status === "available";
                    return (
                      <CatalogBookCard
                        key={b.id}
                        title={b.title}
                        coverUrl={b.coverImageUrl}
                        hubName={hubName(b.hubId)}
                        fromHubName={b.acquiredFromHubName ?? undefined}
                        refDisplay={catalogRefLabel(b.refId ?? b.id, null)}
                        addedText={addedLabel(b.createdAt)}
                        addedAtTitle={
                          b.createdAt ? new Date(b.createdAt).toLocaleString() : undefined
                        }
                        fullIdForTitle={b.id}
                        isSample={false}
                        shelfStatus={b.status}
                        inventoryStats={b.inventoryStats}
                        onOpen={() => {
                          setSelectedBookId(b.id);
                          setDetailsModalOpen(true);
                        }}
                        action={
                          <>
                            {!user && (
                              <Button
                                size="sm"
                                className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent"
                                asChild
                              >
                                <Link href={signInHref("/library")}>
                                  <BookOpen className="mr-2 h-4 w-4" />
                                  Sign in to borrow
                                </Link>
                              </Button>
                            )}
                            {user && token && !isAvailable && (
                              <RequestBookSection
                                token={token}
                                user={user}
                                initialBookTitle={b.title}
                                redirectToActivityAfterSubmit
                                onDone={() => {
                                  void qc.invalidateQueries({ queryKey: ["book-requests"] });
                                  void qc.invalidateQueries({
                                    queryKey: ["notifications", "mine"],
                                  });
                                }}
                                trigger={
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="w-full rounded-full border border-overlay-glass-border bg-overlay-glass text-on-media hover:bg-overlay-glass"
                                  >
                                    Request a book
                                  </Button>
                                }
                              />
                            )}
                            {user && isAvailable && !canCheckout && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="w-full rounded-full"
                                onClick={() =>
                                  toast.message(
                                    "This account cannot borrow this copy. Check your wallet or account permissions.",
                                  )
                                }
                              >
                                <BookOpen className="mr-2 h-4 w-4" />
                                Borrow
                              </Button>
                            )}
                            {user && isAvailable && canCheckout && (
                              <Button
                                size="sm"
                                className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent"
                                onClick={() =>
                                  setCheckout({
                                    item: {
                                      kind: "hub",
                                      bookId: b.id,
                                      title: b.title,
                                      hubName: hubName(b.hubId),
                                      buyPrice: b.buyPrice ?? 0,
                                      borrowPrice: b.borrowPrice ?? 0,
                                    },
                                    initialMode: "borrow",
                                  })
                                }
                              >
                                <BookOpen className="mr-2 h-4 w-4" />
                                Borrow or buy
                              </Button>
                            )}
                          </>
                        }
                      />
                    );
                  })}
            </div>
            {!showSampleLayout && catalogTotalPages > 1 && (
              <nav
                className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row"
                aria-label="Catalog pagination"
              >
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    disabled={catalogPage <= 1}
                    onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="min-w-[8.5rem] text-center text-sm text-muted-foreground tabular-nums">
                    Page {catalogPage} of {catalogTotalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    disabled={catalogPage >= catalogTotalPages}
                    onClick={() => setCatalogPage((p) => Math.min(catalogTotalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </nav>
            )}
          </>
        )}
      </div>
      {token ? (
        <CheckoutFlowDialog
          open={!!checkout}
          onOpenChange={(o) => !o && setCheckout(null)}
          item={checkout?.item ?? null}
          initialMode={checkout?.initialMode}
          token={token}
          onComplete={invalidateAfterCheckout}
          deskAcquireHubs={deskAcquireHubs ?? undefined}
        />
      ) : null}

      <BookDetailsModal
        bookId={selectedBookId}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />
    </div>
  );
}

export function RequestBookSection({
  token,
  user,
  onDone,
  trigger,
  initialBookTitle,
  redirectToActivityAfterSubmit,
}: {
  token: string;
  user: AuthUser;
  onDone: () => void;
  trigger?: ReactElement;
  /** Prefill title (e.g. catalog book or search query). */
  initialBookTitle?: string;
  /** After success, go to My activity in the student shell. */
  redirectToActivityAfterSubmit?: boolean;
}) {
  const inShell = useStudentShell();
  const [, setLocation] = useLocation();
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBookTitle((initialBookTitle ?? "").trim());
    setAuthor("");
    setIsbn("");
    setNotes("");
  }, [open, initialBookTitle]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const titleTrim = bookTitle.trim();
    if (!titleTrim) {
      toast.error("Enter the book title");
      return;
    }
    try {
      await apiFetch("/api/book-requests", {
        method: "POST",
        token,
        body: JSON.stringify({
          bookTitle: titleTrim,
          author: author.trim() || undefined,
          isbn: isbn.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      toast.success("Request sent to all hubs. Track status under My activity.");
      setOpen(false);
      onDone();
      if (redirectToActivityAfterSubmit && inShell) {
        setLocation(portalPathsForUser(user).activity);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Request failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="secondary" className="rounded-full">
            Request a book
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] sm:max-w-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Neev
          </p>
          <DialogTitle className="font-serif">Request a Book</DialogTitle>
          <DialogDescription>
            Your request is broadcast to every hub. Track updates under My activity.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="request-book-title">
              Book title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="request-book-title"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="Title you are looking for"
              maxLength={500}
              required
              aria-required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="request-book-author">Author (optional)</Label>
            <Input
              id="request-book-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
              maxLength={300}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="request-book-isbn">ISBN (optional)</Label>
            <Input
              id="request-book-isbn"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="ISBN"
              maxLength={32}
            />
          </div>
          <div className="space-y-2">
            <Label>Notes / comments (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Edition, course, urgency…"
              maxLength={2000}
              className="min-h-[80px] resize-y"
            />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={!bookTitle.trim()}>
            Submit request
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
