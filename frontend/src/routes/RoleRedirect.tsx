import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const ROLE_HOME: Record<string, string> = {
  Estudiante: "/estudiante",
  Docente: "/docente",
  Coordinador: "/coordinador",
  Administrador: "/administrador",
};

export function RoleRedirect() {
  const { usuario } = useAuth();
  const destino = usuario?.roles.map((rol) => ROLE_HOME[rol]).find(Boolean) ?? "/login";
  return <Navigate to={destino} replace />;
}
