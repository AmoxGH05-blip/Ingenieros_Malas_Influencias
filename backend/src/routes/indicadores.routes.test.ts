import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "net";
import type { Server } from "http";
import express from "express";

// Solo se prueba quien puede entrar a cada ruta: los controladores se reemplazan por respuestas fijas.
vi.mock("../controllers/IndicadorController", () => {
  const ok = (cual: string) => (_req: unknown, res: { json: (cuerpo: unknown) => void }) => res.json({ cual });
  return { IndicadorController: { ranking: ok("ranking"), historico: ok("historico"), mio: ok("mio") } };
});

import { indicadoresRouter } from "./indicadores.routes";
import { signToken } from "../utils/jwt";

function tokenDe(...roles: string[]) {
  return signToken({
    sub: 7,
    numeroCuenta: "A1",
    correo: "a@x.mx",
    tipoCuenta: roles[0] as never,
    roles,
    jti: "j",
    debeCambiarPassword: false,
  });
}

let servidor: Server;
let base = "";

beforeAll(async () => {
  process.env.JWT_SECRET = "secreto-de-prueba";
  const app = express();
  app.use("/indicadores", indicadoresRouter);
  await new Promise<void>((resolve) => {
    servidor = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}/indicadores`;
});

afterAll(() => {
  servidor.close();
});

async function codigo(ruta: string, token?: string) {
  const respuesta = await fetch(base + ruta, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return respuesta.status;
}

const RUTAS_DE_COORDINACION = ["/docentes", "/docentes/1/historico"];

describe("permisos de /api/indicadores", () => {
  it("sin sesion todas las rutas responden 401", async () => {
    for (const ruta of ["/mio", ...RUTAS_DE_COORDINACION]) {
      expect(await codigo(ruta), ruta).toBe(401);
    }
  });

  it("un docente solo entra a /mio: el ranking y el historico de otros le dan 403", async () => {
    const token = tokenDe("Docente");
    expect(await codigo("/mio", token)).toBe(200);
    for (const ruta of RUTAS_DE_COORDINACION) expect(await codigo(ruta, token), ruta).toBe(403);
  });

  it("un estudiante recibe 403 en todas las rutas", async () => {
    const token = tokenDe("Estudiante");
    for (const ruta of ["/mio", ...RUTAS_DE_COORDINACION]) expect(await codigo(ruta, token), ruta).toBe(403);
  });

  it("coordinador y administrador ven el ranking y el historico, pero no /mio", async () => {
    for (const rol of ["Coordinador", "Administrador"]) {
      const token = tokenDe(rol);
      for (const ruta of RUTAS_DE_COORDINACION) expect(await codigo(ruta, token), `${rol} ${ruta}`).toBe(200);
      expect(await codigo("/mio", token), `${rol} /mio`).toBe(403);
    }
  });

  it("una cuenta con rol de docente y de coordinador entra a las dos", async () => {
    const token = tokenDe("Docente", "Coordinador");
    expect(await codigo("/mio", token)).toBe(200);
    expect(await codigo("/docentes", token)).toBe(200);
  });
});
