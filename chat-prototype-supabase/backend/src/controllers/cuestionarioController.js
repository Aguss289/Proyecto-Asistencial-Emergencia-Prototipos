import { CuestionarioService } from "../services/CuestionarioService.js";

const service = new CuestionarioService();

export const cuestionarioController = {
  async iniciar(req, res) {
    try {
      const data = await service.iniciar(req.params.casoId);
      res.status(201).json(data);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  async getByCaso(req, res) {
    try {
      const data = await service.getByCaso(req.params.casoId);
      res.json(data || null);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async getTurns(req, res) {
    try {
      const data = await service.getTurns(req.params.cuestionarioId);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async responderTurn(req, res) {
    try {
      const { respuesta } = req.body;
      if (!respuesta) return res.status(400).json({ error: "respuesta es requerida" });

      const data = await service.responderTurn({
        cuestionarioId: req.params.cuestionarioId,
        turnId: req.params.turnId,
        respuesta,
      });
      res.json(data);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  async completar(req, res) {
    try {
      const { prioridadTentativa, resumen } = req.body;
      if (!resumen) return res.status(400).json({ error: "resumen es requerido" });

      const data = await service.completar({
        cuestionarioId: req.params.cuestionarioId,
        prioridadTentativa,
        resumen,
      });
      res.json(data);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },
};
