/** Hub `kind` values stored in the database. */
export const HUB_KIND_VALUES = [
  "college",
  "public",
  "government",
  "private",
  "other",
] as const;

export type HubKindValue = (typeof HUB_KIND_VALUES)[number];

export const HUB_KIND_OPTIONS: { value: HubKindValue; label: string }[] = [
  { value: "college", label: "College library" },
  { value: "public", label: "Public library" },
  { value: "government", label: "Government library" },
  { value: "private", label: "Private library" },
  { value: "other", label: "Other / community hub" },
];

/** Hub `kind` from API — college, public, government, private, other. */
export function hubKindLabel(kind: string | undefined | null): string {
  switch (kind) {
    case "college":
      return "College library";
    case "public":
      return "Public library";
    case "government":
      return "Government library";
    case "private":
      return "Private library";
    case "other":
    default:
      return "Library hub";
  }
}

export function hubMembershipRoleLabel(role: string): string {
  if (role === "hub_admin") return "Hub lead";
  if (role === "hub_user") return "Desk staff";
  return role.replace(/_/g, " ");
}
