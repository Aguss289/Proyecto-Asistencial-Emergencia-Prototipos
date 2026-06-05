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

  // Selector de socio para crear chat
  const [creandoChat, setCreandoChat] = useState(false);
  const [socios, setSocios] = useState([]);
  const [cargandoSocios, setCargandoSocios] = useState(false);

  const esMedico = sesion.usuario.rol === "medico";
  const esOperador = sesion.usuario.rol === "operador";

  const cargar = async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const data = esOperador
        ? await apiGetCanales(sesion.token)
        : await apiGetMisCanales(sesion.token);
      // Solo actualiza si cambió la cantidad de canales (evita parpadeo)
      setCanales((prev) => (prev.length === data.length ? prev : data));
    } catch { /* silencioso */ }
    finally { if (!silencioso) setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  // Realtime: cuando alguien nos agrega a canal_miembros, actualizamos la lista
  useEffect(() => {
    const channel = supabase
      .channel(`mis-canales-${sesion.usuario.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "canal_miembros" },
        ({ new: row }) => {
          if (row.usuario_id !== sesion.usuario.id) return;
          cargar();
        }
      )
      .subscribe((status) => {
        console.log("[Realtime canales] estado:", status);
      });

    return () => supabase.removeChannel(channel);
  }, [sesion.usuario.id]);

  // Polling de respaldo cada 4 segundos — garantiza que aparezcan chats nuevos
  useEffect(() => {
    const intervalo = setInterval(() => cargar(true), 4000);
    return () => clearInterval(intervalo);
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
        nombre: `Caso - ${socio.nombre}`,
        descripcion: `Atención médica para ${socio.nombre}`,
        miembroExtraId: socio.id,
        token: sesion.token,
      });
      setCanales((prev) => [canal, ...prev]);
      setCreandoChat(false);
      onSeleccionar(canal);
    } catch (err) { alert(err.message); }
  };

  const rolLabel = { socio: "👤 Socio", medico: "🩺 Médico", operador: "🎛️ Operador" };

  return (
    <div style={s.layout}>
      <div style={s.header}>
        <div>
          <strong style={s.headerTitle}>💬 Canales</strong>
          <span style={s.rolTag}>
            {rolLabel[sesion.usuario.rol]}: {sesion.usuario.nombre}
          </span>
        </div>
        <button style={s.btnSalir} onClick={onLogout}>Salir →</button>
      </div>

      <div style={s.body}>
        {/* Botón "Crear chat" solo para médico */}
        {esMedico && !creandoChat && (
          <button style={s.btnCaso} onClick={abrirCrearChat}>
            Crear chat
          </button>
        )}

        {/* Selector de socio */}
        {esMedico && creandoChat && (
          <div style={s.panel}>
            <div style={s.panelHeader}>
              <strong>Seleccioná un socio</strong>
              <button style={s.btnX} onClick={() => setCreandoChat(false)}>✕</button>
            </div>
            {cargandoSocios ? (
              <p style={s.hint}>Cargando socios...</p>
            ) : socios.length === 0 ? (
              <p style={s.hint}>No hay socios registrados aún.</p>
            ) : (
              socios.map((socio) => (
                <button
                  key={socio.id}
                  style={s.socioItem}
                  onClick={() => handleSeleccionarSocio(socio)}
                >
                  <span style={s.socioNombre}>👤 {socio.nombre}</span>
                  <span style={s.socioEmail}>{socio.email}</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Lista de canales */}
        {cargando ? (
          <p style={s.hint}>Cargando canales...</p>
        ) : canales.length === 0 ? (
          <p style={s.hint}>
            {esMedico
              ? 'No tenés casos aún. Usá "Crear chat" para iniciar uno.'
              : "No tenés chats asignados aún."}
          </p>
        ) : (
          canales.map((c) => (
            <button key={c.id} style={s.canalItem} onClick={() => onSeleccionar(c)}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={s.canalNombre}>{c.nombre}</span>
                <span style={s.idBadge}>{c.id.slice(0, 6).toUpperCase()}</span>
              </div>
              {c.descripcion && <span style={s.canalDesc}>{c.descripcion}</span>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

const s = {
  layout: { height: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9", fontFamily: "sans-serif" },
  header: { background: "#00B3A7", color: "white", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 18 },
  rolTag: { marginLeft: 10, fontSize: 13, background: "rgba(255,255,255,.2)", borderRadius: 20, padding: "2px 10px" },
  btnSalir: { background: "transparent", border: "none", color: "rgba(255,255,255,.8)", cursor: "pointer", fontSize: 14 },
  body: { flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 10, maxWidth: 600, margin: "0 auto", width: "100%", boxSizing: "border-box" },
  btnCaso: { background: "#00B3A7", color: "white", border: "none", borderRadius: 10, padding: "13px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer" },
  panel: { background: "white", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,.1)", overflow: "hidden" },
  panelHeader: { padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, color: "#1e293b" },
  btnX: { background: "transparent", border: "none", cursor: "pointer", fontSize: 16, color: "#64748b" },
  socioItem: { width: "100%", padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "white", border: "none", textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 2 },
  socioNombre: { fontSize: 14, fontWeight: 600, color: "#1e293b" },
  socioEmail: { fontSize: 12, color: "#64748b" },
  canalItem: { background: "white", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 4, boxShadow: "0 1px 4px rgba(0,0,0,.06)" },
  canalNombre: { fontSize: 15, fontWeight: 700, color: "#1e293b" },
  idBadge: { fontSize: 10, fontWeight: 700, color: "#00B3A7", background: "#e6f9f8", borderRadius: 6, padding: "2px 6px", letterSpacing: 1 },
  canalDesc: { fontSize: 13, color: "#64748b" },
  hint: { color: "#94a3b8", textAlign: "center", marginTop: 40, fontSize: 14 },
};
