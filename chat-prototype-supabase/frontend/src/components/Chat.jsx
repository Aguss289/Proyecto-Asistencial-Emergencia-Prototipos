import { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat.js";

export function Chat({ canal, sesion, onVolver }) {
  const [input, setInput] = useState("");
  const [archivo, setArchivo] = useState(null); // { file, url, tipo }
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  const { mensajes, cargando, enviarTexto, enviarArchivo } = useChat(canal.id, sesion.token);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const tipo = file.type.startsWith("video") ? "video" : "imagen";
    setArchivo({ file, url, tipo });
    e.target.value = "";
  };

  const cancelarArchivo = () => {
    URL.revokeObjectURL(archivo?.url);
    setArchivo(null);
  };

  // Un solo botón Enviar: manda texto y/o archivo juntos
  const handleEnviar = async () => {
    const texto = input.trim();
    if (!texto && !archivo) return;
    setEnviando(true);
    try {
      if (texto) await enviarTexto(texto);
      if (archivo) await enviarArchivo(archivo.file);
      setInput("");
      cancelarArchivo();
    } finally {
      setEnviando(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEnviar(); }
  };

  const esPropio = (msg) => msg.autorId === sesion.usuario.id;
  const hora = (iso) => new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  const colorBurbuja = (msg) => {
    if (esPropio(msg)) return s.mia;
    return msg.autorRol === "medico" ? s.medico : s.socio;
  };

  const renderContenido = (msg) => {
    if (msg.tipo === "imagen") {
      return (
        <img
          src={msg.contenido}
          alt="imagen"
          style={s.img}
          onClick={() => window.open(msg.contenido, "_blank")}
        />
      );
    }
    if (msg.tipo === "video") {
      return <video src={msg.contenido} controls style={s.img} />;
    }
    return <div>{msg.contenido}</div>;
  };

  return (
    <div style={s.layout}>
      {/* Header */}
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={s.back} onClick={onVolver}>←</button>
          <div>
            <strong>{canal.nombre}</strong>
            <span style={s.idBadge}>{canal.id.slice(0, 6).toUpperCase()}</span>
            {canal.descripcion && <span style={s.desc}> · {canal.descripcion}</span>}
          </div>
        </div>
        <span style={s.rolTag}>{sesion.usuario.nombre} · {sesion.usuario.rol}</span>
      </div>

      {/* Mensajes */}
      <div style={s.mensajes}>
        {cargando && <p style={s.hint}>Cargando historial...</p>}
        {!cargando && mensajes.length === 0 && (
          <p style={s.hint}>No hay mensajes. ¡Empezá la conversación!</p>
        )}
        {mensajes.map((msg) => (
          <div
            key={msg.id}
            style={{ ...s.wrap, justifyContent: esPropio(msg) ? "flex-end" : "flex-start" }}
          >
            <div style={colorBurbuja(msg)}>
              {!esPropio(msg) && (
                <div style={s.autor}>{msg.autorNombre} · {msg.autorRol}</div>
              )}
              {renderContenido(msg)}
              <div style={s.hora}>{hora(msg.creadoEn)}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Preview del archivo adjunto (solo cancelar, el envío va con el botón principal) */}
      {archivo && (
        <div style={s.previewArea}>
          {archivo.tipo === "imagen" ? (
            <img src={archivo.url} alt="preview" style={s.previewImg} />
          ) : (
            <video src={archivo.url} controls style={s.previewImg} />
          )}
          <button style={s.btnCancelarArchivo} onClick={cancelarArchivo}>
            ✕ Quitar
          </button>
        </div>
      )}

      {/* Input */}
      <div style={s.inputArea}>
        <input
          type="file"
          ref={fileRef}
          accept="image/*,video/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button style={s.clip} onClick={() => fileRef.current.click()} title="Adjuntar imagen o video">
          📎
        </button>
        <textarea
          style={s.textarea}
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={archivo ? "Agregá un texto o enviá solo la imagen…" : "Escribí un mensaje… (Enter para enviar)"}
        />
        <button
          style={{ ...s.btnEnviar, opacity: enviando ? 0.6 : 1 }}
          onClick={handleEnviar}
          disabled={enviando}
        >
          {enviando ? "..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}

const s = {
  layout: { height: "100vh", display: "flex", flexDirection: "column", fontFamily: "sans-serif", background: "#f8fafc" },
  header: { background: "#00B3A7", color: "white", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  back: { background: "transparent", border: "none", color: "white", cursor: "pointer", fontSize: 18, padding: 0 },
  idBadge: { marginLeft: 8, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.9)", background: "rgba(255,255,255,.2)", borderRadius: 6, padding: "2px 7px", letterSpacing: 1 },
  desc: { fontSize: 12, opacity: 0.7, marginLeft: 4 },
  rolTag: { fontSize: 12, background: "rgba(255,255,255,.2)", borderRadius: 20, padding: "3px 10px" },
  mensajes: { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 },
  hint: { textAlign: "center", color: "#94a3b8", marginTop: 40 },
  wrap: { display: "flex", width: "100%" },
  mia: { background: "#00B3A7", color: "white", borderRadius: "16px 16px 4px 16px", padding: "10px 14px", maxWidth: "70%", fontSize: 14 },
  medico: { background: "#dcfce7", color: "#166534", borderRadius: "16px 16px 16px 4px", padding: "10px 14px", maxWidth: "70%", fontSize: 14 },
  socio: { background: "white", color: "#1e293b", borderRadius: "16px 16px 16px 4px", padding: "10px 14px", maxWidth: "70%", fontSize: 14, border: "1px solid #e2e8f0" },
  autor: { fontSize: 11, fontWeight: 700, marginBottom: 4, opacity: 0.7 },
  hora: { fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: "right" },
  img: { maxWidth: "100%", maxHeight: 240, borderRadius: 8, cursor: "pointer", display: "block" },
  previewArea: {
    padding: "8px 16px",
    background: "#f0fdfc",
    borderTop: "1px solid #99f6e4",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  previewImg: { height: 56, borderRadius: 8, objectFit: "cover" },
  btnCancelarArchivo: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: 8,
    padding: "5px 12px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 12,
    fontFamily: "sans-serif",
  },
  inputArea: { display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid #e2e8f0", background: "white", alignItems: "flex-end" },
  clip: { background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 18 },
  textarea: { flex: 1, border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 14, resize: "none", outline: "none", fontFamily: "sans-serif" },
  btnEnviar: { background: "#31BAA8", color: "white", border: "none", borderRadius: 8, padding: "0 20px", cursor: "pointer", fontWeight: 700, fontSize: 14, height: 40 },
};
