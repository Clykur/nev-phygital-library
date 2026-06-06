/** Bounty Books — shared types and display helpers */

export type BountyRequestStatus =
  | "open"
  | "paused"
  | "pending_student_delivery"
  | "under_review"
  | "approved"
  | "rejected"
  | "completed"
  | "closed";

export type BountySubmissionStatus =
  | "submitted"
  | "awaiting_drop_off"
  | "delivered"
  | "under_review"
  | "approved"
  | "rejected";

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
    case "rejected":
      return "Rejected";
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
    case "under_review":
      return "Under review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return status.replace(/_/g, " ");
  }
}

export function fmtBountyReward(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
