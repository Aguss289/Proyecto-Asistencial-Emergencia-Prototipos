import { UsuarioService } from "../services/UsuarioService.js";

const svc = new UsuarioService();

export const usuarioController = {
  async registrar(req, res) {
    try {
      const result = await svc.registrar(req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async login(req, res) {
    try {
      const result = await svc.login(req.body);
      res.json(result);
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  },

  async me(req, res) {
    try {
      const usuario = await svc.getById(req.usuario.id);
      res.json(usuario);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  async listar(req, res) {
    try {
      const usuarios = await svc.listar({ rol: req.query.rol });
      res.json(usuarios);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
