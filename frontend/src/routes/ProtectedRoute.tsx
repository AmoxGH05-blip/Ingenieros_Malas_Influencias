import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { token, usuario, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.some((rol) => usuario.roles.includes(rol))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
