import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "net";
import type { Server } from "http";
import express from "express";

// Solo se prueba quien puede entrar a cada ruta: los controladores se reemplazan por respuestas fijas.
vi.mock("../controllers/SolicitudPasswordController", () => {
  const ok = (cual: string) => (_req: unknown, res: { json: (cuerpo: unknown) => void }) => res.json({ cual });
  return { SolicitudPasswordController: { solicitar: ok("solicitar"), listar: ok("listar"), aprobar: ok("aprobar"), rechazar: ok("rechazar") } };
});
vi.mock("../controllers/AuthController", () => ({ AuthController: { login: vi.fn(), cambiarPassword: vi.fn() } }));

import { solicitudesPasswordRouter } from "./solicitudesPassword.routes";
import { authRouter } from "./auth.routes";
import { signToken } from "../utils/jwt";

function tokenDe(...roles: string[]) {
  return signToken({ sub: 7, numeroCuenta: "A1", correo: "a@x.mx", tipoCuenta: roles[0] as never, roles, jti: "j", debeCambiarPassword: false });
}

let servidor: Server;
let base = "";

beforeAll(async () => {
  process.env.JWT_SECRET = "secreto-de-prueba";
  const app = express();
  app.use(express.json());
  app.use("/auth", authRouter);
  app.use("/solicitudes-password", solicitudesPasswordRouter);
  await new Promise<void>((resolve) => {
    servidor = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
});

afterAll(() => {
  servidor.close();
});

async function codigo(metodo: "GET" | "POST", ruta: string, token?: string, cuerpo?: object) {
  const respuesta = await fetch(base + ruta, {
    method: metodo,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  return respuesta.status;
}

const RUTAS_DE_GESTION: ["GET" | "POST", string][] = [
  ["GET", "/solicitudes-password"],
  ["POST", "/solicitudes-password/5/aprobar"],
  ["POST", "/solicitudes-password/5/rechazar"],
];

describe("permisos de /api/solicitudes-password", () => {
  it("sin sesion todas las rutas de gestion responden 401", async () => {
    for (const [metodo, ruta] of RUTAS_DE_GESTION) expect(await codigo(metodo, ruta), ruta).toBe(401);
  });

  it("alumnos y docentes reciben 403: no pueden ver ni resolver solicitudes", async () => {
    for (const rol of ["Estudiante", "Docente"]) {
      for (const [metodo, ruta] of RUTAS_DE_GESTION) expect(await codigo(metodo, ruta, tokenDe(rol)), `${rol} ${ruta}`).toBe(403);
    }
  });

  it("coordinador y administrador entran a las tres rutas", async () => {
    for (const rol of ["Coordinador", "Administrador"]) {
      for (const [metodo, ruta] of RUTAS_DE_GESTION) expect(await codigo(metodo, ruta, tokenDe(rol)), `${rol} ${ruta}`).toBe(200);
    }
  });
});

describe("POST /api/auth/solicitar-cambio-password", () => {
  it("es publica: se puede mandar sin sesion", async () => {
    expect(await codigo("POST", "/auth/solicitar-cambio-password", undefined, { numeroCuenta: "A1", nuevaPassword: "ClaveNueva123" })).toBe(200);
  });

  it("limita las solicitudes de una misma cuenta desde la misma IP (3 y luego 429)", async () => {
    const cuerpo = { numeroCuenta: "LIMITE1", nuevaPassword: "ClaveNueva123" };
    const codigos: number[] = [];
    for (let i = 0; i < 4; i++) codigos.push(await codigo("POST", "/auth/solicitar-cambio-password", undefined, cuerpo));
    expect(codigos).toEqual([200, 200, 200, 429]);
  });
});
