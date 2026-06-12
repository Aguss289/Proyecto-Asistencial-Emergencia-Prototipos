import { NotificacionService } from "../services/NotificacionService.js";

const service = new NotificacionService();

export const notificacionController = {
  async getMias(req, res) {
    try {
      const soloNoLeidas = req.query.no_leidas === "true";
      const data = await service.getMias(req.usuario.id, { soloNoLeidas });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async marcarLeida(req, res) {
    try {
      await service.marcarLeida(req.params.id, req.usuario.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  async marcarTodas(req, res) {
    try {
      await service.marcarTodasLeidas(req.usuario.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },
};
