const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function headers(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handle(res) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error desconocido");
  return json;
}

// ── Auth ──────────────────────────────────────────────────────────────────
export async function apiRegistrar({ nombre, email, password, rol }) {
  return handle(await fetch(`${BASE}/auth/registrar`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ nombre, email, password, rol }),
  }));
}

export async function apiLogin({ email, password }) {
  return handle(await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, password }),
  }));
}

export async function apiMe(token) {
  return handle(await fetch(`${BASE}/auth/me`, { headers: headers(token) }));
}

// ── Usuarios ──────────────────────────────────────────────────────────────
export async function apiListarUsuarios(token, rol) {
  const query = rol ? `?rol=${rol}` : "";
  return handle(await fetch(`${BASE}/usuarios${query}`, { headers: headers(token) }));
}

// ── Canales ───────────────────────────────────────────────────────────────
export async function apiGetCanales(token) {
  return handle(await fetch(`${BASE}/canales`, { headers: headers(token) }));
}

export async function apiGetMisCanales(token) {
  return handle(await fetch(`${BASE}/canales/mios`, { headers: headers(token) }));
}

export async function apiCrearCanal({ nombre, descripcion, miembroExtraId, token }) {
  return handle(await fetch(`${BASE}/canales`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ nombre, descripcion, miembroExtraId }),
  }));
}

export async function apiAgregarMiembro({ canalId, usuarioId, token }) {
  return handle(await fetch(`${BASE}/canales/${canalId}/miembros`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ usuarioId }),
  }));
}

// ── Mensajes ──────────────────────────────────────────────────────────────
export async function apiGetHistorial(canalId, token) {
  return handle(await fetch(`${BASE}/canales/${canalId}/mensajes`, { headers: headers(token) }));
}

export async function apiEnviarMensaje({ canalId, contenido, token }) {
  return handle(await fetch(`${BASE}/canales/${canalId}/mensajes`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ contenido }),
  }));
}

export async function apiSubirArchivo({ canalId, archivo, token }) {
  const form = new FormData();
  form.append("archivo", archivo);
  return handle(await fetch(`${BASE}/canales/${canalId}/mensajes/archivo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }, // NO Content-Type — lo pone el browser
    body: form,
  }));
}
