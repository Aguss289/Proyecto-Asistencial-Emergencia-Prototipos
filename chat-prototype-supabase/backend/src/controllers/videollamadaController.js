import { VideollamadaService } from "../services/VideollamadaService.js";

const service = new VideollamadaService();

export const videollamadaController = {
  iniciar: async (req, res) => {
    try {
      const { canalId } = req.params;
      const llamada = await service.iniciar({
        canalId,
        iniciadoPor: req.usuario.id,
      });
      res.status(201).json(llamada);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  finalizar: async (req, res) => {
    try {
      const { canalId, llamadaId } = req.params;
      const { estado } = req.body; // "finalizada" | "rechazada"
      const llamada = await service.finalizar({ llamadaId, canalId, estado });
      res.json(llamada);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  historial: async (req, res) => {
    try {
      const { canalId } = req.params;
      const data = await service.historial(canalId);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
