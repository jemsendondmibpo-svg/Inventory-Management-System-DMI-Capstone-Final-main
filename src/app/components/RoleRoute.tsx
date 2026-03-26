import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth, UserRole } from "../context/AuthContext";

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
  message?: string;
}

export default function RoleRoute({
  children,
  allowedRoles,
  redirectTo = "/dashboard",
  message = "You do not have permission to access this module.",
}: RoleRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const isAllowed = !!user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!loading && user && !isAllowed) {
      toast.error(message, { duration: 4000 });
      navigate(redirectTo, { replace: true });
    }
  }, [isAllowed, loading, message, navigate, redirectTo, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#B0BF00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  return null;
}
