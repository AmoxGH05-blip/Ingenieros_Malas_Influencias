import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { RoleRedirect } from "@/routes/RoleRedirect";
import { AppLayout } from "@/layouts/AppLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { CambiarPasswordPage } from "@/pages/auth/CambiarPasswordPage";
import { EstudianteDashboardPage } from "@/pages/dashboards/EstudianteDashboardPage";
import { DocenteDashboardPage } from "@/pages/dashboards/DocenteDashboardPage";
import { CoordinadorDashboardPage } from "@/pages/dashboards/CoordinadorDashboardPage";
import { EvaluacionesPage } from "@/pages/estudiante/EvaluacionesPage";
import { CuestionarioPage } from "@/pages/estudiante/CuestionarioPage";
import { HistorialPage } from "@/pages/estudiante/HistorialPage";
import { PerfilPage } from "@/pages/estudiante/PerfilPage";
import { CuentasPage } from "@/pages/cuentas/CuentasPage";
import { GruposPage } from "@/pages/grupos/GruposPage";
import { GrupoDetallePage } from "@/pages/grupos/GrupoDetallePage";
import { AdministradorDashboardPage } from "@/pages/dashboards/AdministradorDashboardPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/cambiar-password" element={<CambiarPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<RoleRedirect />} />

            <Route element={<ProtectedRoute allowedRoles={["Estudiante"]} />}>
              <Route path="/estudiante" element={<EstudianteDashboardPage />} />
              <Route path="/estudiante/evaluaciones" element={<EvaluacionesPage />} />
              <Route path="/estudiante/evaluar/:asignacionId" element={<CuestionarioPage />} />
              <Route path="/estudiante/historial" element={<HistorialPage />} />
              <Route path="/estudiante/perfil" element={<PerfilPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["Docente"]} />}>
              <Route path="/docente" element={<DocenteDashboardPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["Coordinador", "Administrador"]} />}>
              <Route path="/coordinador" element={<CoordinadorDashboardPage />} />
              <Route path="/coordinador/usuarios" element={<CuentasPage />} />
              <Route path="/coordinador/grupos" element={<GruposPage />} />
              <Route path="/coordinador/grupos/:id" element={<GrupoDetallePage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["Administrador"]} />}>
              <Route path="/administrador" element={<AdministradorDashboardPage />} />
              <Route path="/administrador/usuarios" element={<CuentasPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
