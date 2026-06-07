/** Bounty Books — shared types and display helpers */

export type BountyRequestStatus =
  | "open"
  | "paused"
  | "pending_student_delivery"
  | "under_review"
  | "approved"
  | "completed"
  | "closed";

export type BountySubmissionStatus =
  | "submitted"
  | "awaiting_drop_off"
  | "delivered"
  | "awaiting_acceptance"
  | "under_review"
  | "approved"
  | "rejected"
  | "inventory_confirmed";

export type BountyRewardStatus =
  | "pending"
  | "delivered"
  | "awaiting_acceptance"
  | "credits_accepted"
  | "cash_requested"
  | "completed"
  | "approved"
  | "paid";

export type BountyRequestRow = {
  id: string;
  hubId: string;
  hubName?: string | null;
  title: string;
  author: string | null;
  edition: string | null;
  department: string | null;
  semester: string | null;
  subject: string | null;
  isbn: string | null;
  quantity: number;
  rewardAmount: number;
  notes: string | null;
  expiryDate: string | null;
  status: BountyRequestStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  submissionCount?: number;
};

export type BountySubmissionRow = {
  [x: string]: any;
  id: string;
  bountyRequestId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  condition: string;
  edition: string | null;
  notes: string | null;
  photoUrls: string[];
  status: BountySubmissionStatus;
  submittedAt: string;
  updatedAt: string;
  bountyTitle?: string;
  bountyAuthor?: string | null;
  rewardAmount?: number;
  hubName?: string;
  bountyStatus?: BountyRequestStatus;
  inventoryBookId?: string | null;
  acquisitionId?: string | null;
  inventoryConfirmedAt?: string | null;
  rewardStatus?: BountyRewardStatus;
  rewardPaidAt?: string | null;
  rewardMethod?: "credits" | "cash" | null;
  rewardAcceptedAt?: string | null;
  cashPayoutStatus?: string | null;
};

export function bountyRequestStatusLabel(status: string): string {
  switch (status) {
    case "open":
      return "Open";
    case "paused":
      return "Paused";
    case "pending_student_delivery":
      return "Pending delivery";
    case "under_review":
      return "Under review";
    case "approved":
      return "Approved";
    case "completed":
      return "Completed";
    case "closed":
      return "Closed";
    default:
      return status.replace(/_/g, " ");
  }
}

export function bountySubmissionStatusLabel(status: string): string {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "awaiting_drop_off":
      return "Awaiting drop-off";
    case "delivered":
      return "Delivered";
    case "awaiting_acceptance":
      return "Awaiting reward acceptance";
    case "under_review":
      return "Under review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "inventory_confirmed":
      return "Added to Inventory";
    default:
      return status.replace(/_/g, " ");
  }
}

export function bountyRewardStatusLabel(status?: BountyRewardStatus): string {
  switch (status) {
    case "delivered":
      return "Delivered";
    case "awaiting_acceptance":
      return "Awaiting Reward Acceptance";
    case "credits_accepted":
      return "Credits Accepted";
    case "cash_requested":
      return "Cash Payout Requested";
    case "completed":
      return "Reward Completed";
    case "paid":
      return "Reward Paid";
    case "approved":
      return "Reward Approved";
    default:
      return "Reward Pending";
  }
}

export const BOUNTY_STUDENT_STEPS = [
  { status: "submitted", label: "Submitted" },
  { status: "awaiting_drop_off", label: "Awaiting Drop Off" },
  { status: "delivered", label: "Delivered" },
  { status: "under_review", label: "Under Review" },
  { status: "approved", label: "Approved" },
  { status: "inventory_confirmed", label: "Added to Inventory" },
  { status: "awaiting_acceptance", label: "Accept Reward" },
] as const;

export function bountySubmissionStep(status: BountySubmissionStatus): number {
  if (status === "rejected") return -1;
  return BOUNTY_STUDENT_STEPS.findIndex((step) => step.status === status);
}

export function fmtBountyReward(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
