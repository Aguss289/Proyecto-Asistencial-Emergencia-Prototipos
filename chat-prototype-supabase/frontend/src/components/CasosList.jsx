import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";
import {
  apiGetCasos,
  apiCrearChatRequest,
  apiListarUsuarios,
  apiGetChatRequestsPendientes,
  apiResponderChatRequest,
  apiGetNotificaciones,
  apiMarcarTodasLeidas,
} from "../services/api.js";

const PRIORIDAD_COLOR = {
  clave_1: "#dc2626",
  clave_2: "#ea580c",
  clave_3: "#d97706",
  clave_4: "#16a34a",
};

const PRIORIDAD_LABEL = {
  clave_1: "Clave 1",
  clave_2: "Clave 2",
  clave_3: "Clave 3",
  clave_4: "Clave 4",
};

export function CasosList({ sesion, onAbrirChat, onLogout }) {
  const [casos, setCasos]                   = useState([]);
  const [cargando, setCargando]             = useState(true);
  const [pendientes, setPendientes]         = useState([]);   // ChatRequests pendientes (socio)
  const [notifs, setNotifs]                 = useState([]);
  const [showNotifs, setShowNotifs]         = useState(false);
  const [creandoChat, setCreandoChat]       = useState(false);
  const [socios, setSocios]                 = useState([]);
  const [cargandoSocios, setCargandoSocios] = useState(false);

  const { rol, id: userId } = sesion.usuario;
  const esMedico   = rol === "medico";
  const esOperador = rol === "operador";
  const esSocio    = rol === "socio";

  const cargarTodo = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const [casosData, notifsData] = await Promise.all([
        apiGetCasos(sesion.token),
        apiGetNotificaciones(sesion.token, true),
      ]);
      setCasos(casosData);
      setNotifs(notifsData);

      if (esSocio) {
        const reqs = await apiGetChatRequestsPendientes(sesion.token);
        setPendientes(reqs);
      }
    } catch { /* silencioso */ }
    finally { if (!silencioso) setCargando(false); }
  }, [sesion.token, esSocio]);

  useEffect(() => { cargarTodo(); }, [cargarTodo]);

  // Polling cada 5 s
  useEffect(() => {
    const i = setInterval(() => cargarTodo(true), 5000);
    return () => clearInterval(i);
  }, [cargarTodo]);

  // Supabase Realtime: nuevo caso o cambio de estado
  useEffect(() => {
    const ch = supabase
      .channel(`casos-${userId}-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "casos" },
        () => cargarTodo(true)
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_requests" },
        (e) => { if (e.new?.receptor_id === userId) cargarTodo(true); }
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notificaciones" },
        (e) => { if (e.new?.usuario_id === userId) cargarTodo(true); }
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [userId, cargarTodo]);

  // Abrir chat de un caso (si tiene canal)
  const handleSeleccionarCaso = (caso) => {
    const canal = Array.isArray(caso.canales) ? caso.canales[0] : caso.canales;
    if (canal) {
      onAbrirChat({ ...canal, caso });
    }
  };

  // Médico/operador abre el panel para elegir socio
  const abrirCrearChat = async () => {
    setCreandoChat(true);
    setCargandoSocios(true);
    try {
      const lista = await apiListarUsuarios(sesion.token, "socio");
      setSocios(lista);
    } catch { setSocios([]); }
    finally { setCargandoSocios(false); }
  };

  // Médico selecciona un socio y envía ChatRequest
  const handleCrearChatRequest = async (socio) => {
    try {
      await apiCrearChatRequest({
        receptorId: socio.id,
        nombreCabina: sesion.usuario.nombre,
        token: sesion.token,
      });
      setCreandoChat(false);
      cargarTodo(true);
      alert(`Solicitud enviada a ${socio.nombre}. Esperando aceptación.`);
    } catch (err) { alert(err.message); }
  };

  // Socio acepta o rechaza un ChatRequest
  const responderRequest = async (requestId, estado) => {
    try {
      const result = await apiResponderChatRequest({ requestId, estado, token: sesion.token });
      cargarTodo(true);
      if (estado === "aceptado" && result.canal) {
        onAbrirChat(result.canal);
      }
    } catch (err) { alert(err.message); }
  };

  const abrirNotifs = async () => {
    setShowNotifs((v) => !v);
    if (notifs.length > 0) {
      await apiMarcarTodasLeidas(sesion.token);
      setNotifs([]);
    }
  };

  const rolIcon = { socio: "👤", medico: "🩺", operador: "🎛️" };

  return (
    <div style={s.layout}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.avatar}>{rolIcon[rol]}</div>
          <div>
            <div style={s.headerName}>{sesion.usuario.nombre}</div>
            <div style={s.headerRol}>{rol}</div>
          </div>
        </div>
        <div style={s.headerRight}>
          {/* Campana de notificaciones */}
          <button style={s.iconBtn} onClick={abrirNotifs}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {notifs.length > 0 && <span style={s.badge}>{notifs.length}</span>}
          </button>
          <button style={s.iconBtn} onClick={onLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Panel notificaciones */}
      {showNotifs && (
        <div style={s.notifPanel}>
          <div style={s.notifTitle}>Notificaciones</div>
          {notifs.length === 0 ? (
            <p style={s.hint}>Sin notificaciones nuevas</p>
          ) : (
            notifs.map((n) => (
              <div key={n.id} style={s.notifItem}>
                <span style={s.notifTipo}>{n.tipo.replace(/_/g, " ")}</span>
                <span style={s.notifFecha}>{new Date(n.creado_en).toLocaleTimeString("es")}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Chat Requests pendientes — solo socio */}
      {esSocio && pendientes.length > 0 && (
        <div style={s.reqSection}>
          <div style={s.sectionTitle}>
            <span>Solicitudes de atención</span>
            <span style={s.reqBadge}>{pendientes.length}</span>
          </div>
          {pendientes.map((req) => (
            <div key={req.id} style={s.reqCard}>
              <div style={s.reqInfo}>
                <div style={s.reqNombre}>🩺 {req.remitente?.nombre || req.nombre_cabina}</div>
                <div style={s.reqFecha}>
                  {new Date(req.creado_en).toLocaleString("es", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <div style={s.reqBtns}>
                <button style={s.btnAceptar} onClick={() => responderRequest(req.id, "aceptado")}>
                  Aceptar
                </button>
                <button style={s.btnRechazar} onClick={() => responderRequest(req.id, "rechazado")}>
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Título sección casos */}
      <div style={s.sectionTitle}>
        <span>Mis casos</span>
        {(esMedico || esOperador) && !creandoChat && (
          <button style={s.btnNueva} onClick={abrirCrearChat}>+ Nueva consulta</button>
        )}
      </div>

      {/* Selector de socio para nuevo chat request */}
      {creandoChat && (
        <div style={s.panel}>
          <div style={s.panelHeader}>
            <span style={s.panelTitle}>Seleccioná un paciente</span>
            <button style={s.btnX} onClick={() => setCreandoChat(false)}>✕</button>
          </div>
          <div style={s.panelBody}>
            {cargandoSocios ? (
              <p style={s.hint}>Cargando...</p>
            ) : socios.length === 0 ? (
              <p style={s.hint}>No hay socios registrados.</p>
            ) : (
              socios.map((socio) => (
                <button key={socio.id} style={s.socioItem} onClick={() => handleCrearChatRequest(socio)}>
                  <div style={s.socioAvatar}>{socio.nombre.charAt(0).toUpperCase()}</div>
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

      {/* Lista de casos */}
      <div style={s.body}>
        {cargando ? (
          <p style={s.hint}>Cargando casos...</p>
        ) : casos.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>🏥</div>
            <p style={s.emptyText}>
              {esMedico || esOperador
                ? 'No hay casos activos.\nUsá "+ Nueva consulta" para iniciar uno.'
                : "No tenés casos asignados aún."}
            </p>
          </div>
        ) : (
          casos.map((caso) => {
            const canal = Array.isArray(caso.canales) ? caso.canales[0] : caso.canales;
            const tieneChatActivo = !!canal;
            return (
              <button
                key={caso.id}
                style={{ ...s.casoItem, ...(tieneChatActivo ? {} : s.casoItemSinChat) }}
                onClick={() => tieneChatActivo ? handleSeleccionarCaso(caso) : null}
                disabled={!tieneChatActivo}
              >
                <div style={s.casoAvatar}>
                  {caso.paciente?.nombre?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div style={s.casoInfo}>
                  <div style={s.casoNombre}>{caso.paciente?.nombre || "Paciente"}</div>
                  <div style={s.casoCedula}>CI {caso.paciente?.cedula}</div>
                  <div style={s.casoMeta}>
                    <span style={{ ...s.estadoPill, ...estadoStyle(caso.estado) }}>
                      {caso.estado.replace("_", " ")}
                    </span>
                    {caso.prioridad && (
                      <span style={{ ...s.prioridadPill, background: PRIORIDAD_COLOR[caso.prioridad] }}>
                        {PRIORIDAD_LABEL[caso.prioridad]}
                      </span>
                    )}
                    {!tieneChatActivo && (
                      <span style={s.esperandoPill}>⏳ esperando aceptación</span>
                    )}
                  </div>
                </div>
                {tieneChatActivo && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function estadoStyle(estado) {
  if (estado === "abierto")      return { background: "#dbeafe", color: "#1d4ed8" };
  if (estado === "en_atencion")  return { background: "#d1fae5", color: "#065f46" };
  if (estado === "cerrado")      return { background: "#f3f4f6", color: "#6b7280" };
  return {};
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
    position: "relative",
  },
  headerLeft:  { display: "flex", alignItems: "center", gap: 12 },
  headerRight: { display: "flex", alignItems: "center", gap: 4 },
  avatar: {
    width: 40, height: 40, borderRadius: "50%",
    background: "#f0fdfa", display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: 20,
  },
  headerName: { fontSize: 15, fontWeight: 700, color: "#111827" },
  headerRol:  { fontSize: 12, color: "#9ca3af", textTransform: "capitalize" },
  iconBtn: {
    background: "none", border: "none", cursor: "pointer",
    padding: 8, borderRadius: 8, position: "relative",
    display: "flex", alignItems: "center",
  },
  badge: {
    position: "absolute", top: 4, right: 4,
    background: "#dc2626", color: "white",
    borderRadius: "50%", width: 16, height: 16,
    fontSize: 10, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
  },

  // Notificaciones
  notifPanel: {
    background: "white",
    borderBottom: "1px solid #f3f4f6",
    padding: "12px 16px",
    maxHeight: 200,
    overflowY: "auto",
  },
  notifTitle: { fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 8 },
  notifItem: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 0", borderBottom: "1px solid #f9fafb",
  },
  notifTipo:  { fontSize: 13, color: "#374151", textTransform: "capitalize" },
  notifFecha: { fontSize: 11, color: "#9ca3af" },

  // Chat Requests (socio)
  reqSection: { padding: "12px 12px 0" },
  reqBadge: {
    background: "#dc2626", color: "white",
    borderRadius: 12, padding: "2px 8px", fontSize: 11, fontWeight: 700,
  },
  reqCard: {
    background: "#fef3c7",
    border: "1px solid #fcd34d",
    borderRadius: 14,
    padding: "12px 14px",
    marginTop: 6,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  reqInfo:   { flex: 1 },
  reqNombre: { fontSize: 14, fontWeight: 700, color: "#111827" },
  reqFecha:  { fontSize: 12, color: "#92400e", marginTop: 2 },
  reqBtns:   { display: "flex", gap: 8 },
  btnAceptar: {
    background: "#0d9488", color: "white", border: "none",
    borderRadius: 10, padding: "7px 14px", fontSize: 13,
    fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  },
  btnRechazar: {
    background: "white", color: "#6b7280",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10, padding: "7px 14px", fontSize: 13,
    fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },

  // Section title
  sectionTitle: {
    padding: "14px 16px 8px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    fontSize: 13, fontWeight: 700, color: "#6b7280",
    textTransform: "uppercase", letterSpacing: 0.8,
  },
  btnNueva: {
    background: "#0d9488", color: "white", border: "none",
    borderRadius: 20, padding: "5px 14px", fontSize: 13,
    fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  },

  // Selector de socio
  panel: {
    background: "white", margin: "0 12px 8px",
    borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,.08)", overflow: "hidden",
  },
  panelHeader: {
    padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
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

  // Lista de casos
  body: {
    flex: 1, overflowY: "auto",
    padding: "4px 12px 20px",
    display: "flex", flexDirection: "column", gap: 6,
  },
  casoItem: {
    background: "white", border: "none",
    borderRadius: 14, padding: "14px 16px",
    cursor: "pointer", textAlign: "left",
    display: "flex", alignItems: "center", gap: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,.06)",
    fontFamily: "inherit",
  },
  casoItemSinChat: {
    opacity: 0.75,
    cursor: "default",
  },
  casoAvatar: {
    width: 44, height: 44, borderRadius: "50%",
    background: "#f0fdfa", color: "#0d9488",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, fontWeight: 700, flexShrink: 0,
  },
  casoInfo:   { flex: 1, minWidth: 0 },
  casoNombre: {
    fontSize: 15, fontWeight: 700, color: "#111827",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  casoCedula: { fontSize: 12, color: "#9ca3af", marginTop: 1 },
  casoMeta:   { display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" },
  estadoPill: {
    fontSize: 11, fontWeight: 700, borderRadius: 12, padding: "2px 8px",
    textTransform: "capitalize",
  },
  prioridadPill: {
    fontSize: 11, fontWeight: 700, borderRadius: 12, padding: "2px 8px",
    color: "white",
  },
  esperandoPill: {
    fontSize: 11, color: "#92400e", background: "#fef3c7",
    borderRadius: 12, padding: "2px 8px",
  },

  emptyState: { textAlign: "center", marginTop: 60 },
  emptyIcon:  { fontSize: 40, marginBottom: 12 },
  emptyText:  { color: "#9ca3af", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-line" },
  hint:       { color: "#9ca3af", textAlign: "center", padding: 20, fontSize: 14 },
};
