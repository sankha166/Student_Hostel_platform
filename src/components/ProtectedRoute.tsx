import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "student" | "owner";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary border-r-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/auth${requiredRole ? `?role=${requiredRole}` : ""}`}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (requiredRole && user.role !== requiredRole) {
    // Logged in as wrong role — redirect to the right dashboard or auth
    if (user.role === "student") return <Navigate to="/student" replace />;
    if (user.role === "owner") return <Navigate to="/owner" replace />;
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
