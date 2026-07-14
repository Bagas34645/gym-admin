export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
export const USER_ROLE_COOKIE = "user_role";

export type PortalRole = "admin" | "trainer";

export function isAdminRole(role: string): boolean {
  return role === "admin";
}

export function isTrainerRole(role: string): boolean {
  return role === "trainer";
}

export function isPortalRole(role: string): role is PortalRole {
  return isAdminRole(role) || isTrainerRole(role);
}

export function portalHomeForRole(role: string): string {
  return isTrainerRole(role) ? "/trainer" : "/";
}
