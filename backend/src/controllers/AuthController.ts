import { Request, Response } from "express";
import { AuthService, CredencialesInvalidasError } from "../services/AuthService";

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
};
