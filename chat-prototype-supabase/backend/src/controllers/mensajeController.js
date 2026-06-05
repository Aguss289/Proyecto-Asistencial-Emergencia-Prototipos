import { MensajeService } from "../services/MensajeService.js";

const svc = new MensajeService();

export const mensajeController = {
  async enviar(req, res) {
    try {
      const mensaje = await svc.enviar({
        canalId: req.params.canalId,
        autorId: req.usuario.id,
        autorNombre: req.usuario.nombre,
        autorRol: req.usuario.rol,
        contenido: req.body.contenido,
      });
      res.status(201).json(mensaje);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async getHistorial(req, res) {
    try {
      const mensajes = await svc.getHistorial(req.params.canalId);
      res.json(mensajes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async subirArchivo(req, res) {
    try {
      if (!req.file) return res.status(400).json({ error: "No se recibió archivo" });

      const tipo = req.file.mimetype.startsWith("video") ? "video" : "imagen";

      const mensaje = await svc.subirArchivo({
        canalId: req.params.canalId,
        autorId: req.usuario.id,
        autorNombre: req.usuario.nombre,
        autorRol: req.usuario.rol,
        file: req.file,
        tipo,
      });
      res.status(201).json(mensaje);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};
