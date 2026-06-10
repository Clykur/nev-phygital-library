import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudentShell } from "@/components/layout/StudentAppShell";
import { useAuth } from "@/context/auth-context";
import { CATALOG_PAGE_SIZE, hubStatusRank, p2pShelfStatusRank } from "@/lib/catalog-sort";
import { hubKindLabel } from "@/lib/hub-display";
import { ShelfPeerStatusBadge } from "@/lib/status-badges";
import { ApiError, apiFetch, apiPublicUrl } from "@/lib/api";
import { userFacingErrorMessage } from "@/lib/error-messages";
import { BookCoverImage } from "@/components/ui/book-cover-image";
import { DEMO_MARKETPLACE_LISTINGS } from "@/lib/browse-demos";
import { signInHref } from "@/lib/sign-in-return";
import { isHubAccount, portalPathsForUser, SUPER_ADMIN_INVENTORY_PATH } from "@/lib/app-paths";
import { ACTIONS, authorize, isPremiumOk } from "@/lib/rbac";
import {
  CatalogBookCard,
  PeerListingCard,
  RequestBookSection,
  addedLabel,
  catalogRefLabel,
  type LibraryCatalogBook,
} from "@/pages/library";
import { PORTAL_PAGE_CONTAINER, STUDENT_CARD_CHROME, STUDENT_CARD_SURFACE } from "@/lib/student-ui";
import { LocationDiscoveryDialog } from "@/components/LocationDiscoveryDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertCircle,
  BookMarked,
  BookOpen,
  ImagePlus,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useGeolocation } from "@/hooks/use-geolocation";
import { CheckoutFlowDialog, type CheckoutFlowItem } from "@/components/checkout-flow-dialog";
import { recordRecentlyViewed } from "@/lib/recently-viewed";

type P2pListing = {
  id: string;
  ownerId: string;
  hubId?: string;
  bookTitle: string;
  coverImageUrl?: string | null;
  price: number;
  borrowPrice: number;
  type?: string;
  status: string;
  dropoffHubId: string | null;
  buyerId: string | null;
  buyerBaseRole?: string | null;
  borrowerUserId?: string | null;
  borrowDueAt?: string | null;
  createdAt?: string | null;
  inventoryStats?: {
    total: number;
    available: number;
    issued: number;
    reserved: number;
  };
};

type Hub = { id: string; name: string; kind?: string };
type RequestRow = { id: string; bookTitle?: string | null; status: string; createdAt?: string };
const RECENT_VIEWED_KEY = "student.recentViewedTitles";
const RECENT_SEARCHES_KEY = "student.recentSearches";

function isDemoListingId(id: string) {
  return id.startsWith("demo-");
}

/** Peer listings must have a positive price to be shown or created. */
function isValidListingPrice(price: number) {
  return Number.isFinite(price) && Number.isInteger(price) && price >= 1;
}

function isValidBorrowFee(price: number) {
  return Number.isFinite(price) && Number.isInteger(price) && price >= 0;
}

/** API may return amounts as strings or floats; catalog browse needs whole rupees. */
function rupeeInt(n: unknown): number {
  if (n == null) return NaN;
  if (typeof n === "number" && Number.isFinite(n)) return Math.round(n);
  if (typeof n === "string" && n.trim() !== "") {
    const x = Number.parseFloat(n);
    return Number.isFinite(x) ? Math.round(x) : NaN;
  }
  return NaN;
}

/** Shown in the hub+peer browse grid (not draft/pipeline states only staff/seller need). */
function peerRowVisibleInPublicBrowse(status: string) {
  return status === "available" || status === "approved";
}

function MarketplacePeerCard({
  listing: l,
  onSelect,
  onViewed,
  hideBottomTitle,
}: {
  listing: P2pListing;
  onSelect: (listing: P2pListing) => void;
  onViewed?: (listing: P2pListing) => void;
  hideBottomTitle?: boolean;
}) {
  const priceOk = isValidListingPrice(l.price);
  const borrowOk = isValidBorrowFee(l.borrowPrice);
  const priceDisplay = priceOk ? `Buy ${l.price.toLocaleString("en-IN")} Credits` : "—";
  const borrowPriceDisplay = borrowOk
    ? `Borrow ${l.borrowPrice.toLocaleString("en-IN")} Credits`
    : undefined;
  return (
    <PeerListingCard
      title={l.bookTitle}
      coverUrl={l.coverImageUrl ? apiPublicUrl(l.coverImageUrl) : l.coverImageUrl}
      refDisplay={catalogRefLabel(l.id, null)}
      addedText={addedLabel(l.createdAt ?? undefined)}
      addedAtTitle={l.createdAt ? new Date(l.createdAt).toLocaleString() : undefined}
      fullIdForTitle={l.id}
      isSample={isDemoListingId(l.id)}
      listingStatus={l.status}
      priceDisplay={priceDisplay}
      borrowPriceDisplay={borrowPriceDisplay}
      priceOk={priceOk}
      inventoryStats={l.inventoryStats}
      sharpCover
      hideBottomTitle={hideBottomTitle}
      onOpen={() => {
        pushRecentViewedTitle(l.bookTitle);
        onViewed?.(l);
        onSelect(l);
      }}
    />
  );
}

function GridPagination({
  page,
  totalPages,
  onPageChange,
  label,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  label: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-8 flex justify-end" aria-label={label}>
      <div className="inline-flex w-full sm:w-auto items-center justify-between gap-1 sm:gap-2 rounded-xl border border-border bg-background p-1 sm:px-2 sm:py-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl px-2 sm:px-3"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        <span className="flex-1 sm:flex-none sm:min-w-[8.5rem] text-center caption-scale font-medium text-foreground-muted tabular-nums">
          Page {page} of {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl px-2 sm:px-3"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}

function CopyLifecycleStrip({ status }: { status: string }) {
  if (["sold", "unavailable", "transfer_pending", "in_transit"].includes(status)) {
    return <p className="section-kicker">Lifecycle: {status.replace(/_/g, " ")}</p>;
  }
  const idx =
    status === "available" ? 0 : status === "reserved" ? 1 : status === "checked_out" ? 2 : 0;
  return (
    <div
      className="flex w-full flex-wrap items-center justify-start gap-1.5 text-left"
      title="On shelf to set aside (reserved) to out on loan."
    >
      {["Available", "Set aside", "Out"].map((label, i) => (
        <span key={label} className="flex items-center gap-1.5">
          {i > 0 ? (
            <span className="caption-scale font-bold text-muted-foreground/30">›</span>
          ) : null}
          <span
            className={cn(
              "max-w-[10rem] truncate rounded-xl px-2 py-0.5 caption-scale font-medium transition-colors",
              i < idx
                ? "bg-secondary/10 text-secondary"
                : i === idx
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground/50",
            )}
          >
            {label}
          </span>
        </span>
      ))}
    </div>
  );
}

function peerStatusToLifecycle(status: string): "available" | "reserved" | "checked_out" {
  if (status === "available" || status === "approved") return "available";
  if (status === "reserved" || status === "borrowed") return "checked_out";
  return "reserved";
}

function unavailableReason(status: string) {
  if (status === "checked_out" || status === "overdue") return "checked out";
  if (status === "reserved") return "reserved";
  return "not on shelf";
}

function listingStatusLabel(status: string) {
  if (status === "listed") return "Draft";
  if (status === "pending_dropoff") return "Pending Drop-off";
  if (status === "approved") return "On Shelf";
  if (status === "available") return "On Shelf";
  if (status === "sold") return "Sold";
  if (status === "rejected") return "Rejected";
  return status.replace(/_/g, " ");
}

function listingNextStep(status: string) {
  if (status === "listed") return "Choose drop-off hub to start.";
  if (status === "pending_dropoff") return "Drop at hub desk to activate.";
  if (status === "approved") return "Available in shelf.";
  if (status === "available") return "Available on the shelf.";
  if (status === "sold") return "Completed. Edits are locked.";
  if (status === "rejected") return "Rejected. No further action.";
  return "Track status updates from this page.";
}

function pushRecentViewedTitle(title: string) {
  if (typeof window === "undefined") return;
  const clean = title.trim();
  if (!clean) return;
  try {
    const raw = window.localStorage.getItem(RECENT_VIEWED_KEY);
    const current = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [clean, ...current.filter((t) => t !== clean)].slice(0, 12);
    window.localStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

type BrowseRow =
  | { kind: "hub"; book: LibraryCatalogBook; key: string }
  | { kind: "p2p"; listing: P2pListing; key: string };

type MarketplaceProps = { studentMode?: "browse" | "sell" };

export default function Marketplace(props?: MarketplaceProps) {
  const { studentMode } = props ?? {};
  /** Public `/marketplace` has no `studentMode` prop: treat it like browse (hub + peer), not sell-only. */
  const isBrowseMode = studentMode !== "sell";
  const { token, user } = useAuth();
  const portalPaths = portalPathsForUser(user);
  const hubDesk = !!user && isHubAccount(user);
  const isSuperAdmin = user?.baseRole === "super_admin";
  const hubDeskBrowse = hubDesk && isBrowseMode;
  const inShell = useStudentShell();
  /** Logged-in super admin should use All copies, not a separate hub+peer “Network catalog” grid. */
  const superAdminShellBrowse = inShell && isSuperAdmin && isBrowseMode;
  const studentShellBrowse = inShell && !hubDesk && isBrowseMode;
  const studentShellFlat = inShell && !hubDesk;
  const [location] = useLocation();
  const { coords, requestLocation, loading: locLoading, permissionDenied } = useGeolocation();
  const [locationFilter, setLocationFilter] = useState("all");
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<"all" | "hub" | "peers">("all");
  const [soldToFilter, setSoldToFilter] = useState<"all" | "peer" | "hub">("all");
  const [selected, setSelected] = useState<P2pListing | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("499");
  const [newBorrowPrice, setNewBorrowPrice] = useState("79");
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [newCoverPreview, setNewCoverPreview] = useState<string | null>(null);
  const [newListHubId, setNewListHubId] = useState("");
  const [dropHubId, setDropHubId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editBorrowPrice, setEditBorrowPrice] = useState("");
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
  const [editClearCover, setEditClearCover] = useState(false);
  const [browsePage, setBrowsePage] = useState(1);
  const [peerGridPage, setPeerGridPage] = useState(1);
  const [isLocationDiscoveryOpen, setLocationDiscoveryOpen] = useState(false);
  const [checkout, setCheckout] = useState<{
    item: CheckoutFlowItem;
    initialMode?: "borrow" | "buy";
  } | null>(null);

  useEffect(() => {
    setSearch("");
    setBrowsePage(1);
    setPeerGridPage(1);
  }, [location, studentMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      setRecentSearches(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const clean = search.trim();
    if (!clean || clean.length < 2) return;
    const next = [
      clean,
      ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase()),
    ].slice(0, 6);
    setRecentSearches(next);
    try {
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    // intentionally only persists when search changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hubsQ = useQuery({
    queryKey: ["catalog", "hubs"],
    queryFn: () => apiFetch<{ hubs: Hub[] }>("/api/catalog/hubs", { token: token ?? undefined }),
  });

  const nearbyHubs = coords
    ? [...(hubsQ.data?.hubs || [])].sort((a, b) => a.name.length - b.name.length).slice(0, 3)
    : [];

  const listingsQueryEnabled =
    studentMode === "sell" ||
    studentMode === undefined ||
    (isBrowseMode && (sourceFilter === "all" || sourceFilter === "peers"));

  const listingsQ = useQuery({
    queryKey: ["p2p-listings"],
    enabled: listingsQueryEnabled,
    queryFn: () =>
      apiFetch<{ listings: P2pListing[] }>("/api/p2p/listings", {
        token: token ?? undefined,
      }),
  });

  const hubBooksUrl = useMemo(() => {
    const q = search.trim();
    return q ? `/api/catalog/books?q=${encodeURIComponent(q)}` : "/api/catalog/books";
  }, [search]);

  const hubBooksEnabled = isBrowseMode && (sourceFilter === "all" || sourceFilter === "hub");

  const hubBooksQ = useQuery({
    queryKey: ["catalog", "books", "browse-hub", hubBooksUrl],
    enabled: hubBooksEnabled,
    queryFn: () =>
      apiFetch<{ books: LibraryCatalogBook[] }>(hubBooksUrl, {
        token: token ?? undefined,
      }),
  });
  const reqQ = useQuery({
    queryKey: ["book-requests", "mine"],
    enabled: !!token && !!user && isBrowseMode,
    queryFn: () =>
      apiFetch<{ requests: RequestRow[] }>("/api/book-requests/mine", { token: token! }),
  });

  const live = listingsQ.data?.listings ?? [];
  const useDemoPreview =
    listingsQueryEnabled &&
    listingsQ.isSuccess &&
    live.length === 0 &&
    !listingsQ.isFetching &&
    !(studentMode === "sell" && inShell);

  const gridSource = useMemo((): P2pListing[] => {
    const raw = !useDemoPreview
      ? live.map((l) => {
          const price = rupeeInt(l.price);
          const borrow = rupeeInt(l.borrowPrice);
          return {
            ...l,
            price: Number.isFinite(price) ? price : 0,
            borrowPrice: Number.isFinite(borrow) ? borrow : 0,
          };
        })
      : DEMO_MARKETPLACE_LISTINGS.map((d, i) => ({
          id: `demo-${i}`,
          ownerId: "__demo__",
          bookTitle: d.bookTitle,
          coverImageUrl: d.coverImageUrl,
          price: d.price,
          borrowPrice: d.borrowPrice,
          status: "available",
          hubId: "__demo_hub__",
          dropoffHubId: "__demo_hub__",
          buyerId: null,
        }));
    return raw.filter(
      (listing) =>
        isDemoListingId(listing.id) ||
        (isValidListingPrice(listing.price) && isValidBorrowFee(listing.borrowPrice)),
    );
  }, [useDemoPreview, live]);

  const gridSourcePeerVisible = useMemo(() => {
    return gridSource.filter((l) => {
      if (l.status === "available") return true;
      if (l.status !== "reserved") return true;
      if (!user) return false;
      return l.borrowerUserId === user.userId || l.ownerId === user.userId;
    });
  }, [gridSource, user]);

  const ownerFiltered = useMemo(() => {
    if (studentMode === "sell" && inShell) {
      if (!user) return [];
      const uid = user.userId.toLowerCase();
      return gridSourcePeerVisible.filter((l) => String(l.ownerId).toLowerCase() === uid);
    }
    if (user && studentMode !== "sell") {
      const uid = user.userId.toLowerCase();
      return gridSourcePeerVisible.filter(
        (l) => String(l.ownerId).toLowerCase() !== uid && peerRowVisibleInPublicBrowse(l.status),
      );
    }
    return gridSourcePeerVisible.filter((l) => peerRowVisibleInPublicBrowse(l.status));
  }, [gridSourcePeerVisible, studentMode, inShell, user]);

  const hubBooksSorted = useMemo(() => {
    const books = hubBooksQ.data?.books ?? [];
    let list = [...books].sort((a, b) => {
      const d = hubStatusRank(a.status) - hubStatusRank(b.status);
      if (d !== 0) return d;
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
    if (hubDesk && user?.hubStaffHubIds?.length) {
      const own = new Set(user.hubStaffHubIds);
      list = list.filter((b) => b.hubId != null && !own.has(b.hubId));
    }
    return list;
  }, [hubBooksQ.data?.books, hubDesk, user?.hubStaffHubIds]);

  const peerShelfOrdered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = ownerFiltered;
    if (studentMode === "sell" && inShell && soldToFilter !== "all") {
      rows = rows.filter((l) => {
        if (l.status !== "sold") return true;
        const role = (l.buyerBaseRole ?? "").toLowerCase();
        if (soldToFilter === "hub") return role === "hub";
        return role !== "hub";
      });
    }
    if (q) {
      rows = rows.filter((l) => (l.bookTitle ?? "").toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => {
      const d = p2pShelfStatusRank(a.status) - p2pShelfStatusRank(b.status);
      if (d !== 0) return d;
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [ownerFiltered, search, studentMode, inShell, soldToFilter]);

  const browseRowsFull = useMemo((): BrowseRow[] => {
    if (!isBrowseMode) return [];
    const rows: BrowseRow[] = [];
    if (sourceFilter === "all" || sourceFilter === "hub") {
      for (const b of hubBooksSorted) {
        rows.push({ kind: "hub", book: b, key: `hub-${b.id}` });
      }
    }
    if (sourceFilter === "all" || sourceFilter === "peers") {
      for (const l of peerShelfOrdered) {
        rows.push({ kind: "p2p", listing: l, key: `p2p-${l.id}` });
      }
    }
    return rows;
  }, [isBrowseMode, sourceFilter, hubBooksSorted, peerShelfOrdered]);

  const browseTotalPages = Math.max(1, Math.ceil(browseRowsFull.length / CATALOG_PAGE_SIZE));
  const browseRows = useMemo(
    () =>
      browseRowsFull.slice((browsePage - 1) * CATALOG_PAGE_SIZE, browsePage * CATALOG_PAGE_SIZE),
    [browseRowsFull, browsePage],
  );

  useEffect(() => {
    if (!isBrowseMode || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const focus = params.get("focus");
    const ref = params.get("ref");
    if (focus !== "book" || !ref) return;
    const idx = browseRowsFull.findIndex(
      (row) => row.kind === "hub" && (row.book.id === ref || row.book.refId === ref),
    );
    if (idx < 0) return;
    const page = Math.floor(idx / CATALOG_PAGE_SIZE) + 1;
    if (page !== browsePage) setBrowsePage(page);
  }, [isBrowseMode, browseRowsFull, browsePage]);

  useEffect(() => {
    if (!isBrowseMode || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const focus = params.get("focus");
    const ref = params.get("ref");
    if (focus !== "book" || !ref) return;
    const el =
      document.querySelector(`[data-book-id="${CSS.escape(ref)}"]`) ??
      document.querySelector(`[data-book-ref-id="${CSS.escape(ref)}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary/40", "bg-primary/5");
    const t = window.setTimeout(() => {
      el.classList.remove("ring-2", "ring-primary/40", "bg-primary/5");
    }, 2600);
    return () => window.clearTimeout(t);
  }, [isBrowseMode, browseRows]);

  const searchSuggestions = useMemo(() => {
    const hubTitles = (hubBooksQ.data?.books ?? [])
      .map((b) => b.title?.trim())
      .filter(Boolean) as string[];
    const peerTitles = (peerShelfOrdered ?? [])
      .map((l) => l.bookTitle?.trim())
      .filter(Boolean) as string[];
    return Array.from(new Set([...hubTitles, ...peerTitles])).slice(0, 12);
  }, [hubBooksQ.data?.books, peerShelfOrdered]);

  const recentRequestedTitles = useMemo(() => {
    const rows = reqQ.data?.requests ?? [];
    return Array.from(
      new Set(
        rows
          .filter((r) => ["pending", "available_for_collection"].includes(r.status))
          .map((r) => r.bookTitle?.trim())
          .filter(Boolean) as string[],
      ),
    ).slice(0, 6);
  }, [reqQ.data?.requests]);

  const recentViewsQ = useQuery({
    queryKey: ["student", "recently-viewed", token],
    enabled: !!token && !!user,
    queryFn: () =>
      apiFetch<{
        items: Array<{ title: string }>;
      }>("/api/student/recently-viewed?limit=6", { token: token! }),
  });

  const popularAtHub = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of hubBooksSorted) {
      counts.set(b.title, (counts.get(b.title) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([title]) => title);
  }, [hubBooksSorted]);

  const similarBooks = useMemo(() => {
    const seed = search.trim().toLowerCase();
    let recent: string[] = [];
    if (user && recentViewsQ.data?.items) {
      recent = recentViewsQ.data.items.map((item) => item.title).filter(Boolean);
    } else if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(RECENT_VIEWED_KEY);
        recent = raw ? (JSON.parse(raw) as string[]) : [];
      } catch {
        recent = [];
      }
    }
    if (!seed) return recent.slice(0, 6);
    const matching = searchSuggestions.filter((t) => t.toLowerCase().includes(seed));
    return Array.from(new Set([...matching, ...recent])).slice(0, 6);
  }, [search, searchSuggestions, user, recentViewsQ.data?.items]);

  const peerGridTotalPages = Math.max(1, Math.ceil(peerShelfOrdered.length / CATALOG_PAGE_SIZE));
  const peerGridRows = useMemo(
    () =>
      peerShelfOrdered.slice(
        (peerGridPage - 1) * CATALOG_PAGE_SIZE,
        peerGridPage * CATALOG_PAGE_SIZE,
      ),
    [peerShelfOrdered, peerGridPage],
  );

  useEffect(() => {
    setBrowsePage(1);
  }, [search, sourceFilter]);

  useEffect(() => {
    setPeerGridPage(1);
  }, [search, studentMode]);

  useEffect(() => {
    setBrowsePage((p) => Math.min(Math.max(1, p), browseTotalPages));
  }, [browseTotalPages]);

  useEffect(() => {
    setPeerGridPage((p) => Math.min(Math.max(1, p), peerGridTotalPages));
  }, [peerGridTotalPages]);

  const browseLoading =
    isBrowseMode &&
    ((hubBooksEnabled && hubBooksQ.isLoading) || (listingsQueryEnabled && listingsQ.isLoading));

  const newListingPriceParsed = Number.parseInt(newPrice, 10);
  const newListingPriceValid = isValidListingPrice(newListingPriceParsed);
  const newListingBorrowParsed = Number.parseInt(newBorrowPrice, 10);
  const newListingBorrowValid = isValidBorrowFee(newListingBorrowParsed);
  const editListingPriceParsed = Number.parseInt(editPrice, 10);
  const editListingPriceValid = isValidListingPrice(editListingPriceParsed);
  const editListingBorrowParsed = Number.parseInt(editBorrowPrice, 10);
  const editListingBorrowValid = isValidBorrowFee(editListingBorrowParsed);

  const invalidateCheckoutQueries = () => {
    void qc.invalidateQueries({ queryKey: ["catalog", "books"] });
    void qc.invalidateQueries({ queryKey: ["p2p-listings"] });
    void qc.invalidateQueries({ queryKey: ["activity", "timeline"] });
    void qc.invalidateQueries({ queryKey: ["hub", "books"] });
    void qc.invalidateQueries({ queryKey: ["hub", "overview"] });
    void qc.invalidateQueries({ queryKey: ["book-requests", "hub"] });
    void qc.invalidateQueries({ queryKey: ["wallet"] });
    void qc.invalidateQueries({ queryKey: ["student-dashboard"] });
    void qc.invalidateQueries({ queryKey: ["student", "recently-viewed"] });
    void qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const persistRecentView = (payload: { bookId?: string; listingId?: string }) => {
    if (!token || (!payload.bookId && !payload.listingId)) return;
    void recordRecentlyViewed(
      payload.bookId ? { bookId: payload.bookId } : { listingId: payload.listingId! },
      token,
    )
      .then(() => {
        void qc.invalidateQueries({ queryKey: ["student-dashboard"] });
        void qc.invalidateQueries({ queryKey: ["student", "recently-viewed"] });
      })
      .catch(() => {
        /* Non-blocking analytics write. */
      });
  };

  const deskAcquireHubs = useMemo(() => {
    if (!hubDesk || !user?.hubStaffHubIds.length || !hubsQ.data?.hubs.length) return null;
    return user.hubStaffHubIds.map((hid) => ({
      id: hid,
      name: hubsQ.data!.hubs.find((h) => h.id === hid)?.name ?? `${hid.slice(0, 8)}…`,
    }));
  }, [hubDesk, user?.hubStaffHubIds, hubsQ.data?.hubs]);

  const createListing = useMutation({
    mutationFn: async () => {
      const price = Number.parseInt(newPrice, 10);
      const borrowPrice = Number.parseInt(newBorrowPrice, 10);
      if (!Number.isFinite(price) || price < 1) throw new Error("Invalid price");
      if (!Number.isFinite(borrowPrice) || borrowPrice < 0) throw new Error("Invalid borrow price");
      let coverImageUrl: string | undefined;
      if (newCoverFile) {
        const fd = new FormData();
        fd.append("image", newCoverFile);
        const up = await apiFetch<{ url: string }>("/api/uploads/book-cover", {
          method: "POST",
          token: token!,
          body: fd,
        });
        coverImageUrl = up.url;
      }
      const hubId = newListHubId || hubsQ.data?.hubs[0]?.id;
      if (!hubId) throw new Error("Pick a hub for this listing.");
      await apiFetch("/api/p2p/listings", {
        method: "POST",
        token: token!,
        body: JSON.stringify({
          hubId,
          bookTitle: newTitle.trim(),
          type: "sell",
          price,
          borrowPrice,
          ...(coverImageUrl ? { coverImageUrl } : {}),
        }),
      });
    },
    onSuccess: () => {
      toast.success("Listed");
      setListOpen(false);
      setNewTitle("");
      setNewBorrowPrice("79");
      if (newCoverPreview) URL.revokeObjectURL(newCoverPreview);
      setNewCoverPreview(null);
      setNewCoverFile(null);
      void qc.invalidateQueries({ queryKey: ["p2p-listings"] });
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Could not list — check Premium status."),
  });

  const submitDropoff = useMutation({
    mutationFn: async ({ id, hubId }: { id: string; hubId: string }) => {
      await apiFetch(`/api/p2p/listings/${id}/submit-dropoff`, {
        method: "POST",
        token: token!,
        body: JSON.stringify({ hubId }),
      });
    },
    onSuccess: () => {
      toast.success("Drop-off submitted");
      void qc.invalidateQueries({ queryKey: ["p2p-listings"] });
      void qc.invalidateQueries({ queryKey: ["hub", "pending-p2p"] });
      setSelected(null);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Drop-off failed"),
  });

  useEffect(() => {
    if (!selected) return;
    setEditTitle(selected.bookTitle);
    setEditPrice(String(selected.price));
    setEditBorrowPrice(String(selected.borrowPrice));
    setEditClearCover(false);
    setEditCoverFile(null);
    setDropHubId("");
    setEditCoverPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [selected?.id]);

  const updateListing = useMutation({
    mutationFn: async () => {
      if (!selected || !token) throw new Error("No listing");
      const price = Number.parseInt(editPrice, 10);
      const borrowPrice = Number.parseInt(editBorrowPrice, 10);
      if (!Number.isFinite(price) || price < 1) throw new Error("Invalid price");
      if (!Number.isFinite(borrowPrice) || borrowPrice < 0) throw new Error("Invalid borrow price");
      let coverImageUrl: string | "" | undefined;
      if (editClearCover) {
        coverImageUrl = "";
      } else if (editCoverFile) {
        const fd = new FormData();
        fd.append("image", editCoverFile);
        const up = await apiFetch<{ url: string }>("/api/uploads/book-cover", {
          method: "POST",
          token,
          body: fd,
        });
        coverImageUrl = up.url;
      }
      await apiFetch(`/api/p2p/listings/${selected.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          bookTitle: editTitle.trim(),
          price,
          borrowPrice,
          ...(coverImageUrl !== undefined ? { coverImageUrl } : {}),
        }),
      });
    },
    onSuccess: () => {
      toast.success("Listing updated");
      void qc.invalidateQueries({ queryKey: ["p2p-listings"] });
      setEditCoverPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setEditCoverFile(null);
      setEditClearCover(false);
      setSelected(null);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Update failed"),
  });

  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/p2p/listings/${id}`, { method: "DELETE", token: token! });
    },
    onSuccess: () => {
      toast.success("Listing removed");
      void qc.invalidateQueries({ queryKey: ["p2p-listings"] });
      setSelected(null);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Delete failed"),
  });

  const returnPeerBorrow = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/p2p/listings/${id}/return-borrow`, { method: "POST", token: token! });
    },
    onSuccess: () => {
      toast.success("Peer borrow returned.");
      invalidateCheckoutQueries();
      setSelected(null);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Return failed"),
  });

  const canList =
    user && authorize(user, ACTIONS.CREATE_P2P_LISTING, { type: "none" }) && isPremiumOk(user);

  function openPeerCheckout(listing: P2pListing, mode: "borrow" | "buy") {
    if (!token) return;
    const hubKey = listing.hubId ?? listing.dropoffHubId;
    const hubNm =
      hubKey && hubsQ.data ? (hubsQ.data.hubs.find((h) => h.id === hubKey)?.name ?? null) : null;
    setCheckout({
      item: {
        kind: "p2p",
        listingId: listing.id,
        title: listing.bookTitle,
        hubName: hubNm,
        buyPrice: listing.price,
        borrowPrice: listing.borrowPrice,
      },
      initialMode: mode,
    });
    setSelected(null);
  }

  const peerListingsError = listingsQueryEnabled && listingsQ.isError;

  /** Public `/marketplace` (`studentMode` unset): extra space below fixed navbar — Layout only applies `pt-16`. */

  const hubNameBorrow = (id: string) =>
    hubsQ.data?.hubs.find((h) => h.id === id)?.name ?? id.slice(0, 8);

  const hero = isBrowseMode
    ? hubDesk
      ? {
          kicker: "Hub catalog",
          title: "Network sourcing",
          accent: "Browse, compare, acquire.",
          body: inShell
            ? "Use the union catalog to find titles for members, fill gaps, or buy/borrow as this hub login. Inventory remains the system of record for what you physically hold; this view is for discovery and checkout."
            : "Browse hub and peer copies to support members. Sign in for the full desk experience.",
        }
      : {
          kicker: "Browse books",
          title: "Browse books",
          accent: "Together in one place.",
          body: inShell
            ? "Use the filters and search to focus on shelf copies, student sellers, or both. Free members use credits; Premium members borrow free."
            : "Browse hub and peer copies in one view. Sign in for checkout, requests, and purchases.",
        }
    : studentMode === "sell"
      ? hubDesk
        ? {
            kicker: "Consignment",
            title: "Peer shelf at your hub",
            accent: "Drop-offs & approvals.",
            body: inShell
              ? "Track listings that name your hub for drop-off. Members still own their listings—you facilitate shelf space and desk pickup."
              : "Consignment flows use your hub as the handoff point.",
          }
        : {
            kicker: "Sell",
            title: inShell ? "Your peer listings" : "List on the peer shelf",
            accent: inShell ? "Only books you’ve listed appear here." : "One copy, campus pickup.",
            body: inShell
              ? "Publish a listing, submit drop-off at a hub, and track status until it sells. Use List a book to add another title."
              : "Set a fair price, drop the book at your hub for approval, and buyers collect it from the desk when it’s ready.",
          }
      : {
          kicker: "Discover",
          title: "Peer shelf",
          accent: "browse every listing.",
          body: "Explore listings without signing in. Listing, drop-off, and purchase need an account (buying also needs Premium after the hub approves the copy).",
        };

  const showListCta = studentMode === "sell" || !studentMode;

  return (
    <>
      <LocationDiscoveryDialog
        open={isLocationDiscoveryOpen}
        onOpenChange={setLocationDiscoveryOpen}
        token={token}
      />
      <div
        className={cn(
          "min-h-[calc(100dvh-3.5rem)] pb-12",
          studentShellFlat ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" : "",
        )}
      >
        <div
          className={cn(
            "mx-auto w-full",
            inShell && !studentShellFlat ? "" : PORTAL_PAGE_CONTAINER,
          )}
        >
          <div
            className={cn(
              "flex flex-col items-start justify-between gap-4 sm:gap-6 md:flex-row md:items-end",
              hubDeskBrowse
                ? "mb-4"
                : inShell && (!hubDesk || isBrowseMode)
                  ? "mb-4 sm:mb-6 border-b border-border pb-4"
                  : "mb-4 sm:mb-6",
            )}
          >
            <div>
              {hubDeskBrowse ? (
                <>
                  <div className="flex items-center gap-3">
                    <div>
                      <h1 className="mt-1 font-display text-lg font-bold tracking-tight text-foreground">
                        {isSuperAdmin && inShell
                          ? "All copies"
                          : isSuperAdmin
                            ? "Hub & peer catalog"
                            : "Hub catalog"}
                      </h1>
                    </div>
                  </div>
                  {isSuperAdmin && inShell ? (
                    <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                      The separate hub+peer grid is for hub staff and students. Your desk view for
                      every physical copy:{" "}
                      <Link
                        href={SUPER_ADMIN_INVENTORY_PATH}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        All copies
                      </Link>
                      .
                    </p>
                  ) : isSuperAdmin ? (
                    <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                      Hubs and peer listings in one grid. Physical stock:{" "}
                      <Link
                        href={portalPaths.inventory}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        All copies
                      </Link>
                      .
                    </p>
                  ) : (
                    <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                      Your on-shelf stock and hub-owned rows are in{" "}
                      <Link
                        href={portalPaths.inventory}
                        className="font-medium text-foreground underline-offset-2 hover:underline"
                      >
                        All copies
                      </Link>
                      .
                    </p>
                  )}
                </>
              ) : inShell && !hubDesk ? (
                <>
                  <div className="flex items-center gap-3 font-sans">
                    <div>
                      <h1 className="mt-1 h3-scale font-bold tracking-tight text-foreground text-balance">
                        {isBrowseMode
                          ? "Browse books"
                          : studentMode === "sell"
                            ? "Sell"
                            : hero.title}
                      </h1>
                    </div>
                  </div>
                </>
              ) : (
                <div className="font-sans">
                  <p className="section-kicker section-kicker">{hero.kicker}</p>
                  <div className="mt-4 flex items-center gap-4">
                    <h1 className="h3-scale font-bold tracking-tight text-foreground sm:h1-scale sm:font-extrabold whitespace-nowrap overflow-hidden text-ellipsis">
                      {hero.title}{" "}
                      <span className="border-b-2 border-primary pb-0.5">{hero.accent}</span>
                    </h1>
                  </div>
                  <p
                    className={cn(
                      "mt-3 sm:mt-4 leading-relaxed text-foreground-muted",
                      isBrowseMode && !hubDesk && !inShell
                        ? "max-w-full body-scale sm:text-base"
                        : "max-w-xl body-scale sm:text-base",
                    )}
                  >
                    {hero.body}{" "}
                    {isBrowseMode && inShell && (
                      <>
                        <Link
                          href={portalPaths.sell}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          Selling instead?
                        </Link>
                      </>
                    )}
                    {studentMode === "sell" && inShell && (
                      <>
                        <Link
                          href={portalPaths.borrow}
                          className="font-semibold text-primary underline-offset-4 hover:underline"
                        >
                          Browse books
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {user && showListCta ? (
                <>
                  <Button
                    className={cn("h-12 px-8", studentShellFlat ? "rounded-xl" : "")}
                    disabled={!canList}
                    onClick={() => {
                      if (!canList) {
                        toast.message("Premium required to list.");
                        return;
                      }
                      setListOpen(true);
                    }}
                  >
                    List a book
                  </Button>
                  <Dialog
                    open={listOpen}
                    onOpenChange={(open) => {
                      setListOpen(open);
                      if (!open) {
                        setNewListHubId("");
                        setNewCoverPreview((prev) => {
                          if (prev) URL.revokeObjectURL(prev);
                          return null;
                        });
                        setNewCoverFile(null);
                      } else if (hubsQ.data?.hubs[0]?.id) {
                        setNewListHubId(hubsQ.data.hubs[0].id);
                      }
                    }}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="font-display text-xl font-bold tracking-tight">
                          New listing
                        </DialogTitle>
                        <DialogDescription>
                          Choose the campus hub, then add a title, a <strong>buy</strong> price and
                          an optional <strong>borrow</strong> fee (whole credits; borrow may be 0
                          credits for sell-only copies).
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label>Hub</Label>
                          <Select
                            value={newListHubId || undefined}
                            onValueChange={setNewListHubId}
                            disabled={!hubsQ.data?.hubs.length}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={hubsQ.isLoading ? "Loading hubs…" : "Choose hub"}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {(hubsQ.data?.hubs ?? []).map((h) => (
                                <SelectItem key={h.id} value={h.id}>
                                  {`${h.name} · ${hubKindLabel(h.kind)}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Buy price (Credits)</Label>
                          <Input
                            inputMode="numeric"
                            min={1}
                            placeholder="e.g. 499"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value.replace(/[^\d]/g, ""))}
                          />
                          {!newListingPriceValid && newPrice.trim() !== "" && (
                            <p className="text-xs text-destructive">
                              Enter a whole number of 1 or more.
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Borrow fee (Credits)</Label>
                          <Input
                            inputMode="numeric"
                            min={0}
                            placeholder="e.g. 79 or 0"
                            value={newBorrowPrice}
                            onChange={(e) =>
                              setNewBorrowPrice(e.target.value.replace(/[^\d]/g, ""))
                            }
                          />
                          {!newListingBorrowValid && newBorrowPrice.trim() !== "" && (
                            <p className="text-xs text-destructive">
                              Enter a whole number 0 or more.
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <ImagePlus className="h-4 w-4" aria-hidden />
                            Book photo (optional)
                          </Label>
                          <Input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="cursor-pointer"
                            onChange={(e) => {
                              const f = e.target.files?.[0] ?? null;
                              setNewCoverPreview((prev) => {
                                if (prev) URL.revokeObjectURL(prev);
                                return f ? URL.createObjectURL(f) : null;
                              });
                              setNewCoverFile(f);
                              e.target.value = "";
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            JPEG, PNG, WebP, or GIF · up to 5&nbsp;MB
                          </p>
                          <BookCoverImage
                            src={newCoverPreview}
                            alt={newCoverPreview ? "Cover preview" : "Default book cover"}
                            className={cn(
                              STUDENT_CARD_SURFACE,
                              "mt-2 max-h-40 w-28 object-cover",
                              !newCoverPreview && "opacity-80",
                            )}
                          />
                        </div>
                        <Button
                          className={cn("w-full", studentShellFlat ? "rounded-xl" : "")}
                          disabled={
                            !newTitle.trim() ||
                            !newListingPriceValid ||
                            !newListingBorrowValid ||
                            createListing.isPending
                          }
                          onClick={() => createListing.mutate()}
                        >
                          Publish listing
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              ) : null}
            </div>
          </div>

          {isBrowseMode && hubBooksEnabled && hubBooksQ.isError && (
            <p className="mb-6 text-sm text-destructive">
              Couldn’t load hub catalog. Check the API and try again.
            </p>
          )}

          {peerListingsError && (
            <div className="mb-8 flex flex-col gap-4 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="body-scale font-semibold text-foreground">
                    Couldn’t load peer listings
                  </p>
                  <p className="mt-1 body-scale font-normal leading-normal text-foreground-muted">
                    Check that the API is running and{" "}
                    <code className="rounded bg-shimmer px-1">/api/p2p/listings</code> is reachable.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className={cn("shrink-0", studentShellFlat ? "rounded-xl" : "")}
                onClick={() => void listingsQ.refetch()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          )}

          <div
            className={cn(
              "mb-8 border-b border-border pb-6",
              hubDesk && isBrowseMode && inShell && "mb-6 border-b border-border pb-5",
            )}
          >
            {isBrowseMode && !superAdminShellBrowse ? (
              <>
                <div
                  className={cn(
                    "flex w-full items-end gap-2 min-w-0",
                    hubDesk && isBrowseMode && inShell && "flex-nowrap",
                  )}
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Label
                      className={cn(
                        "caption-scale text-muted-foreground",
                        hubDesk &&
                          isBrowseMode &&
                          inShell &&
                          "font-bold uppercase tracking-wide text-foreground",
                      )}
                    >
                      Search
                    </Label>
                    {hubDesk && isBrowseMode && inShell ? (
                      <div className="mt-1.5 flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm">
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search titles…"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="min-w-0 flex-1 border-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                          aria-label="Search catalog titles"
                        />
                      </div>
                    ) : (
                      <div
                        className={cn(
                          studentShellBrowse
                            ? "mt-1.5 flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3"
                            : studentShellFlat
                              ? "mt-1.5 flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3"
                              : "mt-1 flex h-10 items-center gap-2 rounded-xl border border-border bg-background/90 px-3 shadow-sm transition-[box-shadow] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary sm:h-10 sm:px-4",
                        )}
                      >
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground sm:h-[1.125rem] sm:w-[1.125rem]" />
                        <input
                          type="text"
                          placeholder="Search titles…"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="min-w-0 flex-1 border-none bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-base"
                          aria-label="Search catalog titles"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex w-[72px] shrink flex-col sm:w-[90px] md:w-[100px]">
                    <Label
                      className={cn(
                        "caption-scale text-muted-foreground",
                        hubDesk &&
                          isBrowseMode &&
                          inShell &&
                          "font-bold uppercase tracking-wide text-foreground",
                      )}
                    >
                      {hubDesk ? "Source" : "Catalog"}
                    </Label>

                    <Select
                      value={sourceFilter}
                      onValueChange={(v) => setSourceFilter(v as "all" | "hub" | "peers")}
                    >
                      <SelectTrigger
                        className={cn(
                          "mt-1 w-full shrink-0",
                          hubDesk && isBrowseMode && inShell
                            ? "h-10 rounded-xl border-border bg-background px-2 text-xs"
                            : studentShellBrowse
                              ? "h-10 rounded-xl border border-border text-primary bg-background px-2 text-xs"
                              : "h-10 rounded-xl border border-border bg-background/80 px-2 text-xs sm:h-10",
                        )}
                        aria-label={hubDesk ? "Browse source" : "Catalog source"}
                      >
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent className="rounded-3xl border border-border p-2">
                        <SelectItem
                          value="all"
                          className="rounded-xl border border-transparent hover:border-border focus:border-border"
                        >
                          All
                        </SelectItem>

                        <SelectItem
                          value="peer"
                          className="      rounded-xl
      border border-transparent
      hover:border-border
      focus:border-border
      data-[highlighted]:border-border
      data-[state=checked]:border-border
    "
                        >
                          Peer
                        </SelectItem>

                        <SelectItem
                          value="hub"
                          className="rounded-xl border border-transparent hover:border-border focus:border-border"
                        >
                          Hub
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {user && (
                    <div
                      className={cn(
                        "flex w-[52px] shrink flex-col sm:w-auto",
                        hubDesk && isBrowseMode && inShell
                          ? "md:max-w-[12rem] md:justify-self-end"
                          : "md:w-auto",
                      )}
                    >
                      <Label
                        className={cn(
                          "caption-scale text-muted-foreground",
                          hubDesk &&
                            isBrowseMode &&
                            inShell &&
                            "font-bold uppercase tracking-wide text-foreground",
                        )}
                      >
                        Request
                      </Label>

                      <div className="mt-1.5 sm:mt-1">
                        <RequestBookSection
                          token={token!}
                          user={user}
                          onDone={() => {
                            void qc.invalidateQueries({ queryKey: ["book-requests"] });
                            void qc.invalidateQueries({
                              queryKey: ["notifications", "mine"],
                            });
                          }}
                          trigger={
                            <Button
                              type="button"
                              variant="secondary"
                              size="default"
                              className={cn(
                                "w-full min-w-0 gap-1 px-0 sm:px-4 shrink",
                                hubDesk && isBrowseMode && inShell
                                  ? "h-10 rounded-xl border border-border  px-4 text-sm hover:"
                                  : studentShellBrowse
                                    ? "h-10 rounded-xl border border-border  px-4 text-sm hover:"
                                    : studentShellFlat
                                      ? "h-10 rounded-xl border border-border  px-4 text-sm hover:"
                                      : "h-10 rounded-xl border border-border  px-4 text-sm shadow-sm hover: sm:h-10 sm:min-w-[10.5rem] sm:px-5",
                              )}
                            >
                              <BookMarked className="h-4 w-4 text-primary" />
                              <span className="truncate caption-scale text-primary sm:text-sm">
                                Request a book
                              </span>
                              <span className="text-primary sr-only sm:hidden">Request a book</span>
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
                {hubDesk && !inShell ? (
                  <p className="mt-2 max-w-xl caption-scale leading-relaxed text-muted-foreground">
                    Your managed shelf is in Inventory; this catalog shows peers and other campuses
                    for sourcing.
                  </p>
                ) : null}
              </>
            ) : isBrowseMode && superAdminShellBrowse ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Super admin desk: every physical copy (hub and peer) lives in one place. Open{" "}
                <Link
                  href={SUPER_ADMIN_INVENTORY_PATH}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  All copies
                </Link>
                . Use <span className="font-semibold text-foreground">Source</span> and filters
                there. This union grid is for hub operators and students; browse it signed out on
                the public site if needed.
              </p>
            ) : (
              <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end")}>
                <div className="flex min-w-0 flex-1 flex-col font-sans">
                  <Label className="caption-scale font-medium text-foreground-muted">Search</Label>
                  <div
                    className={cn(
                      studentShellBrowse
                        ? "flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3"
                        : studentShellFlat
                          ? "flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3"
                          : "flex h-10 items-center gap-2 border border-border bg-background px-3 shadow-sm transition-[box-shadow] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary sm:h-10 sm:px-4",
                    )}
                  >
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground sm:h-[1.125rem] sm:w-[1.125rem]" />
                    <input
                      type="search"
                      placeholder={
                        studentMode === "sell" && inShell
                          ? "Search your listings…"
                          : "Search title, author, or subject…"
                      }
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      list="student-search-suggestions"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className="min-w-0 flex-1 border-none bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-base"
                      aria-label={
                        studentMode === "sell" && inShell
                          ? "Search your listings"
                          : "Search listings"
                      }
                    />
                  </div>
                  <datalist id="student-search-suggestions">
                    {searchSuggestions.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  {studentShellBrowse && recentSearches.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {recentSearches.map((s) => (
                        <Button
                          key={`recent-${s}`}
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-xl border-border  px-2 caption-scale"
                          onClick={() => setSearch(s)}
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
                {studentMode === "sell" && inShell ? (
                  <div className="flex w-[92px] shrink-0 flex-col sm:w-[120px] font-sans">
                    <Label className="caption-scale font-medium text-foreground-muted">
                      Sold to
                    </Label>
                    <Select
                      value={soldToFilter}
                      onValueChange={(v) => setSoldToFilter(v as "all" | "peer" | "hub")}
                    >
                      <SelectTrigger className="mt-1 h-10 rounded-xl border border-border bg-background text-primary px-2.5 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-3xl border border-border p-2">
                        <SelectItem
                          value="all"
                          className="rounded-xl border border-transparent hover:border-border focus:border-border"
                        >
                          All
                        </SelectItem>

                        <SelectItem
                          value="peer"
                          className="      rounded-xl
      border border-transparent
      hover:border-border
      focus:border-border
      data-[highlighted]:border-border
      data-[state=checked]:border-border
    "
                        >
                          Peer
                        </SelectItem>

                        <SelectItem
                          value="hub"
                          className="rounded-xl border border-transparent hover:border-border focus:border-border"
                        >
                          Hub
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                {/* <div className="flex shrink-0 items-end font-sans">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border border-border bg-background shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary transition-[box-shadow]">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-5 rounded-xl bg-card border border-border" align="end" sideOffset={8}>
                      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-foreground">
                        <MapPin className="w-4 h-4 text-foreground" /> Current Location
                      </h3>
                      <div className="space-y-4">
                        {permissionDenied ? (
                          <div className="text-sm text-destructive bg-error-surface p-3 rounded-lg border border-error-border">
                            Location access denied. We cannot show nearby hubs.
                          </div>
                        ) : locLoading || hubsQ.isLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Fetching location...
                          </div>
                        ) : coords ? (
                          <>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Coordinates</p>
                              <p className="text-sm font-semibold text-foreground">
                                {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
                              </p>
                            </div>
                            <div className="pt-2 border-t border-border">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Nearby Hubs</p>
                              <div className="flex flex-col gap-2">
                                {nearbyHubs.length > 0 ? (
                                  nearbyHubs.map((h, i) => (
                                    <div key={h.id} className="flex justify-between text-sm font-medium text-foreground">
                                      <span className="line-clamp-1">{h.name}</span>
                                      <span className="text-muted-foreground text-xs font-medium shrink-0">{0.5 + i * 1.2} km</span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-sm text-muted-foreground">No hubs found nearby.</span>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground py-2">
                            Enable location to find the closest hubs for book exchange.
                          </div>
                        )}

                        <Button
                          variant="outline"
                          className="w-full text-sm font-semibold"
                          size="sm"
                          onClick={requestLocation}
                          disabled={locLoading}
                        >
                          {coords ? "Refresh Location" : "Enable Location"}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover> 
                </div> */}
              </div>
            )}
          </div>

          {isBrowseMode && !superAdminShellBrowse ? (
            browseLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-fr">
                  {browseRows.map((row) => {
                    if (row.kind === "hub") {
                      const b = row.book;
                      const canCheckout =
                        !!user &&
                        authorize(user, ACTIONS.CHECKOUT_BOOK, {
                          type: "book",
                          hubId: b.hubId,
                          bookId: b.id,
                        });
                      const isAvailable = b.status === "available";
                      const refShort = catalogRefLabel(b.refId ?? b.id, null);
                      function setActiveSegment(arg0: string) {
                        throw new Error("Function not implemented.");
                      }

                      function setAuthTab(arg0: string) {
                        throw new Error("Function not implemented.");
                      }

                      return (
                        <div
                          key={row.key}
                          className={cn(studentShellBrowse ? "flex min-w-0 flex-col gap-1.5" : "")}
                          data-book-id={b.id}
                          data-book-ref-id={b.refId ?? undefined}
                        >
                          {studentShellBrowse ? (
                            <div className="mb-2 space-y-1.5 px-1">
                              <div className="flex flex-col items-start gap-0.5">
                                <span className="caption-scale font-bold uppercase tracking-kicker text-muted-foreground">
                                  {b.source === "p2p" ? "From student" : "From hub"}
                                </span>
                              </div>
                            </div>
                          ) : null}
                          <CatalogBookCard
                            title={b.title}
                            coverUrl={
                              b.coverImageUrl ? apiPublicUrl(b.coverImageUrl) : b.coverImageUrl
                            }
                            hubName={hubNameBorrow(b.hubId)}
                            fromHubName={b.acquiredFromHubName ?? undefined}
                            refDisplay={refShort}
                            addedText={addedLabel(b.createdAt)}
                            addedAtTitle={
                              b.createdAt ? new Date(b.createdAt).toLocaleString() : undefined
                            }
                            fullIdForTitle={b.refId ?? b.id}
                            isSample={false}
                            shelfStatus={b.status}
                            sharpCover
                            hideBottomTitle
                            action={
                              <>
                                {!user && (
                                  <Button
                                    size="sm"
                                    className={cn(
                                      "w-full bg-primary text-primary-foreground hover:bg-primary/90",
                                      "min-w-0",
                                      studentShellFlat ? "rounded-xl" : "rounded-xl",
                                    )}
                                    onClick={() => {
                                      window.location.href =
                                        "/?segment=students&auth=login#auth-section";
                                    }}
                                  >
                                    <div className="flex min-w-0 items-center justify-center gap-2 px-2 text-center">
                                      <BookOpen className="h-4 w-4 shrink-0" />
                                      <span className="truncate sm:whitespace-nowrap">
                                        Sign in to borrow
                                      </span>
                                    </div>
                                  </Button>
                                )}
                                {user && token && !isAvailable && (
                                  <div className="space-y-2">
                                    <p className="text-left caption-scale text-muted-foreground">
                                      Why unavailable? {unavailableReason(b.status)}.
                                    </p>
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
                                          className={cn(
                                            "w-full border border-border  hover:",
                                            studentShellFlat ? "rounded-xl" : "rounded-xl",
                                          )}
                                        >
                                          Request from hub
                                        </Button>
                                      }
                                    />
                                  </div>
                                )}
                                {user && isAvailable && !canCheckout && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className={cn(
                                      "w-full",
                                      studentShellFlat ? "rounded-xl" : "rounded-xl",
                                    )}
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
                                {user && isAvailable && canCheckout && token && (
                                  <Button
                                    size="sm"
                                    className={cn(
                                      "w-full bg-primary text-primary-foreground hover:bg-primary/90",
                                      studentShellFlat ? "rounded-xl" : "rounded-xl",
                                    )}
                                    onClick={() => {
                                      pushRecentViewedTitle(b.title);
                                      persistRecentView({ bookId: b.id });
                                      setCheckout({
                                        item: {
                                          kind: "hub",
                                          bookId: b.id,
                                          title: b.title,
                                          hubName: hubNameBorrow(b.hubId),
                                          buyPrice: b.buyPrice ?? 0,
                                          borrowPrice: b.borrowPrice ?? 0,
                                        },
                                        initialMode: "borrow",
                                      });
                                    }}
                                  >
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Borrow or buy
                                  </Button>
                                )}
                              </>
                            }
                          />
                        </div>
                      );
                    }
                    const listing = row.listing;
                    const peerRefShort = catalogRefLabel(listing.id, null);
                    return (
                      <div
                        key={row.key}
                        className={cn(studentShellBrowse ? "flex min-w-0 flex-col gap-1.5" : "")}
                      >
                        {studentShellBrowse ? (
                          <div className="mb-2 space-y-1.5 px-1">
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="caption-scale font-bold uppercase tracking-kicker text-muted-foreground">
                                From student
                              </span>
                              <span
                                className="text-[10.5px] font-medium tracking-wide text-muted-foreground/70"
                                title={listing.id}
                              >
                                {peerRefShort}
                              </span>
                            </div>
                            <CopyLifecycleStrip status={peerStatusToLifecycle(listing.status)} />
                            <p className="text-[10.5px] text-muted-foreground/90">
                              Pickup hub:{" "}
                              <span className="font-medium text-foreground">
                                {hubsQ.data?.hubs.find(
                                  (h) => h.id === (listing.hubId ?? listing.dropoffHubId),
                                )?.name ?? "Hub"}
                              </span>
                            </p>
                          </div>
                        ) : null}
                        <MarketplacePeerCard
                          listing={listing}
                          onSelect={setSelected}
                          onViewed={(row) => persistRecentView({ listingId: row.id })}
                          hideBottomTitle
                        />
                      </div>
                    );
                  })}
                </div>
                <GridPagination
                  page={browsePage}
                  totalPages={browseTotalPages}
                  onPageChange={setBrowsePage}
                  label="Borrow and buy pagination"
                />
              </>
            )
          ) : !isBrowseMode ? (
            listingsQ.isLoading ? (
              <div className="flex justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              </div>
            ) : peerListingsError ? null : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-fr">
                  {peerGridRows.map((l) => (
                    <div
                      key={l.id}
                      className={cn(
                        studentMode === "sell" && inShell ? "flex min-w-0 flex-col gap-1" : "",
                      )}
                    >
                      {studentMode === "sell" && inShell ? (
                        <div className="mb-1 space-y-1 px-1">
                          <div className="flex flex-col items-start gap-0.5">
                            <span
                              className={cn(
                                "caption-scale font-bold uppercase tracking-kicker",
                                l.status === "available" || l.status === "approved"
                                  ? "text-secondary"
                                  : l.status === "pending_dropoff"
                                    ? "text-accent"
                                    : l.status === "listed"
                                      ? "text-primary"
                                      : l.status === "sold"
                                        ? "text-accent"
                                        : l.status === "rejected"
                                          ? "text-destructive"
                                          : "text-muted-foreground",
                              )}
                            >
                              {listingStatusLabel(l.status)}
                            </span>
                            <span className="text-[10.5px] font-medium tracking-wide text-muted-foreground/70">
                              {catalogRefLabel(l.id, null)}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-muted-foreground/90">
                            Pickup hub:{" "}
                            <span className="font-medium text-foreground">
                              {hubsQ.data?.hubs.find((h) => h.id === (l.dropoffHubId ?? l.hubId))
                                ?.name ?? "Not selected"}
                            </span>
                          </p>
                          <p className="text-[10.5px] text-accent/90">
                            Next step: {listingNextStep(l.status)}
                          </p>
                        </div>
                      ) : null}
                      <MarketplacePeerCard
                        listing={l}
                        onSelect={setSelected}
                        onViewed={(listing) => persistRecentView({ listingId: listing.id })}
                        hideBottomTitle
                      />
                    </div>
                  ))}
                </div>
                <GridPagination
                  page={peerGridPage}
                  totalPages={peerGridTotalPages}
                  onPageChange={setPeerGridPage}
                  label="Listings pagination"
                />
              </>
            )
          ) : null}

          {isBrowseMode &&
            !superAdminShellBrowse &&
            !browseLoading &&
            browseRowsFull.length === 0 &&
            !(hubBooksEnabled && hubBooksQ.isError) &&
            (!peerListingsError || sourceFilter === "hub") && (
              <div className="py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  {search.trim()
                    ? "No results. You can request this book from your hub."
                    : "Nothing in this view yet. Available hub copies and on-shelf peer listings appear first when they exist."}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Try: {searchSuggestions.slice(0, 3).join(" · ") || "popular titles"} .
                </p>
                {search.trim() && user && token && (
                  <div className="mt-6 flex justify-center">
                    <RequestBookSection
                      token={token}
                      user={user}
                      initialBookTitle={search.trim()}
                      redirectToActivityAfterSubmit
                      onDone={() => {
                        void qc.invalidateQueries({ queryKey: ["book-requests"] });
                        void qc.invalidateQueries({ queryKey: ["notifications", "mine"] });
                      }}
                      trigger={
                        <Button
                          type="button"
                          variant="secondary"
                          className={cn("px-6", studentShellFlat && "rounded-xl px-5")}
                        >
                          Request this book
                        </Button>
                      }
                    />
                  </div>
                )}
              </div>
            )}

          {!isBrowseMode &&
            !listingsQ.isLoading &&
            !peerListingsError &&
            peerShelfOrdered.length === 0 && (
              <div className="py-16 text-center">
                {studentMode === "sell" && inShell && !user ? (
                  <div
                    className={cn(
                      STUDENT_CARD_SURFACE,
                      "mx-auto max-w-md space-y-4 bg-card/90 p-8 text-muted-foreground",
                    )}
                  >
                    <div className="flex flex-col items-center justify-center gap-4 py-12">
                      <p className="text-sm">Sign in to see the books you&apos;re selling.</p>
                      <Button
                        onClick={() => {
                          const authSection = document.getElementById("auth-section");
                          if (authSection) {
                            authSection.scrollIntoView({ behavior: "smooth" });
                          } else {
                            window.location.href = "/";
                          }
                        }}
                      >
                        Sign in
                      </Button>
                    </div>
                  </div>
                ) : studentMode === "sell" && inShell && user ? (
                  <div
                    className={cn(
                      STUDENT_CARD_SURFACE,
                      "mx-auto max-w-md space-y-4 bg-card/90 p-8 text-muted-foreground",
                    )}
                  >
                    <p className="text-sm">
                      {search.trim()
                        ? "No listing matches your search."
                        : "You haven’t listed any books yet. Publish a copy to sell it through your hub."}
                    </p>
                    {canList && (
                      <Button
                        className={cn(studentShellFlat && "rounded-xl")}
                        onClick={() => setListOpen(true)}
                      >
                        List a book
                      </Button>
                    )}
                    {user && !isPremiumOk(user) && (
                      <p className="text-xs">Premium is required to create listings.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {search.trim()
                      ? "Not available — no peer listing matches your search."
                      : "No peer listings to show yet."}
                  </p>
                )}
              </div>
            )}
        </div>

        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent
            className={cn(
              "max-h-[min(95vh,720px)] w-[95vw] sm:w-full max-w-lg gap-0 overflow-hidden p-0 sm:rounded-xl",
              STUDENT_CARD_CHROME,
            )}
          >
            {selected && (
              <>
                <div className="border-b border-border px-4 sm:px-6 pb-4 sm:pb-5 pt-5 sm:pt-6">
                  <DialogHeader className="space-y-2 sm:space-y-3 text-left">
                    <DialogDescription className="sr-only">
                      Peer listing {selected.bookTitle}, buy{" "}
                      {selected.price.toLocaleString("en-IN")} Credits, borrow{" "}
                      {selected.borrowPrice.toLocaleString("en-IN")} Credits, status{" "}
                      {selected.status}.
                    </DialogDescription>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <DialogTitle className="font-display text-xl font-bold leading-snug tracking-tight md:text-2xl">
                        {selected.bookTitle}
                      </DialogTitle>
                      <ShelfPeerStatusBadge
                        status={selected.status}
                        className="shrink-0"
                        onCover={false}
                      />
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-foreground">
                      <div className="flex flex-wrap gap-x-6 gap-y-1">
                        <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                          Buy {selected.price.toLocaleString("en-IN")} Credits
                        </p>
                        <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground/90">
                          {user && isPremiumOk(user)
                            ? "Premium Member — Borrow Free"
                            : `Borrow ${selected.borrowPrice.toLocaleString("en-IN")} Credits`}
                        </p>
                      </div>
                      <p className="text-muted-foreground">Peer-to-peer · campus hub pickup</p>
                      {(selected.hubId ?? selected.dropoffHubId) && hubsQ.data && (
                        <p className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                          <span>
                            {hubsQ.data.hubs.find(
                              (h) => h.id === (selected.hubId ?? selected.dropoffHubId),
                            )?.name ?? "Hub"}
                          </span>
                        </p>
                      )}
                    </div>
                  </DialogHeader>
                </div>

                <div className="max-h-[calc(min(95vh,720px)-8.5rem)] overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
                  <div className="space-y-5 sm:space-y-6">
                    <div className="flex justify-center">
                      <BookCoverImage
                        src={
                          editCoverPreview
                            ? editCoverPreview
                            : editClearCover
                              ? null // BookCoverImage handles placeholder if src is null
                              : selected.coverImageUrl
                                ? apiPublicUrl(selected.coverImageUrl)
                                : null
                        }
                        alt={selected.bookTitle}
                        className={cn(
                          STUDENT_CARD_SURFACE,
                          "h-40 w-28 sm:h-52 sm:w-36 object-cover shadow-sm",
                        )}
                      />
                    </div>

                    {isDemoListingId(selected.id) && (
                      <p className="border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-foreground">
                        <span className="font-semibold text-foreground">Sample listing.</span>{" "}
                        Preview only — sign in and list a book (or use a seeded API) for real peer
                        copies.
                      </p>
                    )}

                    {user &&
                      !isDemoListingId(selected.id) &&
                      selected.ownerId === user.userId &&
                      (selected.status === "listed" || selected.status === "pending_dropoff") && (
                        <div
                          className={cn(
                            "space-y-4 rounded-xl border border-border bg-card/60 p-4 shadow-sm",
                          )}
                        >
                          <div>
                            <p className="section-kicker">Your listing</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Edit or delete until the hub approves the copy.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-listing-title">Title</Label>
                            <Input
                              id="edit-listing-title"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-listing-price">Buy price (Credits)</Label>
                            <Input
                              id="edit-listing-price"
                              inputMode="numeric"
                              min={1}
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value.replace(/[^\d]/g, ""))}
                              className="h-11 tabular-nums"
                            />
                            {!editListingPriceValid && editPrice.trim() !== "" && (
                              <p className="text-xs text-destructive">
                                Enter a whole number of 1 or more.
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-listing-borrow">Borrow fee (Credits)</Label>
                            <Input
                              id="edit-listing-borrow"
                              inputMode="numeric"
                              min={0}
                              value={editBorrowPrice}
                              onChange={(e) =>
                                setEditBorrowPrice(e.target.value.replace(/[^\d]/g, ""))
                              }
                              className="h-11 tabular-nums"
                            />
                            {!editListingBorrowValid && editBorrowPrice.trim() !== "" && (
                              <p className="text-xs text-destructive">
                                Enter a whole number 0 or more.
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="edit-listing-cover"
                              className="flex items-center gap-2 text-foreground"
                            >
                              <ImagePlus className="h-4 w-4 text-muted-foreground" aria-hidden />
                              Cover photo
                            </Label>
                            <Input
                              id="edit-listing-cover"
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className={cn(
                                "h-11 cursor-pointer text-sm file:mr-3 file:border-0 file:bg-shimmer file:px-3 file:py-1.5 file:text-xs file:font-medium",
                                studentShellFlat ? "file:rounded-xl" : "file:rounded-xl",
                              )}
                              onChange={(e) => {
                                const f = e.target.files?.[0] ?? null;
                                setEditClearCover(false);
                                setEditCoverPreview((prev) => {
                                  if (prev) URL.revokeObjectURL(prev);
                                  return f ? URL.createObjectURL(f) : null;
                                });
                                setEditCoverFile(f);
                                e.target.value = "";
                              }}
                            />
                            <p className="text-xs text-muted-foreground">
                              JPEG, PNG, WebP, or GIF · up to 5&nbsp;MB
                            </p>
                            {(selected.coverImageUrl || editCoverPreview) && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 px-0 text-xs text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  setEditCoverPreview((prev) => {
                                    if (prev) URL.revokeObjectURL(prev);
                                    return null;
                                  });
                                  setEditCoverFile(null);
                                  setEditClearCover(true);
                                }}
                              >
                                Remove photo from listing
                              </Button>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
                            <Button
                              className={cn("sm:flex-1", studentShellFlat && "rounded-xl")}
                              disabled={
                                updateListing.isPending ||
                                !editTitle.trim() ||
                                !editListingPriceValid ||
                                !editListingBorrowValid
                              }
                              onClick={() => updateListing.mutate()}
                            >
                              Save changes
                            </Button>
                            <Button
                              variant="outline"
                              className={cn(
                                studentShellFlat
                                  ? "rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-1"
                                  : "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-1",
                              )}
                              disabled={deleteListing.isPending}
                              onClick={() => deleteListing.mutate(selected.id)}
                            >
                              Delete listing
                            </Button>
                          </div>
                        </div>
                      )}

                    {user &&
                      !isDemoListingId(selected.id) &&
                      selected.ownerId === user.userId &&
                      selected.status === "listed" &&
                      hubsQ.data && (
                        <div
                          className={cn(
                            "space-y-4 rounded-xl border border-border bg-card/40 p-4 shadow-sm",
                          )}
                        >
                          <div>
                            <p className="section-kicker">Drop-off</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Choose a hub desk so staff can verify your copy.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dropoff-hub">Hub</Label>
                            <Select value={dropHubId || undefined} onValueChange={setDropHubId}>
                              <SelectTrigger id="dropoff-hub" className="h-11">
                                <SelectValue placeholder="Choose hub" />
                              </SelectTrigger>
                              <SelectContent>
                                {hubsQ.data.hubs.map((h) => (
                                  <SelectItem key={h.id} value={h.id}>
                                    {`${h.name} · ${hubKindLabel(h.kind)}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            className={cn("h-11 w-full", studentShellFlat ? "rounded-xl" : "")}
                            disabled={!dropHubId || submitDropoff.isPending}
                            onClick={() =>
                              submitDropoff.mutate({ id: selected.id, hubId: dropHubId })
                            }
                          >
                            Submit drop-off
                          </Button>
                        </div>
                      )}

                    {user &&
                      !isDemoListingId(selected.id) &&
                      selected.ownerId === user.userId &&
                      selected.status === "available" && (
                        <p className="rounded-xl border border-border  px-4 py-3 text-sm text-muted-foreground">
                          On shelf at the hub — other students can borrow or buy at your listed
                          rates. Editing is locked.
                        </p>
                      )}
                    {user &&
                      !isDemoListingId(selected.id) &&
                      selected.ownerId === user.userId &&
                      selected.status === "reserved" && (
                        <p className="rounded-xl border border-border  px-4 py-3 text-sm text-muted-foreground">
                          This copy is on loan. You&apos;ll get it back when the borrower returns it
                          at the hub.
                        </p>
                      )}
                    {user &&
                      !isDemoListingId(selected.id) &&
                      selected.ownerId === user.userId &&
                      selected.status === "sold" && (
                        <p className="rounded-xl border border-border  px-4 py-3 text-sm text-muted-foreground">
                          Sold — this listing is read-only.
                        </p>
                      )}

                    <Separator className="opacity-60" />

                    {(selected.status === "available" || selected.status === "approved") &&
                      !user &&
                      !isDemoListingId(selected.id) && (
                        <Button
                          className={cn("h-11 w-full", studentShellFlat ? "rounded-xl" : "")}
                          onClick={() => {
                            const authSection = document.getElementById("auth-section");
                            if (authSection) {
                              authSection.scrollIntoView({ behavior: "smooth" });
                            } else {
                              window.location.href = "/";
                            }
                          }}
                        >
                          Sign in to borrow or buy · Buy {selected.price.toLocaleString("en-IN")}{" "}
                          Credits · Borrow
                          {selected.borrowPrice.toLocaleString("en-IN")} Credits
                        </Button>
                      )}

                    {selected.status === "available" && !user && isDemoListingId(selected.id) && (
                      <Button
                        className={cn(
                          "h-11 w-full bg-secondary text-primary-foreground hover:bg-secondary",
                          studentShellFlat ? "rounded-xl" : "",
                        )}
                        onClick={() => {
                          const authSection = document.getElementById("auth-section");
                          if (authSection) {
                            authSection.scrollIntoView({ behavior: "smooth" });
                          } else {
                            window.location.href = "/";
                          }
                        }}
                      >
                        Sign in to borrow or buy (Demo)
                      </Button>
                    )}

                    {user &&
                      !isDemoListingId(selected.id) &&
                      selected.borrowerUserId === user.userId &&
                      selected.status === "reserved" && (
                        <Button
                          className={cn("h-11 w-full", studentShellFlat ? "rounded-xl" : "")}
                          disabled={returnPeerBorrow.isPending}
                          onClick={() => returnPeerBorrow.mutate(selected.id)}
                        >
                          Return peer borrow
                        </Button>
                      )}

                    {user &&
                      token &&
                      !isDemoListingId(selected.id) &&
                      selected.ownerId !== user.userId &&
                      authorize(user, ACTIONS.BUY_P2P, {
                        type: "p2p_listing",
                        listingId: selected.id,
                        ownerId: selected.ownerId,
                        hubId: selected.hubId ?? selected.dropoffHubId,
                        dropoffHubId: selected.dropoffHubId,
                      }) &&
                      selected.status === "available" && (
                        <div className="flex flex-col gap-2">
                          {(selected.type ?? "sell") === "rent" && (
                            <Button
                              className={cn("h-11 w-full", studentShellFlat ? "rounded-xl" : "")}
                              onClick={() => openPeerCheckout(selected, "borrow")}
                            >
                              {isPremiumOk(user)
                                ? "Premium Member — Borrow Free"
                                : `Borrow for ${selected.borrowPrice.toLocaleString("en-IN")} Credits`}
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            className={cn(
                              "h-11 w-full border border-border",
                              studentShellFlat ? "rounded-xl" : "",
                            )}
                            onClick={() => openPeerCheckout(selected, "buy")}
                          >
                            Buy for {selected.price.toLocaleString("en-IN")} Credits
                          </Button>
                        </div>
                      )}

                    {user &&
                      !isDemoListingId(selected.id) &&
                      selected.ownerId !== user.userId &&
                      selected.status !== "sold" &&
                      selected.status !== "available" && (
                        <Button
                          className={cn("h-11 w-full", studentShellFlat ? "rounded-xl" : "")}
                          variant="secondary"
                          disabled
                        >
                          Buy unavailable — the hub must verify drop-off first
                        </Button>
                      )}

                    {!isDemoListingId(selected.id) &&
                      selected.status !== "available" &&
                      selected.status !== "sold" &&
                      selected.status !== "reserved" &&
                      (!user || selected.ownerId === user.userId) && (
                        <p className="text-center text-xs leading-relaxed text-muted-foreground">
                          Buyers can purchase only after the hub desk approves drop-off (status
                          becomes &quot;available&quot; on the shelf).
                        </p>
                      )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {token ? (
          <CheckoutFlowDialog
            open={!!checkout}
            onOpenChange={(o) => !o && setCheckout(null)}
            item={checkout?.item ?? null}
            initialMode={checkout?.initialMode}
            token={token}
            onComplete={invalidateCheckoutQueries}
            deskAcquireHubs={deskAcquireHubs ?? undefined}
          />
        ) : null}
      </div>
    </>
  );
}
