import { Request, Response } from "express";
import {
  AuthService,
  CredencialesInvalidasError,
  TokenRecuperacionInvalidoError,
} from "../services/AuthService";

const MENSAJE_RECUPERACION_GENERICO =
  "Si el correo esta registrado, se envio un enlace de recuperacion.";

export const AuthController = {
  async login(req: Request, res: Response) {
    const { numeroCuenta, password } = req.body ?? {};

    if (typeof numeroCuenta !== "string" || typeof password !== "string" || !numeroCuenta || !password) {
      return res.status(400).json({ error: "numeroCuenta y password son requeridos" });
    }

    try {
      const resultado = await AuthService.login(numeroCuenta, password);
      return res.json(resultado);
    } catch (error) {
      if (error instanceof CredencialesInvalidasError) {
        return res.status(401).json({ error: "Numero de cuenta o contrasena incorrectos" });
      }
      throw error;
    }
  },

  async forgotPassword(req: Request, res: Response) {
    const { correo } = req.body ?? {};

    if (typeof correo !== "string" || !correo) {
      return res.status(400).json({ error: "correo es requerido" });
    }

    const urlBaseFrontend = process.env.FRONTEND_URL ?? "http://localhost:5173";
    await AuthService.solicitarRecuperacion(correo, urlBaseFrontend);

    return res.json({ mensaje: MENSAJE_RECUPERACION_GENERICO });
  },

  async resetPassword(req: Request, res: Response) {
    const { token, nuevaPassword } = req.body ?? {};

    if (typeof token !== "string" || typeof nuevaPassword !== "string" || !token || !nuevaPassword) {
      return res.status(400).json({ error: "token y nuevaPassword son requeridos" });
    }

    if (nuevaPassword.length < 8) {
      return res.status(400).json({ error: "nuevaPassword debe tener al menos 8 caracteres" });
    }

    try {
      await AuthService.restablecerPassword(token, nuevaPassword);
      return res.json({ mensaje: "Contrasena actualizada. Las sesiones anteriores fueron cerradas." });
    } catch (error) {
      if (error instanceof TokenRecuperacionInvalidoError) {
        return res.status(400).json({ error: "Token invalido o expirado" });
      }
      throw error;
    }
  },
};
