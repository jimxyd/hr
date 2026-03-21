export type UserRole = "SUPER_ADMIN" | "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE"

export const ROLES: Record<UserRole, UserRole> = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  HR: "HR",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  HR: "HR Manager",
  MANAGER: "Manager",
  EMPLOYEE: "Εργαζόμενος",
}

export function hasAnyRole(userRoles: string[], ...roles: UserRole[]): boolean {
  return roles.some(r => userRoles.includes(r))
}

export function isAdminOrHR(roles: string[]): boolean {
  return hasAnyRole(roles, "ADMIN", "HR")
}

export function canApproveLeaves(roles: string[]): boolean {
  return hasAnyRole(roles, "ADMIN", "HR", "MANAGER")
}

export function canManageEmployees(roles: string[]): boolean {
  return hasAnyRole(roles, "ADMIN", "HR")
}
