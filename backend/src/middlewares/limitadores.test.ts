import { afterEach, describe, expect, it } from "vitest";
import express from "express";
import type { AddressInfo } from "net";
import type { Server } from "http";
import { crearLimitadores } from "./limitadores";

let servidor: Server | null = null;

afterEach(() => {
  servidor?.close();
  servidor = null;
});

/** App minima: /login responde 401 si la contrasena no es "buena" y 200 si lo es; /cambiar usa el id del usuario del header. */
async function levantar(opciones = {}) {
  const limitadores = crearLimitadores(opciones);
  const app = express();
  app.use(express.json());
  app.post("/login", limitadores.loginPorIp, limitadores.loginPorCuenta, (req, res) => {
    res.status(req.body?.password === "buena" ? 200 : 401).json({});
  });
  app.post(
    "/cambiar",
    (req, _res, next) => {
      req.usuarioId = Number(req.header("x-usuario"));
      next();
    },
    limitadores.cambioPassword,
    (req, res) => res.status(req.body?.password === "buena" ? 200 : 400).json({})
  );
  app.post(
    "/gestion",
    (req, _res, next) => {
      req.usuarioId = Number(req.header("x-usuario"));
      next();
    },
    limitadores.gestion,
    (_req, res) => res.json({})
  );
  app.post("/recuperar", limitadores.recuperacion, (_req, res) => res.json({}));
  await new Promise<void>((listo) => {
    servidor = app.listen(0, listo);
  });
  const base = `http://127.0.0.1:${(servidor!.address() as AddressInfo).port}`;
  const post = async (ruta: string, cuerpo: object, cabeceras: Record<string, string> = {}) =>
    (await fetch(base + ruta, { method: "POST", headers: { "Content-Type": "application/json", ...cabeceras }, body: JSON.stringify(cuerpo) })).status;
  return { post };
}

describe("limitadores de intentos", () => {
  it("bloquea con 429 tras 5 intentos fallidos de la misma cuenta desde la misma IP", async () => {
    const { post } = await levantar();
    for (let i = 0; i < 5; i++) expect(await post("/login", { numeroCuenta: "A1", password: "mala" })).toBe(401);
    expect(await post("/login", { numeroCuenta: "A1", password: "mala" })).toBe(429);
    // Una vez bloqueada, ni la contrasena correcta pasa (si no, el limite no serviria contra la fuerza bruta).
    expect(await post("/login", { numeroCuenta: "A1", password: "buena" })).toBe(429);
  });

  it("no cuenta el mayusculas/minusculas ni los espacios como otra cuenta", async () => {
    const { post } = await levantar();
    for (let i = 0; i < 5; i++) await post("/login", { numeroCuenta: i % 2 ? " a1 " : "A1", password: "mala" });
    expect(await post("/login", { numeroCuenta: "a1", password: "mala" })).toBe(429);
  });

  it("otra cuenta no queda bloqueada por los fallos de la primera", async () => {
    const { post } = await levantar();
    for (let i = 0; i < 6; i++) await post("/login", { numeroCuenta: "A1", password: "mala" });
    expect(await post("/login", { numeroCuenta: "B2", password: "buena" })).toBe(200);
  });

  it("los inicios de sesion correctos no cuentan para el limite", async () => {
    const { post } = await levantar();
    for (let i = 0; i < 20; i++) expect(await post("/login", { numeroCuenta: "A1", password: "buena" })).toBe(200);
  });

  it("limita por IP aunque se cambie de cuenta en cada intento", async () => {
    const { post } = await levantar({ intentosLoginPorIp: 3 });
    for (let i = 0; i < 3; i++) expect(await post("/login", { numeroCuenta: `C${i}`, password: "mala" })).toBe(401);
    expect(await post("/login", { numeroCuenta: "C9", password: "mala" })).toBe(429);
  });

  it("el 429 trae un mensaje claro en JSON", async () => {
    const { post } = await levantar({ intentosLoginPorCuenta: 1 });
    await post("/login", { numeroCuenta: "A1", password: "mala" });
    const respuesta = await fetch(`http://127.0.0.1:${(servidor!.address() as AddressInfo).port}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numeroCuenta: "A1", password: "mala" }),
    });
    expect(respuesta.status).toBe(429);
    expect((await respuesta.json()).error).toMatch(/Demasiados intentos/);
  });

  it("cambiar contrasena: limita por usuario, no por IP", async () => {
    const { post } = await levantar({ intentosCambioPassword: 3 });
    for (let i = 0; i < 3; i++) expect(await post("/cambiar", { password: "mala" }, { "x-usuario": "7" })).toBe(400);
    expect(await post("/cambiar", { password: "mala" }, { "x-usuario": "7" })).toBe(429);
    expect(await post("/cambiar", { password: "buena" }, { "x-usuario": "8" })).toBe(200);
  });

  it("detras de Cloudflare cuenta por la IP real del cliente (CF-Connecting-IP), no por la del borde, que cambia entre peticiones", async () => {
    const { post } = await levantar({ intentosLoginPorCuenta: 3 });
    const desde = (ip: string) => ({ "cf-connecting-ip": ip });
    for (let i = 0; i < 3; i++) expect(await post("/login", { numeroCuenta: "A1", password: "mala" }, desde("203.0.113.7"))).toBe(401);
    expect(await post("/login", { numeroCuenta: "A1", password: "mala" }, desde("203.0.113.7"))).toBe(429);
    // Otro cliente con la misma cuenta no queda bloqueado por los fallos del primero.
    expect(await post("/login", { numeroCuenta: "A1", password: "mala" }, desde("203.0.113.8"))).toBe(401);
  });

  it("si CF-Connecting-IP no es una IP valida, la ignora y usa la del socket", async () => {
    const { post } = await levantar({ intentosLoginPorCuenta: 2 });
    for (let i = 0; i < 2; i++) await post("/login", { numeroCuenta: "A1", password: "mala" }, { "cf-connecting-ip": `basura-${i}` });
    expect(await post("/login", { numeroCuenta: "A1", password: "mala" }, { "cf-connecting-ip": "otra-basura" })).toBe(429);
  });

  it("gestion (altas, grupos, catalogos): limita las peticiones por usuario, salgan bien o mal", async () => {
    const { post } = await levantar({ intentosGestion: 3 });
    for (let i = 0; i < 3; i++) expect(await post("/gestion", { password: "buena" }, { "x-usuario": "7" })).toBe(200);
    expect(await post("/gestion", { password: "buena" }, { "x-usuario": "7" })).toBe(429);
    expect(await post("/gestion", { password: "buena" }, { "x-usuario": "8" })).toBe(200);
  });

  it("recuperacion por correo: limita por IP", async () => {
    const { post } = await levantar({ intentosRecuperacion: 2 });
    expect(await post("/recuperar", {})).toBe(200);
    expect(await post("/recuperar", {})).toBe(200);
    expect(await post("/recuperar", {})).toBe(429);
  });
});
