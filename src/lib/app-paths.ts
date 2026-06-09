import type { AuthUser } from "./rbac";

/** Logged-in student experience (shell + primary navigation). */
export const STUDENT_APP_PREFIX = "/student";

/** Hub accounts use `/hub/*` for marketplace + activity; staff portal at `/hub/overview`. */
export const HUB_BASE = "/hub";

/** Super admin: all staff surfaces use `/superadmin/...` (not `/hub/...`). */
export const SUPER_ADMIN_BASE = "/superadmin";
export const SUPER_ADMIN_OVERVIEW_PATH = `${SUPER_ADMIN_BASE}/overview`;
export const SUPER_ADMIN_CATALOG_PATH = `${SUPER_ADMIN_BASE}/catalog`;
export const SUPER_ADMIN_INVENTORY_PATH = `${SUPER_ADMIN_BASE}/inventory`;
export const SUPER_ADMIN_REQUESTS_PATH = `${SUPER_ADMIN_BASE}/requests`;
export const SUPER_ADMIN_ACTIVITY_PATH = `${SUPER_ADMIN_BASE}/activity`;
export const SUPER_ADMIN_PROFILE_PATH = `${SUPER_ADMIN_BASE}/profile`;
export const SUPER_ADMIN_USERS_PATH = `${SUPER_ADMIN_BASE}/users`;
export const SUPER_ADMIN_HUBS_PATH = `${SUPER_ADMIN_BASE}/hubs`;
/** System health, notification pipeline, cross-cutting ops (super admin). */
export const SUPER_ADMIN_OPERATIONS_PATH = `${SUPER_ADMIN_BASE}/operations`;

/** @deprecated Use {@link SUPER_ADMIN_USERS_PATH} */
export const ADMIN_BASE = "/admin";
/** Directory — canonical URLs are under `/superadmin/…`. */
export const ADMIN_USERS_PATH = SUPER_ADMIN_USERS_PATH;
export const ADMIN_HUBS_PATH = SUPER_ADMIN_HUBS_PATH;

export function adminUserPath(userId: string): string {
  return `${SUPER_ADMIN_USERS_PATH}/${userId}`;
}

export function adminHubPath(hubId: string): string {
  return `${SUPER_ADMIN_HUBS_PATH}/${hubId}`;
}

/** Hub desk “home” / command center: super admin uses {@link SUPER_ADMIN_OVERVIEW_PATH}. */
export function hubOverviewPathForUser(
  user: Pick<AuthUser, "baseRole"> | null | undefined,
): string {
  if (user?.baseRole === "super_admin") return SUPER_ADMIN_OVERVIEW_PATH;
  return HUB_OVERVIEW_PATH;
}

export const STUDENT_DASHBOARD_PATH = `${STUDENT_APP_PREFIX}/dashboard`;
export const STUDENT_WALLET_PATH = `${STUDENT_APP_PREFIX}/wallet`;
export const STUDENT_BORROW_PATH = `${STUDENT_APP_PREFIX}/borrow`;
/** Student bounty books — library acquisition requests. */
export const STUDENT_BOUNTY_PATH = `${STUDENT_APP_PREFIX}/bounty-books`;
/** @deprecated P2P sell removed — redirects to bounty books. */
export const STUDENT_SELL_PATH = STUDENT_BOUNTY_PATH;
export const STUDENT_LIBRARY_PATH = `${STUDENT_APP_PREFIX}/library`;
export const STUDENT_ACTIVITY_PATH = `${STUDENT_APP_PREFIX}/activity`;
export const STUDENT_ALERTS_PATH = `${STUDENT_APP_PREFIX}/alerts`;
export const STUDENT_REQUESTS_PATH = `${STUDENT_APP_PREFIX}/requests`;
export const STUDENT_PROFILE_PATH = `${STUDENT_APP_PREFIX}/profile`;

/** @deprecated Use {@link HUB_CATALOG_PATH}; kept for redirects only. */
export const HUB_BORROW_PATH = `${HUB_BASE}/borrow`;
export const HUB_ACTIVITY_PATH = `${HUB_BASE}/activity`;
export const HUB_PROFILE_PATH = `${HUB_BASE}/profile`;
/** Hub staff: browse campus catalog (same UI as student borrow). */
export const HUB_CATALOG_PATH = `${HUB_BASE}/catalog`;
/** Hub staff dashboard (replaces legacy `/hub/desk`). */
export const HUB_OVERVIEW_PATH = `${HUB_BASE}/overview`;
/** Hub staff: physical copies at managed location(s). */
export const HUB_INVENTORY_PATH = `${HUB_BASE}/inventory`;
/** Hub staff: desk book-request queue. */
export const HUB_REQUESTS_PATH = `${HUB_BASE}/requests`;
/** Hub staff: rentals & purchases (members at desk + hub account shopping elsewhere). */
/** Hub staff: bounty book acquisition requests. */
export const HUB_BOUNTY_BOOKS_PATH = `${HUB_BASE}/bounty-books`;
export const SUPER_ADMIN_BOUNTY_BOOKS_PATH = `${SUPER_ADMIN_BASE}/bounty-books`;
/** @deprecated Use {@link HUB_BOUNTY_BOOKS_PATH} */
export const HUB_P2P_LISTINGS_PATH = HUB_BOUNTY_BOOKS_PATH;
/** @deprecated Use {@link SUPER_ADMIN_BOUNTY_BOOKS_PATH} */
export const SUPER_ADMIN_P2P_LISTINGS_PATH = SUPER_ADMIN_BOUNTY_BOOKS_PATH;
/** @deprecated Use HUB_OVERVIEW_PATH */
export const HUB_DESK_PATH = HUB_OVERVIEW_PATH;

/** Hub staff “desk” surface: overview + ops (used for shell tab bar). */
export const HUB_DESK_ROUTES = [
  HUB_OVERVIEW_PATH,
  SUPER_ADMIN_OVERVIEW_PATH,
  HUB_CATALOG_PATH,
  HUB_ACTIVITY_PATH,
  SUPER_ADMIN_ACTIVITY_PATH,
  HUB_INVENTORY_PATH,
  SUPER_ADMIN_INVENTORY_PATH,
  HUB_REQUESTS_PATH,
  SUPER_ADMIN_REQUESTS_PATH,
  HUB_BOUNTY_BOOKS_PATH,
  SUPER_ADMIN_BOUNTY_BOOKS_PATH,
] as const;

export function isHubDeskRoute(pathname: string): boolean {
  if ((HUB_DESK_ROUTES as readonly string[]).includes(pathname)) return true;
  if (pathname.startsWith(`${SUPER_ADMIN_BASE}/`)) return true;
  if (pathname === ADMIN_USERS_PATH || pathname === ADMIN_HUBS_PATH) return true;
  if (pathname.startsWith(`${ADMIN_USERS_PATH}/`) || pathname.startsWith(`${ADMIN_HUBS_PATH}/`))
    return true;
  return false;
}

export function isHubAccount(user: Pick<AuthUser, "baseRole"> | null): boolean {
  return user?.baseRole === "hub" || user?.baseRole === "super_admin";
}

export function portalPathsForUser(user: AuthUser | null) {
  if (!user || !isHubAccount(user)) {
    const p = STUDENT_APP_PREFIX;
    return {
      prefix: p,
      borrow: `${p}/borrow`,
      catalog: STUDENT_BORROW_PATH,
      sell: STUDENT_BOUNTY_PATH,
      bountyBooks: STUDENT_BOUNTY_PATH,
      library: `${p}/library`,
      activity: `${p}/activity`,
      alerts: `${p}/alerts`,
      profile: `${p}/profile`,
      overview: HUB_OVERVIEW_PATH,
      inventory: HUB_INVENTORY_PATH,
      p2pListings: STUDENT_BOUNTY_PATH,
      requests: HUB_REQUESTS_PATH,
    };
  }
  if (user.baseRole === "super_admin") {
    const overview = hubOverviewPathForUser(user);
    return {
      prefix: SUPER_ADMIN_BASE,
      /** Super admin: single copy-level source of truth (hub shelf + peer consignment). */
      borrow: SUPER_ADMIN_INVENTORY_PATH,
      catalog: SUPER_ADMIN_INVENTORY_PATH,
      sell: overview,
      library: SUPER_ADMIN_ACTIVITY_PATH,
      activity: SUPER_ADMIN_ACTIVITY_PATH,
      alerts: SUPER_ADMIN_ACTIVITY_PATH,
      profile: SUPER_ADMIN_PROFILE_PATH,
      overview,
      inventory: SUPER_ADMIN_INVENTORY_PATH,
      p2pListings: SUPER_ADMIN_BOUNTY_BOOKS_PATH,
      bountyBooks: SUPER_ADMIN_BOUNTY_BOOKS_PATH,
      requests: SUPER_ADMIN_REQUESTS_PATH,
    };
  }
  const p = HUB_BASE;
  return {
    prefix: p,
    borrow: HUB_CATALOG_PATH,
    catalog: HUB_CATALOG_PATH,
    sell: HUB_OVERVIEW_PATH,
    library: HUB_ACTIVITY_PATH,
    activity: HUB_ACTIVITY_PATH,
    alerts: HUB_ACTIVITY_PATH,
    profile: HUB_PROFILE_PATH,
    overview: HUB_OVERVIEW_PATH,
    inventory: HUB_INVENTORY_PATH,
    p2pListings: HUB_BOUNTY_BOOKS_PATH,
    bountyBooks: HUB_BOUNTY_BOOKS_PATH,
    requests: HUB_REQUESTS_PATH,
  };
}

export function defaultLoggedInHome(user: AuthUser | null): string {
  return user && isHubAccount(user) ? hubOverviewPathForUser(user) : STUDENT_DASHBOARD_PATH;
}
