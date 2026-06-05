import { supabase } from "../config/supabase.js";
import { Mensaje } from "../domain/Mensaje.js";

export class MensajeService {
  // Envía un mensaje de texto a un canal
  async enviar({ canalId, autorId, autorNombre, autorRol, contenido }) {
    if (!contenido || contenido.trim().length === 0) {
      throw new Error("El contenido no puede estar vacío");
    }

    const { data, error } = await supabase
      .from("mensajes")
      .insert({
        canal_id: canalId,
        autor_id: autorId,
        autor_nombre: autorNombre,
        autor_rol: autorRol,
        tipo: "texto",
        contenido: contenido.trim(),
      })
      .select("id, canal_id, autor_id, autor_nombre, autor_rol, tipo, contenido, creado_en")
      .single();

    if (error) throw new Error(error.message);

    return this._mapear(data);
  }

  // Sube un archivo a Supabase Storage y guarda el mensaje
  async subirArchivo({ canalId, autorId, autorNombre, autorRol, file, tipo }) {
    if (!Mensaje.validarTipo(tipo)) {
      throw new Error(`Tipo inválido: ${tipo}`);
    }

    const extension = file.originalname.split(".").pop();
    const nombreArchivo = `${canalId}/${Date.now()}-${autorId}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-archivos")
      .upload(nombreArchivo, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = supabase.storage
      .from("chat-archivos")
      .getPublicUrl(nombreArchivo);

    const { data, error } = await supabase
      .from("mensajes")
      .insert({
        canal_id: canalId,
        autor_id: autorId,
        autor_nombre: autorNombre,
        autor_rol: autorRol,
        tipo,
        contenido: urlData.publicUrl,
      })
      .select("id, canal_id, autor_id, autor_nombre, autor_rol, tipo, contenido, creado_en")
      .single();

    if (error) throw new Error(error.message);

    return this._mapear(data);
  }

  // Obtiene el historial de mensajes de un canal (últimos 100)
  async getHistorial(canalId, limite = 100) {
    const { data, error } = await supabase
      .from("mensajes")
      .select("id, canal_id, autor_id, autor_nombre, autor_rol, tipo, contenido, creado_en")
      .eq("canal_id", canalId)
      .order("creado_en", { ascending: true })
      .limit(limite);

    if (error) throw new Error(error.message);
    return data.map(this._mapear);
  }

  _mapear(row) {
    return new Mensaje({
      id: row.id,
      canalId: row.canal_id,
      autorId: row.autor_id,
      autorNombre: row.autor_nombre ?? "Desconocido",
      autorRol: row.autor_rol ?? "socio",
      tipo: row.tipo,
      contenido: row.contenido,
      creadoEn: row.creado_en,
    });
  }
}
