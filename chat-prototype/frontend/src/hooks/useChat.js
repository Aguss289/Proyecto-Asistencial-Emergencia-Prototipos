import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const BACKEND_URL = "http://localhost:3001";

export function useChat(solicitudId, usuario, rol) {
  const socketRef = useRef(null);
  const [mensajes, setMensajes] = useState([]);
  const [conectado, setConectado] = useState(false);
  const [escribiendo, setEscribiendo] = useState(null);
  const [otroDesconectado, setOtroDesconectado] = useState(false);

  useEffect(() => {
    if (!solicitudId || !usuario || !rol) return;

    const socket = io(BACKEND_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConectado(true);
      socket.emit("joinRoom", { solicitudId, usuario, rol });
    });

    socket.on("disconnect", () => setConectado(false));

    socket.on("historial", (historial) => {
      setMensajes(historial);
    });

    socket.on("receiveMessage", (mensaje) => {
      setMensajes((prev) => [...prev, mensaje]);
    });

    socket.on("typing", ({ usuario: quien }) => {
      setEscribiendo(quien);
    });

    socket.on("stopTyping", () => {
      setEscribiendo(null);
    });

    socket.on("usuarioUnido", ({ usuario: quien }) => {
      setOtroDesconectado(false);
    });

    socket.on("usuarioDesconectado", ({ usuario: quien, rol: rolQuien }) => {
      setOtroDesconectado({ usuario: quien, rol: rolQuien });
      setEscribiendo(null);
    });

    return () => {
      socket.disconnect();
    };
  }, [solicitudId, usuario, rol]);

  const enviarMensaje = (contenido) => {
    if (!socketRef.current || !contenido.trim()) return;
    socketRef.current.emit("sendMessage", { solicitudId, contenido });
  };

  const notificarEscribiendo = () => {
    socketRef.current?.emit("typing", { solicitudId });
  };

  const notificarDejoDeEscribir = () => {
    socketRef.current?.emit("stopTyping", { solicitudId });
  };

  return {
    mensajes,
    conectado,
    escribiendo,
    otroDesconectado,
    enviarMensaje,
    notificarEscribiendo,
    notificarDejoDeEscribir,
  };
}
