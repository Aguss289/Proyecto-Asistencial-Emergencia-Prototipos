import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { apiGetHistorial, apiEnviarMensaje, apiSubirArchivo } from "../services/api.js";

export function useChat(canalId, token) {
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const ultimoIdRef = useRef(null);

  const cargarHistorial = async () => {
    try {
      const data = await apiGetHistorial(canalId, token);
      setMensajes(data);
      if (data.length > 0) ultimoIdRef.current = data[data.length - 1].id;
    } catch (err) {
      setError(err.message);
    }
  };

  // Carga inicial
  useEffect(() => {
    if (!canalId || !token) return;
    setCargando(true);
    cargarHistorial().finally(() => setCargando(false));
  }, [canalId, token]);

  // Realtime — sin filtro server-side (más compatible con las keys nuevas de Supabase)
  // El filtrado por canal_id se hace en el cliente
  useEffect(() => {
    if (!canalId) return;

    const channel = supabase
      .channel(`mensajes-sala-${canalId}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensajes" },
        ({ new: row }) => {
          // Ignorar mensajes de otros canales
          if (row.canal_id !== canalId) return;

          setMensajes((prev) => {
            if (prev.find((m) => m.id === row.id)) return prev;
            const nuevo = {
              id: row.id,
              canalId: row.canal_id,
              autorId: row.autor_id,
              autorNombre: row.autor_nombre ?? "...",
              autorRol: row.autor_rol ?? "socio",
              tipo: row.tipo,
              contenido: row.contenido,
              creadoEn: row.creado_en,
            };
            ultimoIdRef.current = row.id;
            return [...prev, nuevo];
          });
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] estado:", status);
      });

    return () => supabase.removeChannel(channel);
  }, [canalId]);

  // Polling de respaldo cada 4 segundos — garantiza que los mensajes lleguen
  // aunque el Realtime falle o esté configurando
  useEffect(() => {
    if (!canalId || !token) return;

    const intervalo = setInterval(async () => {
      try {
        const data = await apiGetHistorial(canalId, token);
        setMensajes((prev) => {
          // Solo actualiza si hay mensajes nuevos (evita re-renders innecesarios)
          if (data.length === prev.length) return prev;
          if (data.length > 0) ultimoIdRef.current = data[data.length - 1].id;
          return data;
        });
      } catch {
        // silencioso
      }
    }, 4000);

    return () => clearInterval(intervalo);
  }, [canalId, token]);

  const enviarTexto = async (contenido) => {
    try {
      const msg = await apiEnviarMensaje({ canalId, contenido, token });
      setMensajes((prev) => (prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const enviarArchivo = async (archivo) => {
    try {
      const msg = await apiSubirArchivo({ canalId, archivo, token });
      setMensajes((prev) => (prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { mensajes, cargando, error, enviarTexto, enviarArchivo };
}
