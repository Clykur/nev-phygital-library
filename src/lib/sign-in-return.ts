import type { AuthUser } from "./rbac";
import {
  HUB_ACTIVITY_PATH,
  HUB_BORROW_PATH,
  HUB_CATALOG_PATH,
  HUB_INVENTORY_PATH,
  HUB_OVERVIEW_PATH,
  HUB_PROFILE_PATH,
  HUB_REQUESTS_PATH,
  SUPER_ADMIN_ACTIVITY_PATH,
  SUPER_ADMIN_INVENTORY_PATH,
  SUPER_ADMIN_PROFILE_PATH,
  SUPER_ADMIN_REQUESTS_PATH,
  STUDENT_BORROW_PATH,
  hubOverviewPathForUser,
  isHubAccount,
} from "./app-paths";

/** After sign-in, map legacy `/hub/...` desk URLs to `/superadmin/...` for super admins. */
function mapHubDeskPathToSuperAdmin(path: string, user: AuthUser): string {
  const overviewBase = hubOverviewPathForUser(user);
  if (
    path === HUB_OVERVIEW_PATH ||
    path.startsWith(`${HUB_OVERVIEW_PATH}?`) ||
    (path.length > HUB_OVERVIEW_PATH.length && path.startsWith(`${HUB_OVERVIEW_PATH}/`))
  ) {
    return overviewBase + path.slice(HUB_OVERVIEW_PATH.length);
  }
  const deskPairs: [string, string][] = [
    [HUB_CATALOG_PATH, SUPER_ADMIN_INVENTORY_PATH],
    [HUB_INVENTORY_PATH, SUPER_ADMIN_INVENTORY_PATH],
    [HUB_REQUESTS_PATH, SUPER_ADMIN_REQUESTS_PATH],
    [HUB_ACTIVITY_PATH, SUPER_ADMIN_ACTIVITY_PATH],
    [HUB_PROFILE_PATH, SUPER_ADMIN_PROFILE_PATH],
  ];
  for (const [hubP, supP] of deskPairs) {
    if (
      path === hubP ||
      path.startsWith(`${hubP}?`) ||
      (path.length > hubP.length && path.startsWith(`${hubP}/`))
    ) {
      return supP + path.slice(hubP.length);
    }
  }
  if (
    path === HUB_BORROW_PATH ||
    path.startsWith(`${HUB_BORROW_PATH}?`) ||
    (path.length > HUB_BORROW_PATH.length && path.startsWith(`${HUB_BORROW_PATH}/`))
  ) {
    return SUPER_ADMIN_INVENTORY_PATH + path.slice(HUB_BORROW_PATH.length);
  }
  return path;
}

function normalizePostAuthPath(path: string): string {
  if (path === "/library" || path === "/marketplace") return STUDENT_BORROW_PATH;
  if (path === "/hub-desk" || path === "/hub/desk") return HUB_OVERVIEW_PATH;
  if (path === HUB_BORROW_PATH || path === "/hub/borrow") return HUB_CATALOG_PATH;
  if (path.startsWith("/app/")) return path.replace(/^\/app/, "/student");
  return path;
}

function alignPortalPathForUser(path: string, user: AuthUser): string {
  if (user.baseRole === "super_admin") {
    return mapHubDeskPathToSuperAdmin(path, user);
  }
  if (isHubAccount(user)) {
    if (path.startsWith("/student/")) {
      const mapped = path.replace(/^\/student/, "/hub");
      if (mapped === HUB_BORROW_PATH) return HUB_CATALOG_PATH;
      if (mapped === "/hub/sell") return hubOverviewPathForUser(user);
      return mapped;
    }
    if (path === HUB_BORROW_PATH) return HUB_CATALOG_PATH;
    return path;
  }
  if (path.startsWith("/hub/")) {
    if (path === HUB_OVERVIEW_PATH && user.hubStaffHubIds.length > 0)
      return hubOverviewPathForUser(user);
    if (path === HUB_OVERVIEW_PATH) return STUDENT_BORROW_PATH;
    if (path === HUB_INVENTORY_PATH && user.hubStaffHubIds.length > 0) return path;
    if (path === HUB_INVENTORY_PATH) return STUDENT_BORROW_PATH;
    if (path === HUB_REQUESTS_PATH && user.hubStaffHubIds.length > 0) return path;
    if (path === HUB_CATALOG_PATH) return STUDENT_BORROW_PATH;
    return path.replace(/^\/hub/, "/student");
  }
  return path;
}

export function afterAuthPath(user: AuthUser): string {
  const defaultPath = isHubAccount(user) ? hubOverviewPathForUser(user) : STUDENT_BORROW_PATH;
  if (typeof window === "undefined") return defaultPath;
  const r = new URLSearchParams(window.location.search).get("return");
  if (r && r.startsWith("/") && !r.startsWith("//")) {
    const normalized = normalizePostAuthPath(r);
    return alignPortalPathForUser(normalized, user);
  }
  return defaultPath;
}

/** After hub registration, same rules as sign-in (hub accounts default to overview). */
export function afterHubRegisterPath(user: AuthUser): string {
  return afterAuthPath(user);
}

export function signInHref(pathname: string): string {
  const path = pathname && pathname !== "/sign-in" ? pathname : "/library";
  return `/sign-in?return=${encodeURIComponent(path)}`;
}
