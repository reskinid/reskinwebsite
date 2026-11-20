export type AvatarStyle = "male" | "female_hijab" | "female_no_hijab";

export function normalizeAvatarStyle(value: unknown): AvatarStyle {
  if (value === "male" || value === "female_no_hijab" || value === "female_hijab") {
    return value;
  }
  return "female_hijab";
}

export function getMemberAvatarPath(value: unknown): string {
  const style = normalizeAvatarStyle(value);
  if (style === "male") return "/avatar-male.svg";
  if (style === "female_no_hijab") return "/avatar-female-no-hijab.svg";
  return "/member-avatar.svg";
}
