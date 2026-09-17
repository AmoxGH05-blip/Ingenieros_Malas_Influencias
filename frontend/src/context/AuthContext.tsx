import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { login as loginRequest, type Usuario } from "@/lib/auth-api";

interface AuthContextValue {
  token: string | null;
  usuario: Usuario | null;
  isLoading: boolean;
  login: (numeroCuenta: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "dygsis.auth";

interface StoredAuth {
  token: string;
  usuario: Usuario;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored: StoredAuth = JSON.parse(raw);
      setToken(stored.token);
      setUsuario(stored.usuario);
    }
    setIsLoading(false);
  }, []);

  async function login(numeroCuenta: string, password: string) {
    const respuesta = await loginRequest(numeroCuenta, password);
    setToken(respuesta.token);
    setUsuario(respuesta.usuario);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(respuesta));
  }

  function logout() {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ token, usuario, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
