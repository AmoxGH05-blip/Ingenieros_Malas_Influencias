import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "net";
import type { Server } from "http";
import express from "express";

// Solo se prueba quien puede entrar: el controlador se reemplaza por una respuesta fija.
vi.mock("../controllers/EstadisticaController", () => ({
  EstadisticaController: { institucional: (_req: unknown, res: { json: (cuerpo: unknown) => void }) => res.json({ ok: true }) },
}));

import { estadisticasRouter } from "./estadisticas.routes";
import { signToken } from "../utils/jwt";

function tokenDe(...roles: string[]) {
  return signToken({ sub: 7, numeroCuenta: "A1", correo: "a@x.mx", tipoCuenta: roles[0] as never, roles, jti: "j", debeCambiarPassword: false });
}

let servidor: Server;
let base = "";

beforeAll(async () => {
  process.env.JWT_SECRET = "secreto-de-prueba";
  const app = express();
  app.use("/estadisticas", estadisticasRouter);
  await new Promise<void>((resolve) => {
    servidor = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}/estadisticas`;
});

afterAll(() => {
  servidor.close();
});

async function pedir(token?: string) {
  return (await fetch(`${base}/institucional`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })).status;
}

describe("permisos de /api/estadisticas/institucional", () => {
  it("sin sesion responde 401", async () => {
    expect(await pedir()).toBe(401);
  });

  it("alumnos y docentes reciben 403: las cifras de toda la institucion son de coordinacion", async () => {
    expect(await pedir(tokenDe("Estudiante"))).toBe(403);
    expect(await pedir(tokenDe("Docente"))).toBe(403);
  });

  it("coordinador y administrador entran", async () => {
    expect(await pedir(tokenDe("Coordinador"))).toBe(200);
    expect(await pedir(tokenDe("Administrador"))).toBe(200);
  });
});
