import { supabase } from "../config/supabase.js";

// Preguntas de triaje predefinidas (pueden venir de BD en el futuro)
const PREGUNTAS_TRIAJE = [
  "¿Cuál es el síntoma principal del paciente?",
  "¿Desde cuándo tiene estos síntomas?",
  "¿Tiene dificultad para respirar?",
  "¿Tiene dolor en el pecho?",
  "¿Está consciente y orientado?",
  "¿Tiene alguna enfermedad crónica conocida?",
  "¿Está tomando alguna medicación actualmente?",
];

export class CuestionarioService {
  /** Inicia un cuestionario de triaje para un caso */
  async iniciar(casoId) {
    const { data: cues, error } = await supabase
      .from("cuestionarios")
      .insert({ caso_id: casoId })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const turns = PREGUNTAS_TRIAJE.map((pregunta, i) => ({
      cuestionario_id: cues.id,
      pregunta,
      orden: i + 1,
    }));

    await supabase.from("conversation_turns").insert(turns);
    return cues;
  }

  /** Obtiene cuestionario (con turns y summary) de un caso */
  async getByCaso(casoId) {
    const { data, error } = await supabase
      .from("cuestionarios")
      .select(`
        id, estado, prioridad_tentativa, creado_en,
        conversation_turns(id, pregunta, respuesta, orden),
        summaries(id, contenido, creado_en)
      `)
      .eq("caso_id", casoId)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  /** Lista los turns de un cuestionario en orden */
  async getTurns(cuestionarioId) {
    const { data, error } = await supabase
      .from("conversation_turns")
      .select("id, pregunta, respuesta, orden")
      .eq("cuestionario_id", cuestionarioId)
      .order("orden");

    if (error) throw new Error(error.message);
    return data;
  }

  /** Registra la respuesta a un turn */
  async responderTurn({ cuestionarioId, turnId, respuesta }) {
    const { data, error } = await supabase
      .from("conversation_turns")
      .update({ respuesta })
      .eq("id", turnId)
      .eq("cuestionario_id", cuestionarioId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /** Completa el cuestionario y genera el summary */
  async completar({ cuestionarioId, prioridadTentativa, resumen }) {
    const PRIORIDADES = ["clave_1", "clave_2", "clave_3", "clave_4"];
    if (prioridadTentativa && !PRIORIDADES.includes(prioridadTentativa))
      throw new Error("Prioridad tentativa inválida");

    await supabase
      .from("cuestionarios")
      .update({ estado: "completado", prioridad_tentativa: prioridadTentativa })
      .eq("id", cuestionarioId);

    const { data, error } = await supabase
      .from("summaries")
      .insert({ cuestionario_id: cuestionarioId, contenido: resumen })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
