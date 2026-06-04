export const ACTIONS = {
  VIEW_CATALOG: "VIEW_CATALOG",
  TRACK_READING: "TRACK_READING",
  RAISE_QUERY: "RAISE_QUERY",
  CHECKOUT_BOOK: "CHECKOUT_BOOK",
  PURCHASE_BOOK: "PURCHASE_BOOK",
  REQUEST_BOOK: "REQUEST_BOOK",
  CREATE_P2P_LISTING: "CREATE_P2P_LISTING",
  EDIT_P2P_LISTING: "EDIT_P2P_LISTING",
  DELETE_P2P_LISTING: "DELETE_P2P_LISTING",
  BUY_P2P: "BUY_P2P",
  BORROW_P2P: "BORROW_P2P",
  SCAN_BOOK: "SCAN_BOOK",
  APPROVE_P2P: "APPROVE_P2P",
  MANAGE_INVENTORY: "MANAGE_INVENTORY",
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

export type HubMembershipRole = "hub_user" | "hub_admin";

export type HubMembership = {
  hubId: string;
  role: HubMembershipRole;
};

export type AuthUser = {
  userId: string;
  publicUserId: string;
  name: string;
  email: string;
  baseRole: string;
  premiumActive: boolean;
  premiumUntil: string | null;
  hubStaffHubIds: string[];
  hubMemberships: HubMembership[];
  profileImageUpdatedAt: string | null;
};

export type RbacResource =
  | { type: "none" }
  | { type: "catalog" }
  | { type: "book"; hubId: string; bookId: string }
  | {
      type: "p2p_listing";
      listingId: string;
      ownerId: string;
      hubId?: string | null;
      dropoffHubId?: string | null;
    }
  | { type: "book_request"; requestId: string; userId: string; hubId: string }
  | { type: "hub"; hubId: string };

function isHubStaff(user: AuthUser, hubId: string): boolean {
  return user.hubStaffHubIds.includes(hubId);
}

/**
 * Use for gating premium features and the Upgrade CTA. Hub accounts, super admin, and an active
 * subscription all count as fully entitled.
 */
export function isSuperAdmin(user: AuthUser | null | undefined): boolean {
  return user?.baseRole === "super_admin";
}

export function isPremiumOk(user: AuthUser): boolean {
  return user.premiumActive || user.baseRole === "hub" || user.baseRole === "super_admin";
}

export function authorize(
  user: AuthUser | null,
  action: Action,
  resource: RbacResource,
): boolean {
  if (!user) {
    return action === ACTIONS.VIEW_CATALOG && resource.type === "catalog";
  }
  if (user.baseRole === "super_admin") return true;

  const freeAllowed =
    action === ACTIONS.VIEW_CATALOG ||
    action === ACTIONS.TRACK_READING ||
    action === ACTIONS.RAISE_QUERY;

  if (freeAllowed) return true;

  const premiumAllowed =
    action === ACTIONS.CHECKOUT_BOOK ||
    action === ACTIONS.PURCHASE_BOOK ||
    action === ACTIONS.REQUEST_BOOK ||
    action === ACTIONS.CREATE_P2P_LISTING ||
    action === ACTIONS.BUY_P2P ||
    action === ACTIONS.BORROW_P2P;

  if (premiumAllowed && !isPremiumOk(user)) return false;

  if (action === ACTIONS.EDIT_P2P_LISTING || action === ACTIONS.DELETE_P2P_LISTING) {
    if (resource.type !== "p2p_listing") return false;
    return resource.ownerId === user.userId;
  }

  if (action === ACTIONS.BUY_P2P || action === ACTIONS.BORROW_P2P) {
    if (resource.type !== "p2p_listing") return false;
    return resource.ownerId !== user.userId;
  }

  if (action === ACTIONS.SCAN_BOOK || action === ACTIONS.MANAGE_INVENTORY) {
    if (resource.type !== "book") return false;
    return isHubStaff(user, resource.hubId);
  }

  if (action === ACTIONS.APPROVE_P2P) {
    if (resource.type !== "p2p_listing") return false;
    const hid = resource.hubId ?? resource.dropoffHubId;
    if (!hid) return false;
    return isHubStaff(user, hid);
  }

  if (action === ACTIONS.CHECKOUT_BOOK || action === ACTIONS.PURCHASE_BOOK) {
    if (resource.type !== "book") return false;
    return true;
  }

  if (action === ACTIONS.REQUEST_BOOK) {
    if (resource.type !== "book_request") return false;
    return resource.userId === user.userId;
  }

  if (action === ACTIONS.CREATE_P2P_LISTING) {
    return true;
  }

  return false;
}
