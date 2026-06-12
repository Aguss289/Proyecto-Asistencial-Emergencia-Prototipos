import { useEffect, useRef, useState, useCallback } from "react";
import { apiIniciarVideollamada, apiFinalizarVideollamada } from "../services/api.js";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

/**
 * useVideoCall — maneja WebRTC para videollamadas 1-a-1.
 *
 * Ya NO crea su propio canal Supabase. En cambio recibe:
 *   - sendBroadcast(type, payload): envía eventos por el canal de useChat
 *   - setOnBroadcast(fn): registra el handler para recibir eventos
 *
 * Esto elimina la segunda conexión Realtime por usuario, duplicando la
 * capacidad del plan Supabase Pro (500 conexiones).
 *
 * estados:
 *   "idle"       → sin llamada activa
 *   "llamando"   → enviamos offer, esperando que el otro acepte
 *   "recibiendo" → llegó un offer, esperando acción del usuario local
 *   "en-llamada" → stream activo en ambos lados
 */
export function useVideoCall({ canalId, sesion, sendBroadcast, setOnBroadcast }) {
  const [estado, setEstado] = useState("idle");
  const [errorMedia, setErrorMedia] = useState(null);
  const [llamadaId, setLlamadaId] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingOfferRef = useRef(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // ── Helpers internos ─────────────────────────────────────────────────────

  const obtenerMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const crearPeerConnection = (stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      setEstado("en-llamada");
    };

    pc.onicecandidate = ({ candidate }) => {
      if (!candidate) return;
      sendBroadcast("ice-candidate", { candidate, de: sesion.usuario.id });
    };

    pc.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        limpiarLocal();
        setEstado("idle");
      }
    };

    return pc;
  };

  const limpiarLocal = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  // ── Acciones públicas ────────────────────────────────────────────────────

  const iniciarLlamada = useCallback(async () => {
    try {
      setErrorMedia(null);
      setEstado("llamando");

      const data = await apiIniciarVideollamada({ canalId, token: sesion.token });
      setLlamadaId(data.id);

      const stream = await obtenerMedia();
      const pc = crearPeerConnection(stream);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendBroadcast("offer", { sdp: offer, de: sesion.usuario.id, llamadaId: data.id });
    } catch (err) {
      limpiarLocal();
      setEstado("idle");
      setErrorMedia(
        err.message.includes("Permission") || err.message.includes("denied")
          ? "Permiso de cámara/micrófono denegado"
          : err.message
      );
    }
  }, [canalId, sesion, sendBroadcast]);

  const aceptarEntrante = useCallback(async () => {
    const offer = pendingOfferRef.current;
    if (!offer) return;
    pendingOfferRef.current = null;

    try {
      setErrorMedia(null);

      const stream = await obtenerMedia();
      const pc = crearPeerConnection(stream);

      await pc.setRemoteDescription(new RTCSessionDescription(offer.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendBroadcast("answer", { sdp: answer, de: sesion.usuario.id });
      setEstado("en-llamada");
    } catch (err) {
      limpiarLocal();
      setEstado("idle");
      setErrorMedia(
        err.message.includes("Permission") || err.message.includes("denied")
          ? "Permiso de cámara/micrófono denegado"
          : err.message
      );
    }
  }, [sesion, sendBroadcast]);

  const rechazarEntrante = useCallback(() => {
    const offer = pendingOfferRef.current;
    pendingOfferRef.current = null;

    sendBroadcast("colgar", { de: sesion.usuario.id });

    if (offer?.llamadaId) {
      apiFinalizarVideollamada({
        canalId,
        llamadaId: offer.llamadaId,
        estado: "rechazada",
        token: sesion.token,
      }).catch(() => {});
    }

    setEstado("idle");
  }, [canalId, sesion, sendBroadcast]);

  const colgar = useCallback(() => {
    sendBroadcast("colgar", { de: sesion.usuario.id });

    if (llamadaId) {
      apiFinalizarVideollamada({
        canalId,
        llamadaId,
        estado: "finalizada",
        token: sesion.token,
      }).catch(() => {});
      setLlamadaId(null);
    }

    limpiarLocal();
    setEstado("idle");
  }, [canalId, sesion, llamadaId, sendBroadcast]);

  // ── Registrar handler de broadcast en el canal compartido ─────────────────

  useEffect(() => {
    setOnBroadcast((payload) => {
      // Ignorar mensajes propios
      if (payload.de === sesion.usuario.id) return;

      const { type } = payload;

      if (type === "offer") {
        pendingOfferRef.current = payload;
        setEstado("recibiendo");
        return;
      }

      if (type === "answer") {
        if (pcRef.current) {
          pcRef.current
            .setRemoteDescription(new RTCSessionDescription(payload.sdp))
            .then(() => setEstado("en-llamada"))
            .catch(() => {});
        }
        return;
      }

      if (type === "ice-candidate") {
        if (pcRef.current && payload.candidate) {
          pcRef.current
            .addIceCandidate(new RTCIceCandidate(payload.candidate))
            .catch(() => {});
        }
        return;
      }

      if (type === "colgar") {
        limpiarLocal();
        pendingOfferRef.current = null;
        setEstado("idle");
        return;
      }
    });

    // Al desmontar, desregistrar el handler
    return () => setOnBroadcast(null);
  }, [sesion.usuario.id, setOnBroadcast]);

  return {
    estado,
    errorMedia,
    localVideoRef,
    remoteVideoRef,
    iniciarLlamada,
    aceptarEntrante,
    rechazarEntrante,
    colgar,
  };
}
