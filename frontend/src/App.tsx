import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { RoleRedirect } from "@/routes/RoleRedirect";
import { AppLayout } from "@/layouts/AppLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { EstudianteDashboardPage } from "@/pages/dashboards/EstudianteDashboardPage";
import { DocenteDashboardPage } from "@/pages/dashboards/DocenteDashboardPage";
import { CoordinadorDashboardPage } from "@/pages/dashboards/CoordinadorDashboardPage";
import { AdministradorDashboardPage } from "@/pages/dashboards/AdministradorDashboardPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<RoleRedirect />} />

            <Route element={<ProtectedRoute allowedRoles={["Estudiante"]} />}>
              <Route path="/estudiante" element={<EstudianteDashboardPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["Docente"]} />}>
              <Route path="/docente" element={<DocenteDashboardPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["Coordinador"]} />}>
              <Route path="/coordinador" element={<CoordinadorDashboardPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["Administrador"]} />}>
              <Route path="/administrador" element={<AdministradorDashboardPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
