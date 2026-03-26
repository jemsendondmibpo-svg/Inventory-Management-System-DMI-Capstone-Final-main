import type { UserRole } from "../context/AuthContext";

export type AppModule =
  | "dashboard"
  | "inventory"
  | "assignments"
  | "reports"
  | "settings"
  | "user-management";

const MODULE_ACCESS: Record<UserRole, AppModule[]> = {
  Admin: [
    "dashboard",
    "inventory",
    "assignments",
    "reports",
    "settings",
    "user-management",
  ],
  "IT Officers": [
    "dashboard",
    "inventory",
    "assignments",
    "reports",
    "settings",
  ],
  "HR Officers": [
    "dashboard",
    "inventory",
    "assignments",
    "reports",
    "settings",
  ],
};

export function canAccessModule(role: UserRole, module: AppModule) {
  return MODULE_ACCESS[role].includes(module);
}

export function canManageInventory(role: UserRole) {
  return role === "Admin" || role === "IT Officers";
}

export function canManageAssignments(role: UserRole) {
  return role === "Admin" || role === "IT Officers";
}

export function canExportReports(role: UserRole) {
  return (
    role === "Admin" ||
    role === "IT Officers" ||
    role === "HR Officers"
  );
}

export function canManageUsers(role: UserRole) {
  return role === "Admin";
}
