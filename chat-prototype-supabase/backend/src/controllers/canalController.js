import { CanalService } from "../services/CanalService.js";

const svc = new CanalService();

export const canalController = {
  async crear(req, res) {
    try {
      const canal = await svc.crear({
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        miembroExtraId: req.body.miembroExtraId, // socio elegido por el médico
        creadoPor: req.usuario.id,
      });
      res.status(201).json(canal);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async getMios(req, res) {
    try {
      const canales = await svc.getMios(req.usuario.id);
      res.json(canales);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async listar(req, res) {
    try {
      const canales = await svc.listar();
      res.json(canales);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async agregarMiembro(req, res) {
    try {
      await svc.agregarMiembro({
        canalId: req.params.canalId,
        usuarioId: req.body.usuarioId,
      });
      res.json({ ok: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async getMiembros(req, res) {
    try {
      const miembros = await svc.getMiembros(req.params.canalId);
      res.json(miembros);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
