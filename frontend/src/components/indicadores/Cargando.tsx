/** Esqueleto de carga que además se anuncia a los lectores de pantalla. */
export function Cargando() {
  return (
    <div role="status" aria-busy className="h-64 animate-pulse rounded-xl bg-card">
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
