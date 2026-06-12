import { supabase } from "../config/supabase.js";

export class NotificacionService {
  async crear({ usuarioId, tipo, datos = {} }) {
    const { data, error } = await supabase
      .from("notificaciones")
      .insert({ usuario_id: usuarioId, tipo, datos })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getMias(usuarioId, { soloNoLeidas = false } = {}) {
    let query = supabase
      .from("notificaciones")
      .select("id, tipo, leida, datos, creado_en")
      .eq("usuario_id", usuarioId)
      .order("creado_en", { ascending: false })
      .limit(50);

    if (soloNoLeidas) query = query.eq("leida", false);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  async marcarLeida(id, usuarioId) {
    const { error } = await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("id", id)
      .eq("usuario_id", usuarioId);

    if (error) throw new Error(error.message);
  }

  async marcarTodasLeidas(usuarioId) {
    const { error } = await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("usuario_id", usuarioId)
      .eq("leida", false);

    if (error) throw new Error(error.message);
  }
}
