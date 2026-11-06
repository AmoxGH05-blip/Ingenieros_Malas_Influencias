import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Texto de lo que falló; por defecto, "la pantalla". */
  nombre?: string;
}

interface Estado {
  fallo: boolean;
}

/**
 * Atrapa los errores de renderizado y las cargas fallidas de pantallas diferidas (React.lazy), por ejemplo cuando
 * un despliegue nuevo cambia los nombres de los archivos mientras la pestaña seguía abierta. Sin esto, la excepción
 * desmonta toda la aplicación y queda la pantalla en blanco. React no tiene aún un equivalente funcional.
 */
export class ErrorBoundary extends Component<Props, Estado> {
  state: Estado = { fallo: false };

  static getDerivedStateFromError(): Estado {
    return { fallo: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Un único registro en consola del navegador para poder diagnosticar; no hay servicio de errores en el proyecto.
    console.error("ErrorBoundary", error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.fallo) return this.props.children;
    return (
      <div role="alert" className="mx-auto max-w-xl space-y-3 rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
        <p className="font-medium text-destructive">No se pudo mostrar {this.props.nombre ?? "la pantalla"}.</p>
        <p className="text-muted-foreground">
          Puede haber una versión nueva de la aplicación o una falla de conexión. Recarga la página para volver a intentarlo.
        </p>
        <Button type="button" onClick={() => window.location.reload()}>
          Recargar la página
        </Button>
      </div>
    );
  }
}
