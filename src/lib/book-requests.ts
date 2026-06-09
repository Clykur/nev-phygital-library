/** Canonical book-request lifecycle (hub-wide broadcast model). */
export const BOOK_REQUEST_STATUSES = [
  "pending",
  "available_for_collection",
  "delivered",
  "cancelled",
  "lease_requested",
  "lease_approved",
  "lease_active",
  "lease_return_pending",
  "lease_completed",
  "lease_refunded",
] as const;

export type BookRequestStatus = (typeof BOOK_REQUEST_STATUSES)[number];

export const BOOK_REQUEST_ACTIVE_STATUSES: readonly BookRequestStatus[] = [
  "pending",
  "available_for_collection",
  "lease_requested",
  "lease_approved",
  "lease_active",
  "lease_return_pending",
];

export type BookRequestRow = {
  id: string;
  userId: string;
  requesterPublicId?: string | null;
  hubId?: string | null;
  assignedHubId?: string | null;
  fulfilledByHubId?: string | null;
  bookTitle?: string | null;
  author?: string | null;
  isbn?: string | null;
  notes?: string | null;
  status: string;
  assignedCopyId?: string | null;
  assignedCopyRefId?: string | null;
  assignmentVerified?: boolean;
  assignedAt?: string | null;
  assignedBy?: string | null;
  readyAt?: string | null;
  fulfilledAt?: string | null;
  deliveredAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  isLongTermLease?: boolean | null;
};

const LEGACY_STATUS_MAP: Record<string, BookRequestStatus> = {
  requested: "pending",
  routed: "pending",
  fulfilled: "available_for_collection",
  ready: "available_for_collection",
  picked: "delivered",
  expired: "cancelled",
};

export function normalizeBookRequestStatus(status: string): BookRequestStatus | string {
  const s = status.toLowerCase();
  return (
    LEGACY_STATUS_MAP[s] ?? (BOOK_REQUEST_STATUSES.includes(s as BookRequestStatus) ? s : status)
  );
}

export function isActiveBookRequest(status: string): boolean {
  const n = normalizeBookRequestStatus(status);
  return n === "pending" || n === "available_for_collection";
}

export function isTerminalBookRequest(status: string): boolean {
  const n = normalizeBookRequestStatus(status);
  return (
    n === "delivered" || n === "cancelled" || n === "lease_completed" || n === "lease_refunded"
  );
}

export function bookRequestStatusLabel(status: string): string {
  switch (normalizeBookRequestStatus(status)) {
    case "pending":
      return "Pending";
    case "available_for_collection":
      return "Available for Collection";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    case "lease_requested":
      return "Lease Requested";
    case "lease_approved":
      return "Lease Approved";
    case "lease_active":
      return "Lease Active";
    case "lease_return_pending":
      return "Return Pending";
    case "lease_completed":
      return "Lease Completed";
    case "lease_refunded":
      return "Lease Refunded";
    default:
      return status.replace(/_/g, " ");
  }
}

export function bookRequestAssignedHubId(
  row: Pick<BookRequestRow, "hubId" | "assignedHubId" | "fulfilledByHubId">,
): string | null {
  return row.assignedHubId ?? row.fulfilledByHubId ?? row.hubId ?? null;
}
