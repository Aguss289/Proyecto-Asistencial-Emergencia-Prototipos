import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";
import {
  apiGetMisCanales,
  apiGetCanales,
  apiCrearCanal,
  apiListarUsuarios,
} from "../services/api.js";

export function CanalesList({ sesion, onSeleccionar, onLogout }) {
  const [canales, setCanales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [creandoChat, setCreandoChat] = useState(false);
  const [socios, setSocios] = useState([]);
  const [cargandoSocios, setCargandoSocios] = useState(false);

  const esMedico = sesion.usuario.rol === "medico";
  const esOperador = sesion.usuario.rol === "operador";

  const rolIcon = { socio: "👤", medico: "🩺", operador: "🎛️" };

  const cargar = async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const data = esOperador
        ? await apiGetCanales(sesion.token)
        : await apiGetMisCanales(sesion.token);
      setCanales((prev) => (prev.length === data.length ? prev : data));
    } catch { /* silencioso */ }
    finally { if (!silencioso) setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`mis-canales-${sesion.usuario.id}-${Date.now()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "canal_miembros" },
        ({ new: row }) => { if (row.usuario_id === sesion.usuario.id) cargar(); }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [sesion.usuario.id]);

  useEffect(() => {
    const i = setInterval(() => cargar(true), 4000);
    return () => clearInterval(i);
  }, []);

  const abrirCrearChat = async () => {
    setCreandoChat(true);
    setCargandoSocios(true);
    try {
      const lista = await apiListarUsuarios(sesion.token, "socio");
      setSocios(lista);
    } catch { setSocios([]); }
    finally { setCargandoSocios(false); }
  };

  const handleSeleccionarSocio = async (socio) => {
    try {
      const canal = await apiCrearCanal({
        nombre: `${socio.nombre}`,
        descripcion: `Atención médica · Cédula ${socio.cedula}`,
        miembroExtraId: socio.id,
        token: sesion.token,
      });
      setCanales((prev) => [canal, ...prev]);
      setCreandoChat(false);
      onSeleccionar(canal);
    } catch (err) { alert(err.message); }
  };

  return (
    <div style={s.layout}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.avatar}>
            {rolIcon[sesion.usuario.rol]}
          </div>
          <div>
            <div style={s.headerName}>{sesion.usuario.nombre}</div>
            <div style={s.headerRol}>{sesion.usuario.rol}</div>
          </div>
        </div>
        <button style={s.btnSalir} onClick={onLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      {/* Título sección */}
      <div style={s.sectionTitle}>
        <span>Consultas activas</span>
        {esMedico && !creandoChat && (
          <button style={s.btnNueva} onClick={abrirCrearChat}>
            + Nueva
          </button>
        )}
      </div>

      {/* Selector de socio */}
      {esMedico && creandoChat && (
        <div style={s.panel}>
          <div style={s.panelHeader}>
            <span style={s.panelTitle}>Seleccioná un paciente</span>
            <button style={s.btnX} onClick={() => setCreandoChat(false)}>✕</button>
          </div>
          <div style={s.panelBody}>
            {cargandoSocios ? (
              <p style={s.hint}>Cargando...</p>
            ) : socios.length === 0 ? (
              <p style={s.hint}>No hay socios registrados aún.</p>
            ) : (
              socios.map((socio) => (
                <button key={socio.id} style={s.socioItem} onClick={() => handleSeleccionarSocio(socio)}>
                  <div style={s.socioAvatar}>
                    {socio.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={s.socioNombre}>{socio.nombre}</div>
                    <div style={s.socioCedula}>Cédula: {socio.cedula}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Lista canales */}
      <div style={s.body}>
        {cargando ? (
          <p style={s.hint}>Cargando consultas...</p>
        ) : canales.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>💬</div>
            <p style={s.emptyText}>
              {esMedico ? 'No tenés consultas aún.\nUsá "+ Nueva" para iniciar una.' : "No tenés consultas asignadas aún."}
            </p>
          </div>
        ) : (
          canales.map((c) => (
            <button key={c.id} style={s.canalItem} onClick={() => onSeleccionar(c)}>
              <div style={s.canalAvatar}>
                {c.nombre.charAt(0).toUpperCase()}
              </div>
              <div style={s.canalInfo}>
                <div style={s.canalNombre}>{c.nombre}</div>
                {c.descripcion && <div style={s.canalDesc}>{c.descripcion}</div>}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

const s = {
  layout: {
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    background: "#f0f2f5",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  // Header
  header: {
    background: "white",
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,.06)",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: "50%",
    background: "#f0fdfa", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 20,
  },
  headerName: { fontSize: 15, fontWeight: 700, color: "#111827" },
  headerRol: { fontSize: 12, color: "#9ca3af", textTransform: "capitalize" },
  btnSalir: {
    background: "none", border: "none", cursor: "pointer",
    padding: 8, display: "flex", alignItems: "center", borderRadius: 8,
  },

  // Section title
  sectionTitle: {
    padding: "16px 16px 8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 13,
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  btnNueva: {
    background: "#0d9488", color: "white", border: "none",
    borderRadius: 20, padding: "5px 14px", fontSize: 13,
    fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  },

  // Panel selector socio
  panel: {
    background: "white",
    margin: "0 12px 8px",
    borderRadius: 14,
    boxShadow: "0 2px 12px rgba(0,0,0,.08)",
    overflow: "hidden",
  },
  panelHeader: {
    padding: "12px 16px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: "1px solid #f3f4f6",
  },
  panelTitle: { fontSize: 14, fontWeight: 700, color: "#111827" },
  btnX: { background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#9ca3af" },
  panelBody: { maxHeight: 240, overflowY: "auto" },
  socioItem: {
    width: "100%", padding: "12px 16px",
    background: "white", border: "none",
    borderBottom: "1px solid #f9fafb",
    cursor: "pointer", textAlign: "left",
    display: "flex", alignItems: "center", gap: 12,
    fontFamily: "inherit",
  },
  socioAvatar: {
    width: 36, height: 36, borderRadius: "50%",
    background: "#f0fdfa", color: "#0d9488",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 15, fontWeight: 700, flexShrink: 0,
  },
  socioNombre: { fontSize: 14, fontWeight: 600, color: "#111827" },
  socioCedula: { fontSize: 12, color: "#9ca3af", marginTop: 1 },

  // Lista canales
  body: {
    flex: 1, overflowY: "auto",
    padding: "4px 12px 20px",
    display: "flex", flexDirection: "column", gap: 6,
  },
  canalItem: {
    background: "white",
    border: "none",
    borderRadius: 14,
    padding: "14px 16px",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,.06)",
    fontFamily: "inherit",
  },
  canalAvatar: {
    width: 44, height: 44, borderRadius: "50%",
    background: "#f0fdfa", color: "#0d9488",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, fontWeight: 700, flexShrink: 0,
  },
  canalInfo: { flex: 1, minWidth: 0 },
  canalNombre: {
    fontSize: 15, fontWeight: 700, color: "#111827",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  canalDesc: {
    fontSize: 12, color: "#9ca3af", marginTop: 2,
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },

  emptyState: { textAlign: "center", marginTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: "#9ca3af", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-line" },
  hint: { color: "#9ca3af", textAlign: "center", padding: 20, fontSize: 14 },
};
