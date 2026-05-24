import { useEffect, useRef, useState } from "react";
import { useChat, BACKEND_URL } from "../hooks/useChat";

export function Chat({ solicitudId, usuario, rol }) {
  const [input, setInput] = useState("");
  const [archivoPreview, setArchivoPreview] = useState(null); // { file, url, tipo }
  const [subiendo, setSubiendo] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, escribiendo]);

  const handleEnviarTexto = () => {
    if (!input.trim()) return;
    enviarMensaje(input.trim());
    setInput("");
    notificarDejoDeEscribir();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviarTexto();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    notificarEscribiendo();
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(notificarDejoDeEscribir, 1500);
  };

  const handleArchivoSeleccionado = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const tipo = file.type.startsWith("video") ? "video" : "imagen";
    setArchivoPreview({ file, url, tipo });
    e.target.value = ""; // reset input
  };

  const handleEnviarArchivo = async () => {
    if (!archivoPreview || subiendo) return;
    setSubiendo(true);

    const formData = new FormData();
    formData.append("archivo", archivoPreview.file);
    formData.append("solicitudId", solicitudId);
    formData.append("autor", usuario);
    formData.append("rol", rol);

    try {
      await fetch(`${BACKEND_URL}/upload`, { method: "POST", body: formData });
      setArchivoPreview(null);
    } catch (err) {
      alert("Error al subir el archivo");
    } finally {
      setSubiendo(false);
    }
  };

  const cancelarArchivo = () => {
    URL.revokeObjectURL(archivoPreview?.url);
    setArchivoPreview(null);
  };

  const esPropio = (msg) => msg.autor === usuario;

  const formatHora = (iso) =>
    new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  const colorBurbuja = (msg) => {
    if (esPropio(msg)) return styles.burbujaMia;
    return msg.rol === "medico" ? styles.burbujaMedico : styles.burbujaSocio;
  };

  const renderContenido = (msg) => {
    if (msg.tipo === "imagen") {
      return (
        <img
          src={msg.contenido}
          alt="imagen"
          style={styles.mediaImg}
          onClick={() => window.open(msg.contenido, "_blank")}
        />
      );
    }
    if (msg.tipo === "video") {
      return (
        <video src={msg.contenido} controls style={styles.mediaVideo} />
      );
    }
    return <div>{msg.contenido}</div>;
  };

  return (
    <div style={styles.contenedor}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <strong>Solicitud #{solicitudId}</strong>
          <span style={styles.rolTag}>
            {rol === "medico" ? "Médico" : "Socio"}: {usuario}
          </span>
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
              {renderContenido(msg)}
              <div style={styles.hora}>{formatHora(msg.creadoEn)}</div>
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

      {/* Preview de archivo */}
      {archivoPreview && (
        <div style={styles.previewArea}>
          {archivoPreview.tipo === "imagen" ? (
            <img src={archivoPreview.url} alt="preview" style={styles.previewImg} />
          ) : (
            <video src={archivoPreview.url} style={styles.previewImg} controls />
          )}
          <div style={styles.previewBotones}>
            <button style={styles.btnCancelar} onClick={cancelarArchivo}>✕ Cancelar</button>
            <button
              style={{ ...styles.btnEnviarArchivo, opacity: subiendo ? 0.6 : 1 }}
              onClick={handleEnviarArchivo}
              disabled={subiendo}
            >
              {subiendo ? "Subiendo..." : "Enviar"}
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div style={styles.inputArea}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*,video/*"
          onChange={handleArchivoSeleccionado}
        />
        <button
          style={styles.btnClip}
          onClick={() => fileInputRef.current.click()}
          disabled={!conectado}
          title="Adjuntar foto o video"
        >
          📎
        </button>
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
          onClick={handleEnviarTexto}
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
  bannerDesconectado: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    textAlign: "center",
    borderBottom: "1px solid #fde68a",
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
  burbujaMedico: {
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
  mediaImg: {
    maxWidth: "100%",
    maxHeight: 240,
    borderRadius: 8,
    cursor: "pointer",
    display: "block",
  },
  mediaVideo: {
    maxWidth: "100%",
    maxHeight: 240,
    borderRadius: 8,
    display: "block",
  },
  previewArea: {
    padding: "10px 16px",
    background: "#f1f5f9",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  previewImg: {
    height: 64,
    width: "auto",
    borderRadius: 8,
    objectFit: "cover",
  },
  previewBotones: {
    display: "flex",
    gap: 8,
  },
  btnCancelar: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: 8,
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  btnEnviarArchivo: {
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  inputArea: {
    display: "flex",
    gap: 8,
    padding: "12px 16px",
    borderTop: "1px solid #e2e8f0",
    background: "white",
    alignItems: "flex-end",
  },
  btnClip: {
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "8px 10px",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: 1,
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
    height: 40,
  },
};
