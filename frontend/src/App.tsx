import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { RoleRedirect } from "@/routes/RoleRedirect";
import { AppLayout } from "@/layouts/AppLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { SolicitarCambioPasswordPage } from "@/pages/auth/SolicitarCambioPasswordPage";
import { SolicitudesPasswordPage } from "@/pages/solicitudes/SolicitudesPasswordPage";
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
import { DocenteComparativoPage } from "@/pages/docente/DocenteComparativoPage";
import { IndicadoresPage } from "@/pages/indicadores/IndicadoresPage";
const EstadisticasPage = lazy(() => import("@/pages/estadisticas/EstadisticasPage").then((m) => ({ default: m.EstadisticasPage })));
import { IndicadorDocenteDetallePage } from "@/pages/indicadores/IndicadorDocenteDetallePage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/solicitar-cambio-password" element={<SolicitarCambioPasswordPage />} />
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
              <Route path="/docente/comparativo" element={<DocenteComparativoPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["Coordinador", "Administrador"]} />}>
              <Route path="/coordinador" element={<CoordinadorDashboardPage />} />
              <Route path="/coordinador/usuarios" element={<CuentasPage />} />
              <Route path="/coordinador/grupos" element={<GruposPage />} />
              <Route path="/coordinador/grupos/:id" element={<GrupoDetallePage />} />
              <Route path="/coordinador/solicitudes" element={<SolicitudesPasswordPage />} />
              <Route
                path="/coordinador/estadisticas"
                element={
                  <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">Cargando…</p>}>
                    <EstadisticasPage />
                  </Suspense>
                }
              />
              <Route path="/coordinador/indicadores" element={<IndicadoresPage />} />
              <Route path="/coordinador/indicadores/:id" element={<IndicadorDocenteDetallePage />} />
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
