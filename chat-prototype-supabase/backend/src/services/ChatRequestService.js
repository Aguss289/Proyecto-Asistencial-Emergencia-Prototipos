import { supabase } from "../config/supabase.js";
import { CasoService } from "./CasoService.js";
import { CanalService } from "./CanalService.js";
import { NotificacionService } from "./NotificacionService.js";

const casoSvc   = new CasoService();
const canalSvc  = new CanalService();
const notifSvc  = new NotificacionService();

export class ChatRequestService {
  /**
   * Médico/operador crea una solicitud de chat.
   * Esto crea automáticamente el Caso y la ChatRequest asociada.
   */
  async crear({ remitenteId, receptorId, nombreCabina }) {
    // 1. Crear el caso
    const caso = await casoSvc.crear({
      canal: "MOBILE_APP",
      pacienteId: receptorId,
      operadorId: remitenteId,
    });

    // 2. Insertar el chat_request
    const { data: req, error } = await supabase
      .from("chat_requests")
      .insert({
        caso_id: caso.id,
        remitente_id: remitenteId,
        receptor_id: receptorId,
        nombre_cabina: nombreCabina,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // 3. Notificar al receptor (socio)
    await notifSvc.crear({
      usuarioId: receptorId,
      tipo: "chat_request",
      datos: {
        chat_request_id: req.id,
        caso_id: caso.id,
        remitente_nombre: nombreCabina,
      },
    });

    return { caso, chatRequest: req };
  }

  /**
   * El socio acepta o rechaza la solicitud.
   * Si acepta: se crea el canal de chat y se vincula al caso.
   */
  async responder({ chatRequestId, estado, receptorId }) {
    if (!["aceptado", "rechazado"].includes(estado))
      throw new Error("Estado debe ser 'aceptado' o 'rechazado'");

    const { data: req, error } = await supabase
      .from("chat_requests")
      .update({ estado, respondido_en: new Date().toISOString() })
      .eq("id", chatRequestId)
      .eq("receptor_id", receptorId)
      .eq("estado", "pendiente")       // solo se puede responder una vez
      .select()
      .single();

    if (error || !req) throw new Error("Chat request no encontrada o ya respondida");

    if (estado === "aceptado") {
      // Crear el canal de chat
      const canal = await canalSvc.crear({
        nombre: `Consulta ${new Date().toLocaleDateString("es-UY")}`,
        descripcion: `Caso ${req.caso_id}`,
        creadoPor: req.remitente_id,
        miembroExtraId: req.receptor_id,
      });

      // Vincular canal al caso
      await supabase
        .from("canales")
        .update({ caso_id: req.caso_id })
        .eq("id", canal.id);

      // Actualizar estado del caso
      await supabase
        .from("casos")
        .update({ estado: "en_atencion" })
        .eq("id", req.caso_id);

      // Notificar al remitente
      await notifSvc.crear({
        usuarioId: req.remitente_id,
        tipo: "chat_aceptado",
        datos: { caso_id: req.caso_id, canal_id: canal.id },
      });

      return { chatRequest: req, canal };
    }

    // Si rechaza: solo notificar al remitente
    await notifSvc.crear({
      usuarioId: req.remitente_id,
      tipo: "chat_rechazado",
      datos: { caso_id: req.caso_id },
    });

    return { chatRequest: req, canal: null };
  }

  /** Solicitudes pendientes para el receptor (socio) */
  async getPendientes(receptorId) {
    const { data, error } = await supabase
      .from("chat_requests")
      .select(`
        id, estado, nombre_cabina, creado_en,
        caso:casos(id, canal, prioridad, estado),
        remitente:usuarios!chat_requests_remitente_id_fkey(id, nombre, rol)
      `)
      .eq("receptor_id", receptorId)
      .eq("estado", "pendiente")
      .order("creado_en", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  /** Historial de requests de un caso */
  async getByCaso(casoId) {
    const { data, error } = await supabase
      .from("chat_requests")
      .select("id, estado, nombre_cabina, creado_en, respondido_en")
      .eq("caso_id", casoId)
      .order("creado_en", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }
}
