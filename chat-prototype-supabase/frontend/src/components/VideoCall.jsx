/**
 * VideoCall.jsx
 * Dos componentes:
 *   - <LlamadaEntrante> : notificación flotante cuando llega una llamada
 *   - <VideoCall>       : overlay de pantalla completa durante la llamada
 */

// ── Notificación de llamada entrante ─────────────────────────────────────────

export function LlamadaEntrante({ visible, onAceptar, onRechazar }) {
  if (!visible) return null;

  return (
    <div style={sn.wrap}>
      <div style={sn.card}>
        <div style={sn.icono}>📞</div>
        <p style={sn.titulo}>Llamada entrante</p>
        <div style={sn.botones}>
          <button style={sn.btnAceptar} onClick={onAceptar}>
            ✅ Aceptar
          </button>
          <button style={sn.btnRechazar} onClick={onRechazar}>
            ❌ Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Overlay de videollamada activa ────────────────────────────────────────────

export function VideoCall({ estado, errorMedia, localVideoRef, remoteVideoRef, onColgar }) {
  if (estado === "idle") return null;

  const labelEstado = {
    llamando: "⏳ Llamando… esperando que el otro usuario acepte",
    recibiendo: "📞 Llamada entrante",
    "en-llamada": "🟢 Videollamada en curso",
  }[estado];

  return (
    <div style={sv.overlay}>
      <div style={sv.container}>

        {/* Header */}
        <div style={sv.header}>
          <span style={sv.label}>{labelEstado}</span>
          <button style={sv.btnColgar} onClick={onColgar}>
            📵 Colgar
          </button>
        </div>

        {/* Área de videos */}
        <div style={sv.videosArea}>
          {/* Video remoto — ocupa todo el espacio */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={sv.videoRemoto}
          />

          {/* Video local — esquina inferior derecha */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted  // mute local para evitar eco
            style={sv.videoLocal}
          />

          {/* Placeholder cuando el remoto aún no conectó */}
          {estado !== "en-llamada" && (
            <div style={sv.placeholder}>
              <span style={sv.placeholderIcon}>🎥</span>
              <p style={sv.placeholderText}>
                {estado === "llamando"
                  ? "Esperando conexión…"
                  : "Conectando…"}
              </p>
            </div>
          )}
        </div>

        {/* Error de permisos */}
        {errorMedia && (
          <div style={sv.errorBar}>
            ⚠️ {errorMedia}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const sn = {
  wrap: {
    position: "fixed",
    top: 20,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 2000,
    animation: "fadeIn .2s ease",
  },
  card: {
    background: "#1e293b",
    borderRadius: 16,
    padding: "20px 28px",
    boxShadow: "0 8px 32px rgba(0,0,0,.5)",
    textAlign: "center",
    border: "2px solid #00B3A7",
    minWidth: 240,
  },
  icono: { fontSize: 32, marginBottom: 8 },
  titulo: { color: "white", fontWeight: 700, fontSize: 16, margin: "0 0 16px" },
  botones: { display: "flex", gap: 10, justifyContent: "center" },
  btnAceptar: {
    background: "#22c55e", color: "white", border: "none",
    borderRadius: 10, padding: "10px 20px", cursor: "pointer",
    fontWeight: 700, fontSize: 14, fontFamily: "sans-serif",
  },
  btnRechazar: {
    background: "#ef4444", color: "white", border: "none",
    borderRadius: 10, padding: "10px 20px", cursor: "pointer",
    fontWeight: 700, fontSize: 14, fontFamily: "sans-serif",
  },
};

const sv = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,.9)",
    zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  container: {
    width: "100%", maxWidth: 860,
    display: "flex", flexDirection: "column",
    borderRadius: 16, overflow: "hidden",
    background: "#0f172a",
    boxShadow: "0 20px 60px rgba(0,0,0,.7)",
  },
  header: {
    background: "#1e293b",
    padding: "12px 20px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  label: { color: "white", fontSize: 14, fontFamily: "sans-serif" },
  btnColgar: {
    background: "#ef4444", color: "white", border: "none",
    borderRadius: 8, padding: "8px 20px", cursor: "pointer",
    fontWeight: 700, fontSize: 14, fontFamily: "sans-serif",
  },
  videosArea: {
    position: "relative",
    height: "65vh",
    background: "#000",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  videoRemoto: {
    width: "100%", height: "100%",
    objectFit: "cover",
  },
  videoLocal: {
    position: "absolute", bottom: 14, right: 14,
    width: 150, height: 96,
    borderRadius: 10,
    objectFit: "cover",
    border: "2px solid #00B3A7",
    background: "#222",
  },
  placeholder: {
    position: "absolute", inset: 0,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    background: "#0f172a",
  },
  placeholderIcon: { fontSize: 48, marginBottom: 12 },
  placeholderText: { color: "#94a3b8", fontSize: 15, fontFamily: "sans-serif" },
  errorBar: {
    background: "#7f1d1d", color: "#fca5a5",
    padding: "10px 20px", fontSize: 13,
    fontFamily: "sans-serif", textAlign: "center",
  },
};
