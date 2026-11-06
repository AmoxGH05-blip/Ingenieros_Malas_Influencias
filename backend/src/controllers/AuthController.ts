import { Request, Response } from "express";
import {
  AuthService,
  CredencialesInvalidasError,
  PasswordActualIncorrectaError,
  PasswordNuevaInvalidaError,
} from "../services/AuthService";
import { MENSAJE_POLITICA_PASSWORD } from "../utils/password";

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

  async cambiarPassword(req: Request, res: Response) {
    const { passwordActual, nuevaPassword } = req.body ?? {};

    if (typeof passwordActual !== "string" || typeof nuevaPassword !== "string" || !passwordActual || !nuevaPassword) {
      return res.status(400).json({ error: "passwordActual y nuevaPassword son requeridos" });
    }

    try {
      return res.json(await AuthService.cambiarPassword(req.usuarioId!, passwordActual, nuevaPassword));
    } catch (error) {
      if (error instanceof PasswordActualIncorrectaError) {
        return res.status(400).json({ error: "La contrasena actual no es correcta" });
      }
      if (error instanceof PasswordNuevaInvalidaError) {
        return res.status(400).json({ error: `${MENSAJE_POLITICA_PASSWORD}, y debe ser distinta de la actual` });
      }
      if (error instanceof CredencialesInvalidasError) {
        return res.status(401).json({ error: "Sesion invalida" });
      }
      throw error;
    }
  },
};
