import { ChatRequestService } from "../services/ChatRequestService.js";

const service = new ChatRequestService();

export const chatRequestController = {
  /** POST /chat-requests — médico/operador crea una solicitud */
  async crear(req, res) {
    try {
      const { receptorId, nombreCabina } = req.body;
      if (!receptorId) return res.status(400).json({ error: "receptorId es requerido" });

      const data = await service.crear({
        remitenteId: req.usuario.id,
        receptorId,
        nombreCabina: nombreCabina || req.usuario.nombre,
      });
      res.status(201).json(data);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  /** PATCH /chat-requests/:requestId — socio acepta o rechaza */
  async responder(req, res) {
    try {
      const { estado } = req.body;
      const data = await service.responder({
        chatRequestId: req.params.requestId,
        estado,
        receptorId: req.usuario.id,
      });
      res.json(data);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  /** GET /chat-requests/pendientes — solicitudes pendientes para el usuario actual */
  async getPendientes(req, res) {
    try {
      const data = await service.getPendientes(req.usuario.id);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  /** GET /casos/:casoId/chat-requests */
  async getByCaso(req, res) {
    try {
      const data = await service.getByCaso(req.params.casoId);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
