import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";
import { apiGetHistorial, apiEnviarMensaje, apiSubirArchivo } from "../services/api.js";

/**
 * useChat — maneja mensajes en tiempo real y expone la interfaz de broadcast
 * del canal Supabase para que useVideoCall la reutilice sin abrir una segunda
 * conexión Realtime.
 *
 * Broadcast: todos los eventos de videollamada usan el event name "videocall"
 * con un campo `type` en el payload para distinguirlos.
 */
export function useChat(canalId, token) {
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const ultimoIdRef = useRef(null);

  // Ref al canal Supabase — compartido con useVideoCall vía sendBroadcast/setOnBroadcast
  const channelRef = useRef(null);
  // Callback registrado por useVideoCall para recibir eventos de videollamada
  const onBroadcastRef = useRef(null);

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

  // Canal Supabase único: maneja mensajes (postgres_changes) Y videollamadas (broadcast)
  useEffect(() => {
    if (!canalId) return;

    const channel = supabase
      .channel(`canal-${canalId}`)
      // ── Mensajes en tiempo real ──────────────────────────────────────────
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensajes" },
        ({ new: row }) => {
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
      // ── Señalización de videollamada (broadcast) ─────────────────────────
      // Todos los eventos de videollamada viajan bajo el event name "videocall"
      // para no necesitar múltiples .on() ni una segunda conexión Realtime.
      .on("broadcast", { event: "videocall" }, ({ payload }) => {
        onBroadcastRef.current?.(payload);
      })
      .subscribe((status) => {
        console.log("[Realtime] estado:", status);
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [canalId]);

  // Polling de respaldo cada 4 segundos
  useEffect(() => {
    if (!canalId || !token) return;
    const intervalo = setInterval(async () => {
      try {
        const data = await apiGetHistorial(canalId, token);
        setMensajes((prev) => {
          if (data.length === prev.length) return prev;
          if (data.length > 0) ultimoIdRef.current = data[data.length - 1].id;
          return data;
        });
      } catch { /* silencioso */ }
    }, 4000);
    return () => clearInterval(intervalo);
  }, [canalId, token]);

  // ── Mensajes ─────────────────────────────────────────────────────────────

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

  // ── Interfaz de broadcast para useVideoCall ───────────────────────────────

  /**
   * Envía un evento de videollamada por el canal compartido.
   * useVideoCall llama a esto en lugar de tener su propio channel.send().
   */
  const sendBroadcast = useCallback((type, payload) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "videocall",
      payload: { type, ...payload },
    });
  }, []);

  /**
   * useVideoCall registra aquí su handler para recibir eventos de videollamada.
   * Usar un ref evita re-suscripciones al canal cuando cambia el callback.
   */
  const setOnBroadcast = useCallback((fn) => {
    onBroadcastRef.current = fn;
  }, []);

  return { mensajes, cargando, error, enviarTexto, enviarArchivo, sendBroadcast, setOnBroadcast };
}
