import { supabase } from "../config/supabase.js";
import { Canal } from "../domain/Canal.js";

export class CanalService {
  // Crea un canal y agrega al creador (y opcionalmente a otro miembro) automáticamente
  async crear({ nombre, descripcion, creadoPor, miembroExtraId }) {
    if (!nombre || nombre.trim().length === 0) {
      throw new Error("El nombre del canal es obligatorio");
    }

    const { data: canal, error } = await supabase
      .from("canales")
      .insert({ nombre: nombre.trim(), descripcion, creado_por: creadoPor })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Agregar miembros iniciales
    const miembros = [{ canal_id: canal.id, usuario_id: creadoPor }];
    if (miembroExtraId && miembroExtraId !== creadoPor) {
      miembros.push({ canal_id: canal.id, usuario_id: miembroExtraId });
    }
    await supabase.from("canal_miembros").insert(miembros);

    return new Canal({
      id: canal.id,
      nombre: canal.nombre,
      descripcion: canal.descripcion,
      creadoPor: canal.creado_por,
      creadoEn: canal.creado_en,
      miembros: miembros.map((m) => m.usuario_id),
    });
  }

  // Retorna los canales a los que pertenece un usuario
  async getMios(usuarioId) {
    const { data, error } = await supabase
      .from("canal_miembros")
      .select("canal_id, canales(id, nombre, descripcion, creado_por, creado_en)")
      .eq("usuario_id", usuarioId);

    if (error) throw new Error(error.message);

    return data.map((row) => ({
      id: row.canales.id,
      nombre: row.canales.nombre,
      descripcion: row.canales.descripcion,
      creadoPor: row.canales.creado_por,
      creadoEn: row.canales.creado_en,
    }));
  }

  // Lista todos los canales (para que un operador pueda verlos todos)
  async listar() {
    const { data, error } = await supabase
      .from("canales")
      .select("id, nombre, descripcion, creado_por, creado_en")
      .order("creado_en", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  // Agrega un miembro a un canal existente
  async agregarMiembro({ canalId, usuarioId }) {
    const { error } = await supabase
      .from("canal_miembros")
      .insert({ canal_id: canalId, usuario_id: usuarioId });

    // Ignorar error de duplicate key (ya es miembro)
    if (error && !error.message.includes("duplicate")) {
      throw new Error(error.message);
    }
  }

  // Obtiene los miembros de un canal
  async getMiembros(canalId) {
    const { data, error } = await supabase
      .from("canal_miembros")
      .select("usuarios(id, nombre, cedula, rol)")
      .eq("canal_id", canalId);

    if (error) throw new Error(error.message);
    return data.map((row) => row.usuarios);
  }
}
