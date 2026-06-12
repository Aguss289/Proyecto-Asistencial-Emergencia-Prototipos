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
export async function apiRegistrar({ nombre, cedula, password, rol }) {
  return handle(await fetch(`${BASE}/auth/registrar`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ nombre, cedula, password, rol }),
  }));
}

export async function apiLogin({ cedula, password }) {
  return handle(await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ cedula, password }),
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

// ── Casos ─────────────────────────────────────────────────────────────────
export async function apiGetCasos(token) {
  return handle(await fetch(`${BASE}/casos`, { headers: headers(token) }));
}

export async function apiGetCaso(casoId, token) {
  return handle(await fetch(`${BASE}/casos/${casoId}`, { headers: headers(token) }));
}

export async function apiActualizarCaso({ casoId, estado, prioridad, token }) {
  return handle(await fetch(`${BASE}/casos/${casoId}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ estado, prioridad }),
  }));
}

// ── Chat Requests ─────────────────────────────────────────────────────────
export async function apiCrearChatRequest({ receptorId, nombreCabina, token }) {
  return handle(await fetch(`${BASE}/chat-requests`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ receptorId, nombreCabina }),
  }));
}

export async function apiGetChatRequestsPendientes(token) {
  return handle(await fetch(`${BASE}/chat-requests/pendientes`, { headers: headers(token) }));
}

export async function apiResponderChatRequest({ requestId, estado, token }) {
  return handle(await fetch(`${BASE}/chat-requests/${requestId}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ estado }),
  }));
}

// ── Notificaciones ────────────────────────────────────────────────────────
export async function apiGetNotificaciones(token, soloNoLeidas = false) {
  const q = soloNoLeidas ? "?no_leidas=true" : "";
  return handle(await fetch(`${BASE}/notificaciones${q}`, { headers: headers(token) }));
}

export async function apiMarcarNotifLeida(id, token) {
  return handle(await fetch(`${BASE}/notificaciones/${id}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({}),
  }));
}

export async function apiMarcarTodasLeidas(token) {
  return handle(await fetch(`${BASE}/notificaciones/todas`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({}),
  }));
}

// ── Cuestionarios ──────────────────────────────────────────────────────────
export async function apiIniciarCuestionario(casoId, token) {
  return handle(await fetch(`${BASE}/casos/${casoId}/cuestionario`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({}),
  }));
}

export async function apiGetCuestionario(casoId, token) {
  return handle(await fetch(`${BASE}/casos/${casoId}/cuestionario`, { headers: headers(token) }));
}

export async function apiResponderTurn({ cuestionarioId, turnId, respuesta, token }) {
  return handle(await fetch(`${BASE}/cuestionarios/${cuestionarioId}/turns/${turnId}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ respuesta }),
  }));
}

export async function apiCompletarCuestionario({ cuestionarioId, prioridadTentativa, resumen, token }) {
  return handle(await fetch(`${BASE}/cuestionarios/${cuestionarioId}/completar`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ prioridadTentativa, resumen }),
  }));
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
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  }));
}

// ── Videollamadas ─────────────────────────────────────────────────────────
export async function apiIniciarVideollamada({ canalId, token }) {
  return handle(await fetch(`${BASE}/canales/${canalId}/videollamadas`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({}),
  }));
}

export async function apiFinalizarVideollamada({ canalId, llamadaId, estado = "finalizada", token }) {
  return handle(await fetch(`${BASE}/canales/${canalId}/videollamadas/${llamadaId}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ estado }),
  }));
}
