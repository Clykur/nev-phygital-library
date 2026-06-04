/** Client-side catalog ordering and pagination (shared by Borrow & buy + Library). */
export const CATALOG_PAGE_SIZE = 20;

/** Lower rank sorts earlier. Available / buyable-first. */
export function hubStatusRank(status: string): number {
  switch (status) {
    case "available":
      return 0;
    case "reserved":
      return 1;
    case "checked_out":
    case "overdue":
      return 2;
    case "unavailable":
      return 8;
    case "sold":
      return 9;
    case "transfer_pending":
    case "in_transit":
      return 6;
    default:
      return 4;
  }
}

/**
 * On-shelf peer copies (`available`) first, then reserved (rent), then pipeline states.
 * Keep in sync with `hubP2pPipelineListingsOrderBy` in the API (desk P2P pipeline query).
 */
export function p2pShelfStatusRank(status: string): number {
  if (status === "approved") return 0;
  if (status === "rejected") return 1;
  if (status === "sold") return 2;
  if (status === "available") return 3;
  if (status === "pending_dropoff") return 4;
  if (status === "listed") return 5;
  if (status === "reserved" || status === "borrowed") return 6;
  if (status === "checked_out") return 7;
  if (status === "overdue") return 8;
  return 9;
}

/** Shelf UI label for peer listing status. */
export function peerShelfStatusLabel(raw: string): string {
  if (raw === "approved") return "APPROVED";
  if (raw === "rejected") return "REJECTED";
  if (raw === "available") return "Available";
  if (raw === "borrowed") return "On loan";
  if (raw === "sold") return "Sold";
  if (raw === "reserved") return "Reserved";
  if (raw === "checked_out") return "Checked out";
  if (raw === "overdue") return "Overdue";
  return raw.replace(/_/g, " ");
}