import { describe, expect, it } from "vitest";
import { diasRestantes } from "./fechas";

// 09:00 en Ciudad de Mexico (UTC-6).
const AHORA = new Date("2026-11-10T15:00:00Z");

describe("diasRestantes (dias de calendario en hora de Mexico)", () => {
  it("es 0 cuando el cierre es hoy, aunque falten pocas horas", () => {
    expect(diasRestantes(AHORA, new Date("2026-11-11T05:00:00Z"))).toBe(0); // 23:00 de hoy en Mexico
  });

  it("es 1 cuando el cierre es manana", () => {
    expect(diasRestantes(AHORA, new Date("2026-11-11T20:00:00Z"))).toBe(1);
  });

  it("cuenta dias de calendario, no bloques de 24 h: cierre a las 23:59 del dia 17 son 7 dias el dia 10", () => {
    expect(diasRestantes(AHORA, new Date("2026-11-18T05:59:00Z"))).toBe(7); // 17-nov 23:59 en Mexico
  });

  it("usa la fecha local de Mexico, no la UTC", () => {
    // 03:00 UTC del dia 11 todavia es la noche del dia 10 en Mexico.
    expect(diasRestantes(AHORA, new Date("2026-11-11T03:00:00Z"))).toBe(0);
  });

  it("es negativo cuando ya paso", () => {
    expect(diasRestantes(AHORA, new Date("2026-11-08T20:00:00Z"))).toBe(-2);
  });
});
