import { supabase } from "../config/supabase.js";

export class CasoService {
  async crear({ canal = "MOBILE_APP", pacienteId, operadorId }) {
    const { data, error } = await supabase
      .from("casos")
      .insert({ canal, paciente_id: pacienteId, operador_id: operadorId })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async listar({ usuarioId, rol } = {}) {
    let query = supabase
      .from("casos")
      .select(`
        id, canal, estado, prioridad, creado_en, cerrado_en,
        paciente:usuarios!casos_paciente_id_fkey(id, nombre, cedula),
        operador:usuarios!casos_operador_id_fkey(id, nombre),
        canales(id, nombre, descripcion)
      `)
      .order("creado_en", { ascending: false });

    if (rol === "socio")     query = query.eq("paciente_id", usuarioId);
    if (rol === "operador")  query = query.eq("operador_id", usuarioId);
    // médico: ve todos los casos abiertos/en_atencion
    if (rol === "medico")    query = query.neq("estado", "cerrado");

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  async getById(id) {
    const { data, error } = await supabase
      .from("casos")
      .select(`
        id, canal, estado, prioridad, creado_en, cerrado_en,
        paciente:usuarios!casos_paciente_id_fkey(id, nombre, cedula),
        operador:usuarios!casos_operador_id_fkey(id, nombre),
        canales(id, nombre, descripcion)
      `)
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async actualizarEstado(id, { estado, prioridad }) {
    const ESTADOS = ["abierto", "en_atencion", "cerrado"];
    const PRIORIDADES = ["clave_1", "clave_2", "clave_3", "clave_4"];

    const update = {};
    if (estado) {
      if (!ESTADOS.includes(estado)) throw new Error("Estado inválido");
      update.estado = estado;
      if (estado === "cerrado") update.cerrado_en = new Date().toISOString();
    }
    if (prioridad) {
      if (!PRIORIDADES.includes(prioridad)) throw new Error("Prioridad inválida");
      update.prioridad = prioridad;
    }
    if (!Object.keys(update).length) throw new Error("Nada que actualizar");

    const { data, error } = await supabase
      .from("casos")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
