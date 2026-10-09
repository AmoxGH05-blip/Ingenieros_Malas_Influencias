import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ROLE_HOME, ROL_PRIORIDAD } from "@/layouts/nav-config";

export function RoleRedirect() {
  const { usuario } = useAuth();
  const rol = ROL_PRIORIDAD.find((r) => usuario?.roles.includes(r));
  return <Navigate to={rol ? ROLE_HOME[rol] : "/login"} replace />;
}
