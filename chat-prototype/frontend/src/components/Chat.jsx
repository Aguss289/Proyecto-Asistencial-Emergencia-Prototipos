import { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";

export function Chat({ solicitudId, usuario, rol }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const {
    mensajes,
    conectado,
    escribiendo,
    otroDesconectado,
    enviarMensaje,
    notificarEscribiendo,
    notificarDejoDeEscribir,
  } = useChat(solicitudId, usuario, rol);

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, escribiendo]);

  const handleEnviar = () => {
    if (!input.trim()) return;
    enviarMensaje(input.trim());
    setInput("");
    notificarDejoDeEscribir();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    notificarEscribiendo();
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(notificarDejoDeEscribir, 1500);
  };

  const esPropio = (msg) => msg.autor === usuario;

  const formatHora = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  };

  const colorBurbuja = (msg) => {
    if (esPropio(msg)) return styles.burbujaMia;
    return msg.rol === "medico" ? styles.burbujamedico : styles.burbujaSocio;
  };

  return (
    <div style={styles.contenedor}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <strong>Solicitud #{solicitudId}</strong>
          <span style={styles.rolTag}>{rol === "medico" ? "Médico" : "Socio"}: {usuario}</span>
        </div>
        <div style={{ ...styles.dot, background: conectado ? "#22c55e" : "#ef4444" }}>
          {conectado ? "● Conectado" : "● Desconectado"}
        </div>
      </div>

      {/* Banner desconexión */}
      {otroDesconectado && (
        <div style={styles.bannerDesconectado}>
          ⚠️ {otroDesconectado.usuario} ({otroDesconectado.rol === "medico" ? "Médico" : "Socio"}) se desconectó
        </div>
      )}

      {/* Mensajes */}
      <div style={styles.mensajes}>
        {mensajes.length === 0 && (
          <p style={styles.vacio}>No hay mensajes aún. Empezá la conversación.</p>
        )}
        {mensajes.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.burbujaWrapper,
              justifyContent: esPropio(msg) ? "flex-end" : "flex-start",
            }}
          >
            <div style={colorBurbuja(msg)}>
              {!esPropio(msg) && (
                <div style={styles.nombreAutor}>
                  {msg.autor} · {msg.rol === "medico" ? "Médico" : "Socio"}
                </div>
              )}
              <div>{msg.contenido}</div>
              <div style={styles.hora}>{formatHora(msg.timestamp)}</div>
            </div>
          </div>
        ))}
        {escribiendo && (
          <div style={styles.burbujaWrapper}>
            <div style={styles.typing}>{escribiendo} está escribiendo...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <textarea
          style={styles.textarea}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribí un mensaje... (Enter para enviar)"
          rows={2}
          disabled={!conectado}
        />
        <button
          style={{ ...styles.boton, opacity: conectado ? 1 : 0.5 }}
          onClick={handleEnviar}
          disabled={!conectado}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

const styles = {
  contenedor: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    fontFamily: "sans-serif",
    background: "#f8fafc",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
  },
  header: {
    background: "#1e40af",
    color: "white",
    padding: "12px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rolTag: {
    marginLeft: 10,
    fontSize: 13,
    background: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: "2px 10px",
  },
  dot: {
    fontSize: 12,
    borderRadius: 20,
    padding: "3px 10px",
    color: "white",
  },
  mensajes: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  vacio: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: 40,
  },
  burbujaWrapper: {
    display: "flex",
    width: "100%",
  },
  burbujaMia: {
    background: "#2563eb",
    color: "white",
    borderRadius: "16px 16px 4px 16px",
    padding: "10px 14px",
    maxWidth: "70%",
    fontSize: 14,
  },
  burbujamedico: {
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "16px 16px 16px 4px",
    padding: "10px 14px",
    maxWidth: "70%",
    fontSize: 14,
  },
  burbujaSocio: {
    background: "white",
    color: "#1e293b",
    borderRadius: "16px 16px 16px 4px",
    padding: "10px 14px",
    maxWidth: "70%",
    fontSize: 14,
    border: "1px solid #e2e8f0",
  },
  nombreAutor: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 4,
    opacity: 0.7,
  },
  hora: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 4,
    textAlign: "right",
  },
  typing: {
    fontSize: 12,
    color: "#64748b",
    fontStyle: "italic",
    padding: "4px 12px",
    background: "#e2e8f0",
    borderRadius: 12,
  },
  bannerDesconectado: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    textAlign: "center",
    borderBottom: "1px solid #fde68a",
  },
  inputArea: {
    display: "flex",
    gap: 8,
    padding: "12px 16px",
    borderTop: "1px solid #e2e8f0",
    background: "white",
  },
  textarea: {
    flex: 1,
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 14,
    resize: "none",
    outline: "none",
    fontFamily: "sans-serif",
  },
  boton: {
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "0 20px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
};
