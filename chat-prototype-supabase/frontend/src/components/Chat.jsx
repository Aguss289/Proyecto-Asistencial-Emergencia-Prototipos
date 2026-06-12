import { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat.js";
import { useVideoCall } from "../hooks/useVideoCall.js";
import { VideoCall, LlamadaEntrante } from "./VideoCall.jsx";

export function Chat({ canal, sesion, onVolver }) {
  const [input, setInput] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [resumenAbierto, setResumenAbierto] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  const { mensajes, cargando, enviarTexto, enviarArchivo, sendBroadcast, setOnBroadcast } =
    useChat(canal.id, sesion.token);

  const {
    estado: estadoVideo,
    errorMedia,
    localVideoRef,
    remoteVideoRef,
    iniciarLlamada,
    aceptarEntrante,
    rechazarEntrante,
    colgar,
  } = useVideoCall({ canalId: canal.id, sesion, sendBroadcast, setOnBroadcast });

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
    return <span>{msg.contenido}</span>;
  };

  const puedeVideo = sesion.usuario.rol !== "operador";

  // Badge de triage: extrae "ClavN" de la descripción o nombre del canal
  const triageBadge = (() => {
    const texto = canal.descripcion || canal.nombre || "";
    const match = texto.match(/clave\s*\d/i);
    return match ? match[0].replace(/\s/, "") : null;
  })();

  const badgeColor = (badge) => {
    if (!badge) return "#94a3b8";
    const n = parseInt(badge.replace(/\D/g, ""));
    if (n === 1) return "#ef4444";
    if (n === 2) return "#f97316";
    if (n === 3) return "#eab308";
    return "#22c55e";
  };

  return (
    <div style={s.layout}>

      {/* Notificación llamada entrante */}
      <LlamadaEntrante
        visible={estadoVideo === "recibiendo"}
        onAceptar={aceptarEntrante}
        onRechazar={rechazarEntrante}
      />

      {/* Overlay videollamada */}
      <VideoCall
        estado={estadoVideo}
        errorMedia={errorMedia}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        onColgar={colgar}
      />

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={onVolver}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div style={s.headerInfo}>
            <div style={s.headerNameRow}>
              <span style={s.headerName}>{canal.nombre}</span>
              {triageBadge && (
                <span style={{ ...s.triageBadge, background: badgeColor(triageBadge) }}>
                  {triageBadge.charAt(0).toUpperCase() + triageBadge.slice(1)}
                </span>
              )}
            </div>
            <span style={s.headerSub}>{sesion.usuario.nombre} · {sesion.usuario.rol}</span>
          </div>
        </div>
        <div style={s.headerRight}>
          {puedeVideo && estadoVideo === "idle" && (
            <button style={s.videoBtn} onClick={iniciarLlamada} title="Videollamada">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </button>
          )}
          {estadoVideo !== "idle" && (
            <span style={s.enLlamadaTag}>
              {estadoVideo === "llamando" ? "⏳ Llamando…" : "🟢 En llamada"}
            </span>
          )}
        </div>
      </div>

      {/* ── Banner resumen ── */}
      {canal.descripcion && (
        <div style={s.resumenBanner}>
          <button style={s.resumenBtn} onClick={() => setResumenAbierto((v) => !v)}>
            <span style={s.resumenIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </span>
            <span style={s.resumenLabel}>Ver resumen del cuestionario</span>
            <span style={{ ...s.resumenChevron, transform: resumenAbierto ? "rotate(180deg)" : "rotate(0deg)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>
          {resumenAbierto && (
            <div style={s.resumenBody}>
              {canal.descripcion}
            </div>
          )}
        </div>
      )}

      {/* ── Mensajes ── */}
      <div style={s.mensajes}>
        {cargando && <p style={s.hint}>Cargando historial...</p>}
        {!cargando && mensajes.length === 0 && (
          <div style={s.consultaIniciada}>
            <span>Consulta iniciada · {hora(new Date().toISOString())}</span>
          </div>
        )}

        {mensajes.length > 0 && (
          <div style={s.consultaIniciada}>
            <span>Consulta iniciada · {hora(mensajes[0].creadoEn)}</span>
          </div>
        )}

        {mensajes.map((msg) => (
          <div
            key={msg.id}
            style={{ ...s.msgRow, justifyContent: esPropio(msg) ? "flex-end" : "flex-start" }}
          >
            <div style={esPropio(msg) ? s.bubbleOwn : s.bubbleOther}>
              {!esPropio(msg) && (
                <div style={s.autorLabel}>{msg.autorNombre}</div>
              )}
              {renderContenido(msg)}
              <div style={{ ...s.timestamp, color: esPropio(msg) ? "rgba(255,255,255,.65)" : "#9ca3af" }}>
                {hora(msg.creadoEn)}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Preview archivo ── */}
      {archivo && (
        <div style={s.previewArea}>
          {archivo.tipo === "imagen"
            ? <img src={archivo.url} alt="preview" style={s.previewImg} />
            : <video src={archivo.url} controls style={s.previewImg} />}
          <button style={s.btnQuitarArchivo} onClick={cancelarArchivo}>✕ Quitar</button>
        </div>
      )}

      {/* ── Input ── */}
      <div style={s.inputBar}>
        <input
          type="file"
          ref={fileRef}
          accept="image/*,video/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button style={s.clipBtn} onClick={() => fileRef.current.click()} title="Adjuntar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <textarea
          style={s.textarea}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={archivo ? "Agregá un texto…" : "Escribir mensaje..."}
        />
        <button
          style={{ ...s.sendBtn, opacity: enviando ? 0.6 : 1 }}
          onClick={handleEnviar}
          disabled={enviando}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const s = {
  layout: {
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: "#f0f2f5",
  },

  // Header
  header: {
    background: "white",
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #f1f5f9",
    boxShadow: "0 1px 3px rgba(0,0,0,.06)",
    minHeight: 64,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  backBtn: {
    background: "none", border: "none", cursor: "pointer",
    padding: 4, display: "flex", alignItems: "center", borderRadius: 8,
  },
  headerInfo: { display: "flex", flexDirection: "column", gap: 2 },
  headerNameRow: { display: "flex", alignItems: "center", gap: 8 },
  headerName: { fontSize: 16, fontWeight: 700, color: "#111827" },
  triageBadge: {
    fontSize: 11, fontWeight: 700, color: "white",
    borderRadius: 20, padding: "2px 9px", letterSpacing: 0.3,
  },
  headerSub: { fontSize: 12, color: "#9ca3af" },
  headerRight: { display: "flex", alignItems: "center", gap: 8 },
  videoBtn: {
    background: "#f0fdfa",
    border: "none",
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
    color: "#0d9488",
    display: "flex",
    alignItems: "center",
  },
  enLlamadaTag: { fontSize: 12, color: "#0d9488", fontWeight: 600 },

  // Resumen banner
  resumenBanner: {
    background: "#f0fdfa",
    borderBottom: "1px solid #ccfbf1",
  },
  resumenBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    background: "none",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
  },
  resumenIcon: { display: "flex", alignItems: "center", flexShrink: 0 },
  resumenLabel: { flex: 1, fontSize: 14, fontWeight: 600, color: "#0d9488" },
  resumenChevron: { display: "flex", alignItems: "center", transition: "transform .2s" },
  resumenBody: {
    padding: "0 16px 12px 44px",
    fontSize: 13,
    color: "#374151",
    lineHeight: 1.5,
  },

  // Mensajes
  mensajes: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  consultaIniciada: {
    textAlign: "center",
    margin: "8px 0 12px",
    fontSize: 12,
    color: "#9ca3af",
    background: "rgba(255,255,255,.7)",
    borderRadius: 20,
    padding: "4px 14px",
    alignSelf: "center",
  },
  hint: { textAlign: "center", color: "#9ca3af", marginTop: 40, fontSize: 14 },
  msgRow: { display: "flex", width: "100%", marginBottom: 2 },
  bubbleOwn: {
    background: "#0f766e",
    color: "white",
    borderRadius: "18px 18px 4px 18px",
    padding: "10px 14px",
    maxWidth: "75%",
    fontSize: 14,
    lineHeight: 1.45,
    boxShadow: "0 1px 2px rgba(0,0,0,.15)",
  },
  bubbleOther: {
    background: "white",
    color: "#111827",
    borderRadius: "18px 18px 18px 4px",
    padding: "10px 14px",
    maxWidth: "75%",
    fontSize: 14,
    lineHeight: 1.45,
    boxShadow: "0 1px 3px rgba(0,0,0,.08)",
  },
  autorLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0d9488",
    marginBottom: 3,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "right",
  },
  img: {
    maxWidth: "100%",
    maxHeight: 220,
    borderRadius: 10,
    display: "block",
    cursor: "pointer",
  },

  // Preview archivo
  previewArea: {
    padding: "8px 16px",
    background: "white",
    borderTop: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  previewImg: { height: 52, borderRadius: 8, objectFit: "cover" },
  btnQuitarArchivo: {
    background: "#fee2e2", color: "#dc2626", border: "none",
    borderRadius: 8, padding: "5px 12px", cursor: "pointer",
    fontWeight: 700, fontSize: 12, fontFamily: "inherit",
  },

  // Input bar
  inputBar: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    padding: "10px 12px",
    background: "white",
    borderTop: "1px solid #f1f5f9",
  },
  clipBtn: {
    background: "none", border: "none", cursor: "pointer",
    padding: "8px 6px", display: "flex", alignItems: "center", flexShrink: 0,
  },
  textarea: {
    flex: 1,
    background: "#f3f4f6",
    border: "none",
    borderRadius: 22,
    padding: "10px 16px",
    fontSize: 14,
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: 1.4,
    maxHeight: 100,
    overflowY: "auto",
    color: "#111827",
  },
  sendBtn: {
    background: "#0d9488",
    border: "none",
    borderRadius: "50%",
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background .15s",
  },
};
