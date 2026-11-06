import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "net";
import type { Server } from "http";
import express from "express";

// Solo se prueba quien puede entrar a cada ruta y como se validan los filtros: el servicio se reemplaza por respuestas fijas.
vi.mock("../services/CoordinacionService", () => ({
  CoordinacionService: {
    obtenerFiltros: vi.fn(async () => ({ periodos: [], programasEducativos: [], grupos: [] })),
    obtenerAvance: vi.fn(async () => ({ periodo: null, resumen: {}, porGrupo: [] })),
  },
}));

import { coordinacionRouter } from "./coordinacion.routes";
import { CoordinacionService } from "../services/CoordinacionService";
import { signToken } from "../utils/jwt";

function tokenDe(...roles: string[]) {
  return signToken({ sub: 7, numeroCuenta: "A1", correo: "a@x.mx", tipoCuenta: roles[0] as never, roles, jti: "j", debeCambiarPassword: false });
}

let servidor: Server;
let base = "";

beforeAll(async () => {
  process.env.JWT_SECRET = "secreto-de-prueba";
  const app = express();
  app.use("/coordinacion", coordinacionRouter);
  await new Promise<void>((resolve) => {
    servidor = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}/coordinacion`;
});

afterAll(() => {
  servidor.close();
});

async function pedir(ruta: string, token?: string) {
  return (await fetch(base + ruta, { headers: token ? { Authorization: `Bearer ${token}` } : {} })).status;
}

const RUTAS = ["/filtros", "/avance"];

describe("permisos de /api/coordinacion", () => {
  it("sin sesion responde 401", async () => {
    for (const ruta of RUTAS) expect(await pedir(ruta), ruta).toBe(401);
  });

  it("alumnos y docentes reciben 403: el avance de todos es de coordinacion", async () => {
    for (const rol of ["Estudiante", "Docente"]) {
      for (const ruta of RUTAS) expect(await pedir(ruta, tokenDe(rol)), `${rol} ${ruta}`).toBe(403);
    }
  });

  it("coordinador y administrador entran", async () => {
    for (const rol of ["Coordinador", "Administrador"]) {
      for (const ruta of RUTAS) expect(await pedir(ruta, tokenDe(rol)), `${rol} ${ruta}`).toBe(200);
    }
  });
});

describe("filtros de /api/coordinacion/avance", () => {
  const coordinador = () => tokenDe("Coordinador");

  it("pasa al servicio solo enteros positivos y deja sin definir los que no vienen", async () => {
    vi.mocked(CoordinacionService.obtenerAvance).mockClear();

    expect(await pedir("/avance?periodoId=3&programaEducativoId=2", coordinador())).toBe(200);

    expect(CoordinacionService.obtenerAvance).toHaveBeenCalledWith({ periodoId: 3, programaEducativoId: 2, grupoId: undefined });
  });

  it("rechaza con 400 un filtro que no es entero positivo, sin consultar al servicio", async () => {
    vi.mocked(CoordinacionService.obtenerAvance).mockClear();

    for (const malo of ["periodoId=abc", "grupoId=0", "grupoId=-1", "programaEducativoId=1.5"]) {
      expect(await pedir(`/avance?${malo}`, coordinador()), malo).toBe(400);
    }
    expect(CoordinacionService.obtenerAvance).not.toHaveBeenCalled();
  });
});
