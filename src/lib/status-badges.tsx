import { cn } from "@/lib/utils";

// Standardized visual shape for all status badges everywhere
export const uniformBadgeShape = "inline-flex items-center justify-center whitespace-nowrap px-2.5 py-0.5 rounded-md caption-scale font-semibold tracking-kicker uppercase";

// Keep this around for backwards compatibility where the cover shape was expected,
// but now just map it to the new uniform shape + backdrop blur.
export const shelfFilterChipOnCoverClass = "shadow-sm backdrop-blur-md bg-opacity-90";

export const shelfFilterChipClass = cn(uniformBadgeShape, "border border-border bg-background text-foreground shadow-sm");
export const shelfFilterChipOnDarkClass = cn(uniformBadgeShape, "border border-overlay-glass-border bg-overlay-backdrop text-on-media shadow-sm backdrop-blur-md");

export function getStatusColorClasses(status: string): string {
  const s = status.toLowerCase();
  
  // Available (Emerald)
  if (["available", "ready", "on marketplace", "available_for_collection", "delivered"].includes(s)) {
    return "border border-success/30 bg-success/10 text-success";
  }
  
  // Approved (Sky)
  if (["approved", "listed", "requested", "new", "pending"].includes(s)) {
    return "border border-primary/30 bg-primary/10 text-primary";
  }
  
  // Set Aside (Amber)
  if (["set aside", "reserved", "fulfilled", "borrowed"].includes(s)) {
    return "border border-accent/35 bg-accent/10 text-accent";
  }
  
  // Checked Out (Violet)
  if (["checked out", "checked_out", "in_transit", "in transit", "transfer_pending", "transfer pending", "routed", "finding", "pending_dropoff", "pending drop-off"].includes(s)) {
    return "border border-accent/30 bg-accent/10 text-accent-foreground";
  }
  
  // Overdue (Rose)
  if (["overdue", "timed out"].includes(s)) {
    return "border border-destructive/30 bg-destructive/10 text-destructive";
  }
  
  // Rejected (Red)
  if (["rejected", "unavailable", "expired"].includes(s)) {
    return "border border-destructive/30 bg-destructive/10 text-destructive";
  }
  
  // Cancelled / completed (default ink hierarchy)
  if (["cancelled", "sold", "withdrawn", "picked", "completed"].includes(s)) {
    return "border border-border bg-background text-foreground-muted";
  }

  // Fallback
  return "border border-border bg-background text-foreground-muted";
}

/** Staff-facing label: reserved copies are held for desk pickup. */
export function hubBookStatusLabel(status: string): string {
  if (status === "reserved") return "Set aside";
  if (status === "transfer_pending") return "Transfer pending";
  if (status === "in_transit") return "In transit";
  return status.replace(/_/g, " ");
}

export function HubBookStatusBadge({
  status,
  className,
  onCover = true,
}: {
  status: string;
  className?: string;
  onCover?: boolean;
}) {
  return (
    <span
      className={cn(
        uniformBadgeShape,
        onCover ? shelfFilterChipOnCoverClass : null,
        getStatusColorClasses(status),
        className,
      )}
      role="status"
    >
      {hubBookStatusLabel(status)}
    </span>
  );
}

export function P2pStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        uniformBadgeShape,
        getStatusColorClasses(status),
        className,
      )}
      role="status"
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

/** P2P pipeline listing (desk) — same labels as `hub-desk-p2p-listings` status filter copy. */
export function p2pPipelineStatusLabel(s: string): string {
  switch (s) {
    case "listed":
      return "Listed (online)";
    case "pending_dropoff":
      return "Pending drop-off";
    case "available":
      return "On marketplace";
    case "reserved":
      return "Reserved";
    case "sold":
      return "Sold";
    case "expired":
      return "Expired";
    case "rejected":
      return "Rejected";
    default:
      return s.replace(/_/g, " ");
  }
}

/** Cover corner badge for peer pipeline listings (hub desk P2P), matching All copies placement. */
export function P2pPipelineCoverStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        uniformBadgeShape,
        shelfFilterChipOnCoverClass,
        getStatusColorClasses(status),
        className,
      )}
      role="status"
    >
      {p2pPipelineStatusLabel(status)}
    </span>
  );
}

export function ShelfPeerStatusBadge({
  status,
  className,
  onCover = true,
}: {
  status: string;
  className?: string;
  onCover?: boolean;
}) {
  let label = status;
  if (status === "approved") label = "available"; // Peer tiles on the shelf: approved is labeled available
  return (
    <span
      className={cn(
        uniformBadgeShape,
        onCover ? shelfFilterChipOnCoverClass : null,
        getStatusColorClasses(status),
        className,
      )}
      role="status"
    >
      {label.replace(/_/g, " ")}
    </span>
  );
}

export function requestStatusLabel(status: string): string {
  switch (status) {
    case "pending":
    case "requested":
    case "routed":
      return "Pending";
    case "available_for_collection":
    case "fulfilled":
    case "ready":
      return "Available for Collection";
    case "delivered":
    case "picked":
      return "Delivered";
    case "cancelled":
    case "expired":
      return "Cancelled";
    default:
      return status.replace(/_/g, " ");
  }
}

export function RequestStatusBadge({ status, className }: { status: string; className?: string }) {
  const label = requestStatusLabel(status);
  return (
    <span
      className={cn(
        uniformBadgeShape,
        getStatusColorClasses(status),
        className,
      )}
      role="status"
    >
      {label}
    </span>
  );
}