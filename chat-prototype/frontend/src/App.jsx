import { useState } from "react";
import { Chat } from "./components/Chat";

export default function App() {
  const [sesion, setSesion] = useState(null);
  const [form, setForm] = useState({
    solicitudId: "001",
    usuario: "",
    rol: "socio",
  });

  const handleEntrar = () => {
    if (!form.usuario.trim()) return alert("Ingresá tu nombre");
    setSesion({ ...form });
  };

  if (!sesion) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <h1 style={styles.titulo}>💬 Chat Prototipo</h1>
          <p style={styles.subtitulo}>La Asistencial Emergencia</p>

          <div style={styles.campo}>
            <label style={styles.label}>Solicitud ID</label>
            <input
              style={styles.input}
              value={form.solicitudId}
              onChange={(e) => setForm({ ...form, solicitudId: e.target.value })}
              placeholder="Ej: 001"
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Tu nombre</label>
            <input
              style={styles.input}
              value={form.usuario}
              onChange={(e) => setForm({ ...form, usuario: e.target.value })}
              placeholder="Ej: Juan"
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Rol</label>
            <div style={styles.roles}>
              {["socio", "medico"].map((r) => (
                <button
                  key={r}
                  style={{
                    ...styles.rolBtn,
                    ...(form.rol === r ? styles.rolBtnActivo : {}),
                  }}
                  onClick={() => setForm({ ...form, rol: r })}
                >
                  {r === "medico" ? "🩺 Médico" : "👤 Socio"}
                </button>
              ))}
            </div>
          </div>

          <button style={styles.btnEntrar} onClick={handleEntrar}>
            Entrar al chat
          </button>

          <p style={styles.hint}>
            Abrí otra pestaña con otro rol para probar el chat en tiempo real.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.chatContainer}>
      <Chat
        solicitudId={sesion.solicitudId}
        usuario={sesion.usuario}
        rol={sesion.rol}
      />
      <button style={styles.btnSalir} onClick={() => setSesion(null)}>
        ← Salir
      </button>
    </div>
  );
}

const styles = {
  loginContainer: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loginCard: {
    background: "white",
    borderRadius: 16,
    padding: 40,
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  titulo: {
    margin: 0,
    fontSize: 28,
    fontFamily: "sans-serif",
    color: "#1e293b",
    textAlign: "center",
  },
  subtitulo: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 4,
    marginBottom: 28,
    fontFamily: "sans-serif",
    fontSize: 14,
  },
  campo: {
    marginBottom: 16,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
    marginBottom: 6,
    fontFamily: "sans-serif",
  },
  input: {
    width: "100%",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "sans-serif",
    outline: "none",
    boxSizing: "border-box",
  },
  roles: {
    display: "flex",
    gap: 10,
  },
  rolBtn: {
    flex: 1,
    padding: "10px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    background: "white",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "sans-serif",
    color: "#475569",
  },
  rolBtnActivo: {
    border: "1.5px solid #2563eb",
    background: "#eff6ff",
    color: "#2563eb",
    fontWeight: 600,
  },
  btnEntrar: {
    width: "100%",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "14px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
    fontFamily: "sans-serif",
  },
  hint: {
    textAlign: "center",
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 16,
    fontFamily: "sans-serif",
    lineHeight: 1.5,
  },
  chatContainer: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    padding: 16,
    background: "#f1f5f9",
    boxSizing: "border-box",
    gap: 10,
  },
  btnSalir: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
    fontSize: 14,
    fontFamily: "sans-serif",
    textAlign: "left",
  },
};
