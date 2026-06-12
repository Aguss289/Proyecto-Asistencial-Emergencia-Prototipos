import { CasoService } from "../services/CasoService.js";

const service = new CasoService();

export const casoController = {
  async listar(req, res) {
    try {
      const { id: usuarioId, rol } = req.usuario;
      const data = await service.listar({ usuarioId, rol });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async getById(req, res) {
    try {
      const data = await service.getById(req.params.casoId);
      res.json(data);
    } catch (e) {
      res.status(404).json({ error: e.message });
    }
  },

  async actualizar(req, res) {
    try {
      const { estado, prioridad } = req.body;
      const data = await service.actualizarEstado(req.params.casoId, { estado, prioridad });
      res.json(data);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },
};
