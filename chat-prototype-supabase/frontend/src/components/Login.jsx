import { useState } from "react";

export function Login({ onLogin, onRegistrar, error, cargando }) {
  const [modo, setModo] = useState("login");
  const [form, setForm] = useState({ nombre: "", cedula: "", password: "", rol: "socio" });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modo === "login") {
      onLogin({ cedula: form.cedula, password: form.password });
    } else {
      onRegistrar(form);
    }
  };

  return (
    <div style={s.bg}>
      <div style={s.card}>

        {/* Logo / título */}
        <div style={s.logoWrap}>
          <div style={s.logoCircle}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.4 2 2 0 0 1 3.62 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l1.17-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <h1 style={s.titulo}>Emergencia Móvil</h1>
          <p style={s.subtitulo}>Sistema de atención médica</p>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {[
            { id: "login", label: "Iniciar sesión" },
            { id: "registrar", label: "Registrarse" },
          ].map((t) => (
            <button
              key={t.id}
              style={{ ...s.tab, ...(modo === t.id ? s.tabActivo : {}) }}
              onClick={() => setModo(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {modo === "registrar" && (
            <Campo label="Nombre completo" value={form.nombre} onChange={(v) => set("nombre", v)} placeholder="Ej: Juan Pérez" />
          )}

          <Campo
            label="Cédula"
            type="number"
            value={form.cedula}
            onChange={(v) => set("cedula", v)}
            placeholder="Número de cédula"
          />

          <Campo
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={(v) => set("password", v)}
            placeholder="Mínimo 6 caracteres"
          />

          {modo === "registrar" && (
            <div style={s.campoWrap}>
              <label style={s.label}>Rol</label>
              <div style={s.roles}>
                {[
                  { val: "socio", label: "Socio", icon: "👤" },
                  { val: "medico", label: "Médico", icon: "🩺" },
                  { val: "operador", label: "Operador", icon: "🎛️" },
                ].map((r) => (
                  <button
                    key={r.val}
                    type="button"
                    style={{ ...s.rolBtn, ...(form.rol === r.val ? s.rolActivo : {}) }}
                    onClick={() => set("rol", r.val)}
                  >
                    <span style={s.rolIcon}>{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={s.errorBox}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button style={{ ...s.btnSubmit, opacity: cargando ? 0.7 : 1 }} disabled={cargando}>
            {cargando ? "Cargando..." : modo === "login" ? "Ingresar" : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Campo({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div style={s.campoWrap}>
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
  bg: {
    minHeight: "100dvh",
    background: "#f0f2f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    background: "white",
    borderRadius: 20,
    padding: "32px 28px",
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 4px 24px rgba(0,0,0,.08)",
  },

  // Logo
  logoWrap: { textAlign: "center", marginBottom: 28 },
  logoCircle: {
    width: 60, height: 60, borderRadius: "50%",
    background: "#0d9488",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    marginBottom: 12,
    boxShadow: "0 4px 14px rgba(13,148,136,.35)",
  },
  titulo: { margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" },
  subtitulo: { margin: "4px 0 0", fontSize: 13, color: "#9ca3af" },

  // Tabs
  tabs: {
    display: "flex",
    background: "#f3f4f6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  tab: {
    flex: 1, padding: "8px 0", border: "none", background: "transparent",
    borderRadius: 9, cursor: "pointer", fontSize: 14, color: "#6b7280",
    fontFamily: "inherit", fontWeight: 500, transition: "all .15s",
  },
  tabActivo: {
    background: "white", color: "#111827", fontWeight: 700,
    boxShadow: "0 1px 4px rgba(0,0,0,.1)",
  },

  // Form
  form: { display: "flex", flexDirection: "column", gap: 16 },
  campoWrap: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: {
    border: "1.5px solid #e5e7eb",
    borderRadius: 12,
    padding: "11px 14px",
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none",
    color: "#111827",
    background: "#fafafa",
    transition: "border-color .15s",
    width: "100%",
    boxSizing: "border-box",
  },

  // Roles
  roles: { display: "flex", gap: 8 },
  rolBtn: {
    flex: 1, padding: "10px 4px",
    border: "1.5px solid #e5e7eb", borderRadius: 12,
    background: "#fafafa", cursor: "pointer",
    fontSize: 12, fontFamily: "inherit", color: "#6b7280",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    transition: "all .15s",
  },
  rolActivo: {
    border: "1.5px solid #0d9488",
    background: "#f0fdfa", color: "#0d9488", fontWeight: 700,
  },
  rolIcon: { fontSize: 20 },

  // Error
  errorBox: {
    background: "#fef2f2", color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: 10, padding: "10px 14px",
    fontSize: 13, display: "flex", alignItems: "center", gap: 8,
  },

  // Submit
  btnSubmit: {
    background: "#0d9488", color: "white", border: "none",
    borderRadius: 12, padding: 14, fontSize: 15,
    fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
    marginTop: 4, transition: "opacity .15s",
  },
};
