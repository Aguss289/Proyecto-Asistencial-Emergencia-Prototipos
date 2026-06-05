import { useState } from "react";
import { apiLogin, apiRegistrar } from "../services/api.js";

/**
 * Hook: useAuth
 * Maneja la sesión del usuario en memoria (sin localStorage).
 * Retorna: { sesion, login, registrar, logout, error, cargando }
 * sesion = { usuario: {...}, token: "..." } | null
 */
export function useAuth() {
  const [sesion, setSesion] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const login = async (credenciales) => {
    setError(null);
    setCargando(true);
    try {
      const result = await apiLogin(credenciales);
      setSesion(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const registrar = async (datos) => {
    setError(null);
    setCargando(true);
    try {
      const result = await apiRegistrar(datos);
      setSesion(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const logout = () => setSesion(null);

  return { sesion, login, registrar, logout, error, cargando };
}
