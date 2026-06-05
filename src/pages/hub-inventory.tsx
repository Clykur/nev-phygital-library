import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudentShell } from "@/components/layout/StudentAppShell";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError, apiPublicUrl } from "@/lib/api";
import { userFacingErrorMessage } from "@/lib/error-messages";
import { BookCoverImage } from "@/components/ui/book-cover-image";
import { portalPathsForUser } from "@/lib/app-paths";
import { hubKindLabel } from "@/lib/hub-display";
import {
  PORTAL_INLINE_LINK,
  PORTAL_KICKER_COLOR,
  PORTAL_PAGE_GUTTER_X,
  STUDENT_CARD_SURFACE,
} from "@/lib/student-ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check, ChevronsUpDown, ImagePlus, Loader2, Plus, Shield } from "lucide-react";
import { shelfFilterChipClass, shelfFilterChipOnDarkClass } from "@/lib/status-badges";
import { Link } from "wouter";
import { CatalogBookCard, addedLabel, catalogRefLabel } from "@/pages/library";

type Hub = { id: string; name: string; kind?: string };

type HubBookRow = {
  id: string;
  refId?: string | null;
  title: string;
  hubId: string;
  coverImageUrl?: string | null;
  status: string;
  condition: string;
  source: string;
  buyPrice: number;
  borrowPrice: number;
  borrowerUserId: string | null;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  acquiredFromHubId?: string | null;
  acquiredFromHubName?: string | null;
  targetHubId?: string | null;
  originalHubId?: string | null;
  targetHubName?: string | null;
  originalHubName?: string | null;
  request?: {
    id: string;
    assignmentVerified: boolean;
    assignedAt: string | null;
    assignedBy: string | null;
  } | null;
  inventoryStats?: {
    total: number;
    available: number;
    issued: number;
    reserved: number;
  };
};

const PAGE_SIZE = 50;

/** One border, flat panel — matches book requests & overview. */
const outline = "rounded-md border border-border bg-background";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="section-kicker">{children}</h2>
  );
}

function CopyLifecycleStrip({ status }: { status: string }) {
  if (["sold", "unavailable", "transfer_pending", "in_transit"].includes(status)) {
    return (
      <p className="section-kicker">
        Lifecycle: {status.replace(/_/g, " ")}
      </p>
    );
  }
  const idx =
    status === "available" ? 0 : status === "reserved" ? 1 : status === "checked_out" ? 2 : 0;
  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      title="On shelf → set aside (reserved) → out on loan. Returns are tracked in activity."
    >
      {["Available", "Set aside (reserved)", "Out (on loan)"].map((label, i) => (
        <span key={label} className="flex items-center gap-1.5">
          {i > 0 ? <span className="caption-scale text-foreground-subtle">→</span> : null}
          <span
            className={cn(
              "max-w-[10rem] truncate rounded px-1 py-0.5 caption-scale font-medium",
              i < idx
                ? "text-success/80"
                : i === idx
                  ? "bg-primary/15 text-foreground"
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

function InventoryPaginationBar({
  page,
  totalPages,
  onPrev,
  onNext,
  placement,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  /** `header` = top of list, `footer` = below grid (same controls, distinct aria label) */
  placement: "header" | "footer";
}) {
  const label = placement === "header" ? "Page through inventory" : "Page through inventory (footer)";
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 sm:justify-end"
      role="navigation"
      aria-label={label}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-md"
        disabled={page <= 0}
        onClick={onPrev}
      >
        Previous
      </Button>
      <span className="min-w-[6.5rem] text-center caption-scale font-medium tabular-nums text-foreground-muted" aria-current="page">
        Page {page + 1} / {totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-md"
        disabled={page + 1 >= totalPages}
        onClick={onNext}
      >
        Next
      </Button>
    </div>
  );
}

function sourceLabel(source: string) {
  if (source === "hub_inventory") return "Hub stock";
  if (source === "p2p") return "Student consignment (on shelf)";
  return source;
}

export default function HubInventoryPage() {
  const { token, user, loading } = useAuth();
  const inShell = useStudentShell();
  const isSuperAdmin = user?.baseRole === "super_admin";
  const deskPaths = useMemo(
    () => (user && user.hubStaffHubIds.length ? portalPathsForUser(user) : null),
    [user],
  );
  const qc = useQueryClient();
  const [hubId, setHubId] = useState<string>("all");
  const [source, setSource] = useState<"all" | "hub_inventory" | "p2p">("all");
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const [addOpen, setAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addBuy, setAddBuy] = useState("399");
  const [addBorrow, setAddBorrow] = useState("49");
  const [addCoverFile, setAddCoverFile] = useState<File | null>(null);
  const [addCoverPreview, setAddCoverPreview] = useState<string | null>(null);
  const [addTargetHubId, setAddTargetHubId] = useState<string>("");
  const [addHubPickerOpen, setAddHubPickerOpen] = useState(false);

  const addBuyParsed = Number.parseInt(addBuy, 10);
  const addBorrowParsed = Number.parseInt(addBorrow, 10);
  const addBuyValid = Number.isFinite(addBuyParsed) && addBuyParsed >= 0;
  const addBorrowValid = Number.isFinite(addBorrowParsed) && addBorrowParsed >= 0;

  const inventoryUrlFiltersAppliedRef = useRef(false);

  useEffect(() => {
    if (!user?.hubStaffHubIds.length || inventoryUrlFiltersAppliedRef.current) return;
    inventoryUrlFiltersAppliedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const hid = params.get("hubId");
    const hasQ = params.has("q");
    const qq = params.get("q");
    if (hid && user.hubStaffHubIds.includes(hid)) {
      setHubId(hid);
    }
    if (hasQ) {
      setQ(qq ?? "");
    }
    if (hid || hasQ) {
      setSource("all");
      setStatus("all");
      setPage(0);
    }
    if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [user?.hubStaffHubIds]);

  const clearInventoryFilters = () => {
    if (user && user.hubStaffHubIds.length > 1) {
      setHubId("all");
    }
    setSource("all");
    setStatus("all");
    setQ("");
    setPage(0);
  };

  useEffect(() => {
    if (!addOpen || !user?.hubStaffHubIds.length) return;
    const preferred =
      hubId !== "all" && user.hubStaffHubIds.includes(hubId) ? hubId : user.hubStaffHubIds[0]!;
    setAddTargetHubId(preferred);
  }, [addOpen, hubId, user?.hubStaffHubIds]);

  const markTransferInTransit = useMutation({
    mutationFn: async (bookId: string) => {
      await apiFetch(`/api/hub/books/${bookId}/transfer/mark-in-transit`, {
        method: "POST",
        token: token!,
      });
    },
    onSuccess: () => {
      toast.success("Marked in transit.");
      void qc.invalidateQueries({ queryKey: ["hub", "books"] });
      void qc.invalidateQueries({ queryKey: ["hub", "overview"] });
      void qc.invalidateQueries({ queryKey: ["book-requests", "hub"] });
      void qc.invalidateQueries({ queryKey: ["catalog", "books"] });
      void qc.invalidateQueries({ queryKey: ["activity", "timeline"] });
    },
    onError: (e) => toast.error(userFacingErrorMessage(e)),
  });

  const markTransferReceived = useMutation({
    mutationFn: async (bookId: string) => {
      await apiFetch(`/api/hub/books/${bookId}/transfer/mark-received`, {
        method: "POST",
        token: token!,
      });
    },
    onSuccess: () => {
      toast.success("Marked received — copy is now on shelf at your hub.");
      void qc.invalidateQueries({ queryKey: ["hub", "books"] });
      void qc.invalidateQueries({ queryKey: ["hub", "overview"] });
      void qc.invalidateQueries({ queryKey: ["book-requests", "hub"] });
      void qc.invalidateQueries({ queryKey: ["catalog", "books"] });
      void qc.invalidateQueries({ queryKey: ["activity", "timeline"] });
    },
    onError: (e) => toast.error(userFacingErrorMessage(e)),
  });

  const adminForceRelease = useMutation({
    mutationFn: async (bookId: string) => {
      await apiFetch(`/api/admin/books/${bookId}/force-release-reserved`, {
        method: "POST",
        token: token!,
        body: JSON.stringify({ confirm: true }),
      });
    },
    onSuccess: () => {
      toast.success("Released reserved copy (audit log updated).");
      void qc.invalidateQueries({ queryKey: ["hub", "books"] });
      void qc.invalidateQueries({ queryKey: ["book-requests", "hub"] });
      void qc.invalidateQueries({ queryKey: ["hub", "overview"] });
    },
    onError: (e) => toast.error(userFacingErrorMessage(e)),
  });

  const markCopyUnavailable = useMutation({
    mutationFn: async (bookId: string) => {
      return apiFetch<{ ok: boolean }>(`/api/books/${bookId}`, {
        method: "PATCH",
        token: token!,
        body: JSON.stringify({ status: "unavailable" }),
      });
    },
    onSuccess: () => {
      toast.success("Copy marked unavailable (member notifications if a reservation existed).");
      void qc.invalidateQueries({ queryKey: ["hub", "books"] });
      void qc.invalidateQueries({ queryKey: ["book-requests", "hub"] });
      void qc.invalidateQueries({ queryKey: ["hub", "overview"] });
    },
    onError: (e) => toast.error(userFacingErrorMessage(e)),
  });

  const markCopyAvailable = useMutation({
    mutationFn: async (bookId: string) => {
      return apiFetch(`/api/books/${bookId}`, {
        method: "PATCH",
        token: token!,
        body: JSON.stringify({ status: "available" }),
      });
    },
    onSuccess: () => {
      toast.success("Copy marked available.");
      void qc.invalidateQueries({ queryKey: ["hub", "books"] });
      void qc.invalidateQueries({ queryKey: ["hub", "overview"] });
      void qc.invalidateQueries({ queryKey: ["book-requests", "hub"] });
    },
    onError: (e) =>
      toast.error(userFacingErrorMessage(e)),
  });

  const convertP2pToHub = useMutation({
    mutationFn: async (bookId: string) => {
      return apiFetch<{ ok: boolean }>(`/api/hub/books/${bookId}/acquire-peer-ownership`, {
        method: "POST",
        token: token!,
      });
    },
    onSuccess: () => {
      toast.success("Copy is now hub-owned inventory.");
      void qc.invalidateQueries({ queryKey: ["hub", "books"] });
      void qc.invalidateQueries({ queryKey: ["hub", "overview"] });
    },
    onError: (e) => toast.error(userFacingErrorMessage(e)),
  });

  const addShelfCopy = useMutation({
    mutationFn: async () => {
      if (!addTitle.trim()) throw new Error("Enter a title.");
      if (!addTargetHubId) throw new Error("Pick a hub.");
      let coverImageUrl: string | undefined;
      if (addCoverFile) {
        const fd = new FormData();
        fd.append("image", addCoverFile);
        const promise = apiFetch<{ url: string }>("/api/uploads/book-cover", {
          method: "POST",
          token: token!,
          body: fd,
        });
        toast.promise(promise, {
          loading: "Uploading cover…",
          success: "Cover uploaded!",
          error: "Cover upload failed.",
        });
        const up = await promise;
        coverImageUrl = up.url;
      }
      const buyPrice = Number.parseInt(addBuy, 10);
      const borrowPrice = Number.parseInt(addBorrow, 10);
      await apiFetch("/api/hub/books", {
        method: "POST",
        token: token!,
        body: JSON.stringify({
          hubId: addTargetHubId,
          title: addTitle.trim(),
          buyPrice: Number.isFinite(buyPrice) ? Math.max(0, buyPrice) : 0,
          borrowPrice: Number.isFinite(borrowPrice) ? Math.max(0, borrowPrice) : 0,
          ...(coverImageUrl ? { coverImageUrl } : {}),
        }),
      });
    },
    onSuccess: async () => {
      toast.success("Shelf copy added.");
      setAddOpen(false);
      setAddTitle("");
      setAddCoverFile(null);
      setAddCoverPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      if (user && user.hubStaffHubIds.length > 1 && addTargetHubId) {
        setHubId(addTargetHubId);
      }
      setSource("all");
      setStatus("all");
      setQ("");
      setPage(0);
      // Hub books, overview, catalog, and hub-specific book requests are all stale.
      // By removing, we ensure a clean refetch without relying on staleness timers.
      void qc.removeQueries({ queryKey: ["hub", "books"] });
      void qc.removeQueries({ queryKey: ["hub", "overview"] });
      void qc.removeQueries({ queryKey: ["catalog"] });
      void qc.removeQueries({ queryKey: ["book-requests", "hub"] });

      try {
        const sweepBody = addTargetHubId ? { hubId: addTargetHubId } : {};
        const r = await apiFetch<{ processed: number; linked: number }>(
          "/api/hub/desk/sweep-assignments",
          {
            method: "POST",
            token: token!,
            body: JSON.stringify(sweepBody),
          },
        );
        if (r.linked > 0) {
          toast.message(`Linked ${r.linked} open request(s) to new availability.`);
        }
      } catch {
        /* sweep is best-effort */
      }
    },
    onError: (e) =>
      toast.error(userFacingErrorMessage(e)),
  });

  const topPad = inShell ? "" : "pt-24";

  const hubsQ = useQuery({
    queryKey: ["catalog", "hubs", "hub-inventory"],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: () => apiFetch<{ hubs: Hub[] }>("/api/catalog/hubs", { token: token! }),
  });

  const addDialogHubs = useMemo((): Hub[] => {
    if (!user?.hubStaffHubIds.length) return [];
    const list = hubsQ.data?.hubs ?? [];
    return user.hubStaffHubIds.map((id) => {
      const h = list.find((x) => x.id === id);
      return h ?? { id, name: `${id.slice(0, 8)}…` };
    });
  }, [user?.hubStaffHubIds, hubsQ.data?.hubs]);

  function addDialogHubLabel(id: string) {
    const h = addDialogHubs.find((x) => x.id === id);
    return h ? `${h.name} · ${hubKindLabel(h.kind)}` : `${id.slice(0, 8)}…`;
  }

  const overviewHubId =
    user && user.hubStaffHubIds.length === 1 ? user.hubStaffHubIds[0]! : hubId === "all" ? undefined : hubId;

  const booksUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(page * PAGE_SIZE));
    if (overviewHubId) params.set("hubId", overviewHubId);
    /** Super admin + “all hubs”: load every `books` row; hub pick overrides with `hubId` only. */
    if (isSuperAdmin && !overviewHubId) params.set("scope", "platform");
    if (source !== "all") params.set("source", source);
    if (status !== "all") params.set("status", status);
    const trimmed = q.trim();
    if (trimmed) params.set("q", trimmed);
    return `/api/hub/books?${params.toString()}`;
  }, [isSuperAdmin, overviewHubId, page, q, source, status]);

  const booksQ = useQuery({
    queryKey: ["hub", "books", booksUrl, token, overviewHubId ?? "all"],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: async () => {
      const data = await apiFetch<{ books: HubBookRow[]; total: number; limit: number; offset: number }>(
        booksUrl,
        { token: token! },
      );
      const sweepBody = overviewHubId ? { hubId: overviewHubId } : {};
      void (async () => {
        try {
          const r = await apiFetch<{ processed: number; linked: number }>(
            "/api/hub/desk/sweep-assignments",
            {
              method: "POST",
              token: token!,
              body: JSON.stringify(sweepBody),
            },
          );
          if (r.linked > 0) {
            void qc.invalidateQueries({ queryKey: ["hub", "books"] });
            void qc.invalidateQueries({ queryKey: ["book-requests", "hub"] });
            void qc.invalidateQueries({ queryKey: ["hub", "overview"] });
          }
        } catch {
          /* sweep is best-effort */
        }
      })();
      return data;
    },
  });

  if (loading) {
    return (
      <div className={cn("flex min-h-[50dvh] items-center justify-center", topPad)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user?.hubStaffHubIds.length) {
    return (
      <div className={cn("mx-auto max-w-lg pb-20 text-center", PORTAL_PAGE_GUTTER_X, inShell ? "pt-8" : "pt-28")}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center">
          <Shield className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="mt-6 font-serif text-2xl font-light tracking-tight">Inventory restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hub staff memberships unlock copy-level inventory for your location(s).
        </p>
        <Button asChild className="mt-8 rounded-full">
          <Link href={user ? portalPathsForUser(user).borrow : "/library"}>
            {user ? "Back to catalog" : "Browse catalog"}
          </Link>
        </Button>
      </div>
    );
  }

  const total = booksQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = booksQ.data?.books ?? [];

  const selectTriggerClass = "h-10 w-full text-primary rounded-md border-border bg-background";
  const inputClass = "h-10 w-full rounded-md border-border bg-background text-sm";

  return (
    <div className={cn(topPad, "pb-10 lg:pb-10")}>
      <div className="mb-6 border-b border-border pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 font-sans">
            <h1 className="mt-1 h3-scale font-bold tracking-tight text-foreground">Inventory</h1>
            {isSuperAdmin ? (
              <p className="mt-2 w-full body-scale text-foreground-muted leading-relaxed">
                Every row is a <span className="font-semibold text-foreground">physical copy</span> (hub stock or student
                consignment on shelf). P2P listings that are not a copy yet are not mixed in here; open{" "}
                {deskPaths ? (
                  <Link href={deskPaths.p2pListings} className={PORTAL_INLINE_LINK}>
                    P2P Listings
                  </Link>
                ) : (
                  <span className="font-semibold text-foreground">P2P Listings</span>
                )}{" "}
                for the pre–drop-off pipeline. Use <span className="font-semibold text-foreground">Scope</span>,{" "}
                <span className="font-semibold text-foreground">Source</span>, and{" "}
                <span className="font-semibold text-foreground">Status</span> to filter.
              </p>
            ) : (
              <p className="mt-2 w-full body-scale text-foreground-muted leading-relaxed">
                On-shelf and consigned physical copies for your managed hubs. Use{" "}
                <span className="font-semibold text-foreground">Source</span> to separate hub stock from student consignment
                on shelf. Pre–drop-off peer listings are under{" "}
                {deskPaths ? (
                  <Link href={deskPaths.p2pListings} className={PORTAL_INLINE_LINK}>
                    P2P Listings
                  </Link>
                ) : null}
                {deskPaths ? "." : "P2P Listings in the desk menu."}
              </p>
            )}
          </div>
          {!isSuperAdmin ? (
            <Button
              type="button"
              className="h-10 shrink-0 gap-1.5 self-start rounded-md sm:self-auto"
              onClick={() => {
                setAddTitle("");
                setAddBuy("399");
                setAddBorrow("49");
                setAddCoverFile(null);
                setAddCoverPreview((prev) => {
                  if (prev) URL.revokeObjectURL(prev);
                  return null;
                });
                setAddOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add shelf copy
            </Button>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-full sm:flex-[3] sm:min-w-[20rem] lg:min-w-[28rem]">
            <Label htmlFor="hub-inv-search" className="section-kicker">
              Search title or ref
            </Label>
            <Input
              id="hub-inv-search"
              className={inputClass}
              placeholder="Search title or ref"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
            />
          </div>
          {user.hubStaffHubIds.length > 1 ? (
            <div className="flex w-full flex-col gap-1.5 sm:min-w-[10rem] sm:shrink-0 sm:flex-1">
              <Label
                htmlFor="hub-inv-scope"
                className="section-kicker"
              >
                Scope
              </Label>
              <Select
                value={hubId}
                onValueChange={(v) => {
                  setHubId(v);
                  setPage(0);
                }}
              >
                <SelectTrigger id="hub-inv-scope" className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All managed hubs</SelectItem>
                  {user.hubStaffHubIds.map((id) => (
                    <SelectItem key={id} value={id}>
                      {hubsQ.data?.hubs.find((h) => h.id === id)?.name ?? id.slice(0, 8) + "…"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="flex min-w-[10rem] shrink-0 flex-1 flex-col gap-1.5">
            <Label htmlFor="hub-inv-source" className="section-kicker">
              Source
            </Label>
            <Select
              value={source}
              onValueChange={(v) => {
                setSource(v as typeof source);
                setPage(0);
              }}
            >
              <SelectTrigger id="hub-inv-source" className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="hub_inventory">Hub-owned</SelectItem>
                <SelectItem value="p2p">Peer consignment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-w-[10rem] shrink-0 flex-1 flex-col gap-1.5">
            <Label htmlFor="hub-inv-status" className="section-kicker">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(0);
              }}
            >
              <SelectTrigger id="hub-inv-status" className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="checked_out">Checked out</SelectItem>
                <SelectItem value="reserved">Set aside (reserved)</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full rounded-md sm:w-auto sm:min-w-[6.5rem]"
            onClick={clearInventoryFilters}
          >
            Reset filters
          </Button>
        </div>
      </div>

      <section className={cn(outline, "overflow-hidden")} aria-label="All copies list">
        {booksQ.isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />
          </div>
        ) : booksQ.isError ? (
          <p className="px-4 py-10 text-sm text-destructive">
            {booksQ.error instanceof ApiError ? booksQ.error.message : "Could not load inventory."}
          </p>
        ) : (
          <>
            <div className="border-b border-border px-4 py-3">
              <SectionLabel>Inventory</SectionLabel>
              <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <p className="caption-scale font-medium text-foreground-muted">
                  <span className="font-semibold text-foreground">{total}</span>{" "}
                  {total === 1 ? "copy" : "copies"} in this view
                  {isSuperAdmin && !overviewHubId
                    ? " · every hub"
                    : overviewHubId
                      ? ` · ${hubsQ.data?.hubs.find((h) => h.id === overviewHubId)?.name ?? "Hub"}`
                      : user.hubStaffHubIds.length > 1
                        ? " · all managed hubs in scope"
                        : ""}
                </p>
                <InventoryPaginationBar
                  placement="header"
                  page={page}
                  totalPages={totalPages}
                  onPrev={() => setPage((p) => Math.max(0, p - 1))}
                  onNext={() => setPage((p) => p + 1)}
                />
              </div>
            </div>
            {rows.length === 0 ? (
              <div className="px-4 py-12 text-center body-scale text-foreground-muted">
                <p>No copies match these filters.</p>
                {source !== "all" || status !== "all" || q.trim() !== "" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-3 rounded-md"
                    onClick={clearInventoryFilters}
                  >
                    Reset filters
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-2 items-start gap-3 p-3 sm:grid-cols-2 sm:items-stretch sm:gap-6 sm:p-6 md:grid-cols-3 lg:grid-cols-4">
                {rows.map((b) => {
                  const hubName =
                    hubsQ.data?.hubs.find((h) => h.id === b.hubId)?.name ?? "Managed hub";
                  const ownership =
                    b.source === "hub_inventory"
                      ? { label: "Hub stock", isHub: true as const }
                      : { label: "Student consignment (on shelf)", isHub: false as const };
                  const refShort = catalogRefLabel(b.refId ?? b.id, null);
                  const inInterHubTransfer =
                    b.status === "transfer_pending" || b.status === "in_transit";
                  const canMarkInTransit =
                    !!token &&
                    b.status === "transfer_pending" &&
                    !!user &&
                    user.hubStaffHubIds.includes(b.hubId) &&
                    (b.originalHubId == null || b.hubId === b.originalHubId);
                  const canMarkReceived =
                    !!token &&
                    b.status === "in_transit" &&
                    !!b.targetHubId &&
                    !!user &&
                    user.hubStaffHubIds.includes(b.targetHubId);
                  return (
                    <div key={b.id} className="flex min-w-0 flex-col gap-1.5">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center text-left section-kicker",
                            ownership.isHub ? "text-foreground" : "text-foreground-muted",
                          )}
                        >
                          {ownership.label}
                        </span>
                        {b.source === "hub_inventory" ? (
                          <span
                            className="shrink-0 font-mono caption-scale font-medium tabular-nums text-foreground-muted"
                            title={b.id}
                          >
                            {refShort}
                          </span>
                        ) : null}
                      </div>
                      <CopyLifecycleStrip status={b.status} />
                      {b.inventoryStats && b.inventoryStats.total > 0 && (
                        <div className="mt-1 space-y-0.5 caption-scale leading-relaxed text-foreground-muted">
                          <p className="font-medium text-foreground">
                            {b.inventoryStats.available > 0
                              ? `${b.inventoryStats.available} of ${b.inventoryStats.total} Copies Available at this Hub`
                              : `${b.inventoryStats.total} Copies Total at this Hub`}
                          </p>
                          <p>
                            {b.inventoryStats.issued} Issued &bull; {b.inventoryStats.reserved} Reserved
                          </p>
                        </div>
                      )}
                      {b.status === "reserved" && b.request ? (
                        <div className="space-y-1.5 rounded-md border border-primary/25 bg-primary/[0.04] p-2 text-xs">
                          <div className="flex items-center gap-2">
                            <p
                              className={cn(
                                "rounded px-1.5 py-0.5 section-kicker",
                                b.request.assignmentVerified
                                  ? "bg-secondary/20 text-secondary"
                                  : "bg-primary/15 text-foreground",
                              )}
                            >
                              {b.request.assignmentVerified ? "Verified" : "Unverified"}
                            </p>
                            <p className="text-foreground-muted">
                              Assigned to request{" "}
                              <Link
                                to={`${deskPaths?.requests ?? ""}?q=${b.request.id.slice(0, 8)}`}
                                className="font-semibold text-foreground underline-offset-2 hover:underline"
                              >
                                {b.request.id.slice(0, 8)}…
                              </Link>
                            </p>
                          </div>
                          <p className="text-foreground-muted">
                            by {b.request.assignedBy ?? "system"}
                            {b.request.assignedAt ? ` at ${new Date(b.request.assignedAt).toLocaleString()}` : ""}
                          </p>
                        </div>
                      ) : null}
                      <CatalogBookCard
                        title={b.title}
                        coverUrl={b.coverImageUrl ? apiPublicUrl(b.coverImageUrl) : b.coverImageUrl}
                        hubName={hubName}
                        fromHubName={b.acquiredFromHubName ?? undefined}
                        refDisplay={catalogRefLabel(b.refId ?? b.id, null)}
                        addedText={addedLabel(b.createdAt)}
                        addedAtTitle={
                          b.createdAt ? new Date(b.createdAt).toLocaleString() : undefined
                        }
                        fullIdForTitle={b.id}
                        isSample={false}
                        shelfStatus={b.status}
                        action={
                          <div className="mt-3 w-full space-y-2 text-left body-scale font-normal text-foreground md:text-on-media-muted">
                            {inInterHubTransfer && b.targetHubName ? (
                              <p className="font-medium leading-snug text-foreground md:text-primary/20">
                                Transferring to {b.targetHubName}
                              </p>
                            ) : null}
                            <p className="font-medium tabular-nums">
                              ₹{b.borrowPrice.toLocaleString("en-IN")} borrow · ₹
                              {b.buyPrice.toLocaleString("en-IN")} buy
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex h-5 items-center rounded-sm bg-muted px-1.5 caption-scale font-medium uppercase tracking-wider text-foreground md:bg-overlay-backdrop md:text-on-media-muted">
                                {sourceLabel(b.source)}
                              </span>
                              <span className="inline-flex h-5 items-center rounded-sm bg-muted px-1.5 caption-scale font-medium uppercase tracking-wider text-foreground md:bg-overlay-backdrop md:text-on-media-muted">
                                {b.condition.replace(/_/g, " ")}
                              </span>
                              <span className="inline-flex h-5 items-center rounded-sm bg-muted px-1.5 caption-scale font-medium uppercase tracking-wider text-foreground md:bg-overlay-backdrop md:text-on-media-muted">
                                {b.status === "available"
                                  ? "Available"
                                  : b.status === "reserved"
                                    ? "Assigned to request"
                                    : b.status === "checked_out"
                                      ? "Out (on loan)"
                                      : b.status === "unavailable"
                                        ? "Unavailable"
                                        : b.status === "sold"
                                          ? "Sold"
                                          : b.status === "transfer_pending"
                                            ? "Transfer pending"
                                            : b.status === "in_transit"
                                              ? "In transit"
                                              : b.status.replace(/_/g, " ")}
                              </span>
                            </div>
                            {canMarkInTransit ? (
                              <Button
                                type="button"
                                size="sm"
                                className="w-full rounded-md bg-secondary text-secondary/90 hover:bg-secondary"
                                disabled={markTransferInTransit.isPending}
                                onClick={() => markTransferInTransit.mutate(b.id)}
                              >
                                Mark in transit
                              </Button>
                            ) : null}
                            {canMarkReceived ? (
                              <Button
                                type="button"
                                size="sm"
                                className="w-full rounded-md bg-secondary text-secondary/90 hover:bg-secondary"
                                disabled={markTransferReceived.isPending}
                                onClick={() => markTransferReceived.mutate(b.id)}
                              >
                                Mark received at shelf
                              </Button>
                            ) : null}
                            {isSuperAdmin && b.status === "reserved" ? (
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 w-full rounded-md border border-accent/50 bg-accent/90 caption-scale text-accent-foreground shadow-sm hover:bg-accent"
                                disabled={adminForceRelease.isPending}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Platform admin: force-release this reserved copy? Waiting requests for this copy are expired; audit is logged.",
                                    )
                                  ) {
                                    adminForceRelease.mutate(b.id);
                                  }
                                }}
                              >
                                Admin: release reservation
                              </Button>
                            ) : null}
                            {user &&
                              user.hubStaffHubIds.includes(b.hubId) &&
                              !inInterHubTransfer &&
                              (b.status === "available" || b.status === "reserved") ? (
                              <Button
                                type="button"
                                size="sm"
                                className="w-full rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={markCopyUnavailable.isPending}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Mark this copy damaged / pulled (unavailable)? Any reservation tied to it is expired for the member after confirm.",
                                    )
                                  ) {
                                    markCopyUnavailable.mutate(b.id);
                                  }
                                }}
                              >
                                Mark unavailable
                              </Button>
                            ) : null}
                            {user &&
                              user.hubStaffHubIds.includes(b.hubId) &&
                              !inInterHubTransfer &&
                              b.status === "unavailable" ? (
                              <Button
                                type="button"
                                size="sm"
                                className="w-full rounded-md bg-secondary text-secondary/90 hover:bg-secondary"
                                disabled={markCopyAvailable.isPending}
                                onClick={() => {
                                  if (window.confirm("Mark this copy available again?")) {
                                    markCopyAvailable.mutate(b.id);
                                  }
                                }}
                              >
                                Mark available
                              </Button>
                            ) : null}
                            {b.source === "p2p" && b.status === "available" && !inInterHubTransfer && user?.hubStaffHubIds.includes(b.hubId) ? (
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 w-full rounded-md border border-primary/40 bg-primary/20 caption-scale text-foreground sm:text-on-media hover:bg-primary/30"
                                disabled={convertP2pToHub.isPending}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Convert this consignment copy into hub-owned stock? The peer listing is closed; owner is notified per policy.",
                                    )
                                  ) {
                                    convertP2pToHub.mutate(b.id);
                                  }
                                }}
                              >
                                Convert to hub inventory
                              </Button>
                            ) : null}
                            {b.status === "transfer_pending" && b.targetHubId && user?.hubStaffHubIds.includes(b.hubId) ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="h-8 w-full rounded-md caption-scale"
                                asChild
                              >
                                <Link href={portalPathsForUser(user).inventory + `?q=${encodeURIComponent(b.title)}`}>
                                  Transfer / inventory
                                </Link>
                              </Button>
                            ) : null}
                            <p
                              className="font-mono caption-scale font-medium text-foreground-subtle"
                              title={new Date(b.updatedAt).toLocaleString()}
                            >
                              Updated · {new Date(b.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
            {rows.length > 0 ? (
              <div className="border-t border-border px-4 py-3 sm:px-6">
                <InventoryPaginationBar
                  placement="footer"
                  page={page}
                  totalPages={totalPages}
                  onPrev={() => setPage((p) => Math.max(0, p - 1))}
                  onNext={() => setPage((p) => p + 1)}
                />
              </div>
            ) : null}
          </>
        )}
      </section>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) {
            setAddHubPickerOpen(false);
            setAddCoverPreview((prev) => {
              if (prev) URL.revokeObjectURL(prev);
              return null;
            });
            setAddCoverFile(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans h4-scale font-semibold text-foreground">New shelf copy</DialogTitle>
            <DialogDescription className="body-scale text-foreground-muted">
              Register one hub-owned copy on the shelf. Set a <strong className="font-semibold text-foreground">buy</strong> price and a{" "}
              <strong className="font-semibold text-foreground">borrow</strong> fee (whole rupees; borrow may be ₹0). Book photo is optional same as
              student listings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {user && user.hubStaffHubIds.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="add-shelf-hub-trigger">Hub</Label>
                <Popover open={addHubPickerOpen} onOpenChange={setAddHubPickerOpen} modal={false}>
                  <PopoverTrigger asChild>
                    <Button
                      id="add-shelf-hub-trigger"
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={addHubPickerOpen}
                      disabled={!addDialogHubs.length && !hubsQ.isLoading}
                      className="h-10 w-full justify-between rounded-md font-normal"
                    >
                      <span className="truncate text-left">
                        {hubsQ.isLoading
                          ? "Loading hubs…"
                          : addTargetHubId
                            ? addDialogHubLabel(addTargetHubId)
                            : "Search or choose hub"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="z-[200] w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                    sideOffset={4}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    <Command>
                      <CommandInput placeholder="Search hubs by name or kind…" />
                      <CommandList>
                        <CommandEmpty>No hub matches.</CommandEmpty>
                        <CommandGroup>
                          {addDialogHubs.map((h) => (
                            <CommandItem
                              key={h.id}
                              value={[h.name, h.kind, hubKindLabel(h.kind), h.id].filter(Boolean).join(" ")}
                              onSelect={() => {
                                setAddTargetHubId(h.id);
                                setAddHubPickerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mt-0.5 h-4 w-4 shrink-0 self-start",
                                  addTargetHubId === h.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <span className="flex min-w-0 flex-col gap-0.5 text-left">
                                <span className="truncate font-medium">{h.name}</span>
                                <span className="truncate caption-scale font-medium text-foreground-muted">
                                  {hubKindLabel(h.kind)}
                                </span>
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="add-book-title">Title</Label>
              <Input
                id="add-book-title"
                placeholder="e.g. Chemistry"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-buy">Buy price (₹)</Label>
              <Input
                id="add-buy"
                inputMode="numeric"
                min={0}
                placeholder="e.g. 399"
                className="tabular-nums"
                value={addBuy}
                onChange={(e) => setAddBuy(e.target.value.replace(/[^\d]/g, ""))}
              />
              {!addBuyValid && addBuy.trim() !== "" ? (
                <p className="caption-scale font-medium text-destructive">Enter a whole number ₹0 or more.</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-borrow">Borrow fee (₹)</Label>
              <Input
                id="add-borrow"
                inputMode="numeric"
                min={0}
                placeholder="e.g. 49 or 0"
                className="tabular-nums"
                value={addBorrow}
                onChange={(e) => setAddBorrow(e.target.value.replace(/[^\d]/g, ""))}
              />
              {!addBorrowValid && addBorrow.trim() !== "" ? (
                <p className="caption-scale font-medium text-destructive">Enter a whole number ₹0 or more.</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-cover" className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4" aria-hidden />
                Book photo (optional)
              </Label>
              <Input
                id="add-cover"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="cursor-pointer"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setAddCoverPreview((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return f ? URL.createObjectURL(f) : null;
                  });
                  setAddCoverFile(f);
                  e.target.value = "";
                }}
              />
              <p className="caption-scale font-medium text-foreground-muted">JPEG, PNG, WebP, or GIF · up to 5&nbsp;MB</p>
              <BookCoverImage
                src={addCoverPreview}
                alt={addCoverPreview ? "Cover preview" : "Default book cover"}
                className={cn(
                  STUDENT_CARD_SURFACE,
                  "mt-2 max-h-40 w-28 object-cover",
                  !addCoverPreview && "opacity-80"
                )}
              />
            </div>
            <Button
              className="w-full rounded-full"
              disabled={
                !addTitle.trim() ||
                !addTargetHubId ||
                !addBuyValid ||
                !addBorrowValid ||
                addShelfCopy.isPending
              }
              onClick={() => void addShelfCopy.mutate()}
            >
              {addShelfCopy.isPending ? "Adding…" : "Add shelf copy"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}