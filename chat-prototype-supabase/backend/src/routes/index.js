import { Router } from "express";
import multer from "multer";
import { usuarioController } from "../controllers/usuarioController.js";
import { canalController } from "../controllers/canalController.js";
import { mensajeController } from "../controllers/mensajeController.js";
import { authJWT } from "../middleware/authJWT.js";
import { validarRol } from "../middleware/validarRol.js";

const router = Router();
// Multer en memoria — el service sube el buffer a Supabase Storage
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ── Auth ────────────────────────────────────────────────────────────────────
router.post("/auth/registrar", usuarioController.registrar);
router.post("/auth/login", usuarioController.login);
router.get("/auth/me", authJWT, usuarioController.me);

// ── Usuarios ────────────────────────────────────────────────────────────────
// Médicos y operadores pueden listar usuarios (médicos filtran por rol=socio en el cliente)
router.get("/usuarios", authJWT, validarRol("medico", "operador"), usuarioController.listar);

// ── Canales ─────────────────────────────────────────────────────────────────
router.get("/canales", authJWT, canalController.listar);
router.get("/canales/mios", authJWT, canalController.getMios);
router.post("/canales", authJWT, canalController.crear);
router.get("/canales/:canalId/miembros", authJWT, canalController.getMiembros);
// Agregar miembro: sólo operador o médico
router.post(
  "/canales/:canalId/miembros",
  authJWT,
  validarRol("medico", "operador"),
  canalController.agregarMiembro
);

// ── Mensajes ─────────────────────────────────────────────────────────────────
router.get("/canales/:canalId/mensajes", authJWT, mensajeController.getHistorial);
router.post("/canales/:canalId/mensajes", authJWT, mensajeController.enviar);
router.post(
  "/canales/:canalId/mensajes/archivo",
  authJWT,
  upload.single("archivo"),
  mensajeController.subirArchivo
);

export default router;
