import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardPlaceholderProps {
  rol: string;
  descripcion: string;
}

export function DashboardPlaceholder({ rol, descripcion }: DashboardPlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard — {rol}</CardTitle>
        <CardDescription>{descripcion}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Placeholder — reemplazar por las pantallas reales del sprint correspondiente
        (ver <code>PROGRESS.md</code> en la raíz del repo).
      </CardContent>
    </Card>
  );
}
