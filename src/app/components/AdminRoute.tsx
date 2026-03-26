import { ReactNode } from "react";
import RoleRoute from "./RoleRoute";

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * AdminRoute Component
 * 
 * Protects routes that should only be accessible by Admin users.
 * Redirects non-admin users to the dashboard with an error message.
 */
export default function AdminRoute({ children }: AdminRouteProps) {
  return (
    <RoleRoute
      allowedRoles={["Admin"]}
      message="Access denied. This feature is only available to Administrators."
    >
      {children}
    </RoleRoute>
  );
}
