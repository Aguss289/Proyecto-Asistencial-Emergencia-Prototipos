import { useState } from "react";

export function Login({ onLogin, onRegistrar, error, cargando }) {
  const [modo, setModo] = useState("login"); // "login" | "registrar"
  const [form, setForm] = useState({ nombre: "", email: "", password: "", rol: "socio" });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modo === "login") {
      onLogin({ email: form.email, password: form.password });
    } else {
      onRegistrar(form);
    }
  };

  return (
    <div style={s.bg}>
      <div style={s.card}>
        <h1 style={s.titulo}>🏥 Chat Asistencial</h1>
        <p style={s.sub}>Supabase · JWT · Capas de dominio</p>

        <div style={s.tabs}>
          {["login", "registrar"].map((m) => (
            <button
              key={m}
              style={{ ...s.tab, ...(modo === m ? s.tabActivo : {}) }}
              onClick={() => setModo(m)}
            >
              {m === "login" ? "Iniciar sesión" : "Registrarse"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {modo === "registrar" && (
            <Campo label="Nombre" value={form.nombre} onChange={(v) => set("nombre", v)} placeholder="Tu nombre completo" />
          )}
          <Campo label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} placeholder="tu@email.com" />
          <Campo label="Contraseña" type="password" value={form.password} onChange={(v) => set("password", v)} placeholder="Mínimo 6 caracteres" />

          {modo === "registrar" && (
            <div style={s.campo}>
              <label style={s.label}>Rol</label>
              <div style={s.roles}>
                {[
                  { val: "socio", label: "👤 Socio" },
                  { val: "medico", label: "🩺 Médico" },
                  { val: "operador", label: "🎛️ Operador" },
                ].map((r) => (
                  <button
                    key={r.val}
                    type="button"
                    style={{ ...s.rolBtn, ...(form.rol === r.val ? s.rolActivo : {}) }}
                    onClick={() => set("rol", r.val)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <div style={s.error}>{error}</div>}

          <button style={s.btn} disabled={cargando}>
            {cargando ? "Cargando..." : modo === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Campo({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div style={s.campo}>
      <label style={s.label}>{label}</label>
      <input
        style={s.input}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
      />
    </div>
  );
}

const s = {
  bg: { minHeight: "100vh", background: "linear-gradient(135deg,#00B3A7,#31BAA8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { background: "white", borderRadius: 16, padding: 40, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,.2)" },
  titulo: { margin: 0, fontSize: 26, fontFamily: "sans-serif", color: "#1e293b", textAlign: "center" },
  sub: { textAlign: "center", color: "#64748b", margin: "4px 0 24px", fontFamily: "sans-serif", fontSize: 13 },
  tabs: { display: "flex", gap: 8, marginBottom: 24 },
  tab: { flex: 1, padding: "9px", border: "1.5px solid #e2e8f0", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 14, fontFamily: "sans-serif", color: "#64748b" },
  tabActivo: { border: "1.5px solid #00B3A7", background: "#e6f9f8", color: "#00B3A7", fontWeight: 700 },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  campo: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 700, color: "#475569", fontFamily: "sans-serif" },
  input: { border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "sans-serif", outline: "none", boxSizing: "border-box" },
  roles: { display: "flex", gap: 8 },
  rolBtn: { flex: 1, padding: "9px 4px", border: "1.5px solid #e2e8f0", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 13, fontFamily: "sans-serif", color: "#475569" },
  rolActivo: { border: "1.5px solid #00B3A7", background: "#e6f9f8", color: "#00B3A7", fontWeight: 700 },
  error: { background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: "sans-serif" },
  btn: { background: "#00B3A7", color: "white", border: "none", borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "sans-serif" },
};
