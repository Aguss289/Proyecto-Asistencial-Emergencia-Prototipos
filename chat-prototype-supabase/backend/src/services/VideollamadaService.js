import { supabase } from "../config/supabase.js";

export class VideollamadaService {
  // Inicia una videollamada en un canal.
  // Finaliza cualquier llamada activa previa en ese canal antes de crear la nueva.
  async iniciar({ canalId, iniciadoPor }) {
    await supabase
      .from("videollamadas")
      .update({ estado: "finalizada", finalizada_en: new Date().toISOString() })
      .eq("canal_id", canalId)
      .eq("estado", "activa");

    const { data, error } = await supabase
      .from("videollamadas")
      .insert({ canal_id: canalId, iniciado_por: iniciadoPor })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Finaliza o marca como rechazada una videollamada
  async finalizar({ llamadaId, canalId, estado = "finalizada" }) {
    const { data, error } = await supabase
      .from("videollamadas")
      .update({ estado, finalizada_en: new Date().toISOString() })
      .eq("id", llamadaId)
      .eq("canal_id", canalId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Historial de videollamadas de un canal (últimas 20)
  async historial(canalId) {
    const { data, error } = await supabase
      .from("videollamadas")
      .select(`
        id, canal_id, estado, iniciada_en, finalizada_en,
        iniciado_por:usuarios(nombre, rol)
      `)
      .eq("canal_id", canalId)
      .order("iniciada_en", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return data;
  }
}
