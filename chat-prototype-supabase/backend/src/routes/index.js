import { Router } from "express";
import multer from "multer";
import { usuarioController }      from "../controllers/usuarioController.js";
import { canalController }        from "../controllers/canalController.js";
import { mensajeController }      from "../controllers/mensajeController.js";
import { videollamadaController } from "../controllers/videollamadaController.js";
import { casoController }         from "../controllers/casoController.js";
import { chatRequestController }  from "../controllers/chatRequestController.js";
import { notificacionController } from "../controllers/notificacionController.js";
import { cuestionarioController } from "../controllers/cuestionarioController.js";
import { authJWT }                from "../middleware/authJWT.js";
import { validarRol }             from "../middleware/validarRol.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ── Auth ────────────────────────────────────────────────────────────────────
router.post("/auth/registrar", usuarioController.registrar);
router.post("/auth/login",     usuarioController.login);
router.get("/auth/me",         authJWT, usuarioController.me);

// ── Usuarios ────────────────────────────────────────────────────────────────
router.get("/usuarios", authJWT, validarRol("medico", "operador"), usuarioController.listar);

// ── Casos ───────────────────────────────────────────────────────────────────
router.get("/casos",             authJWT, casoController.listar);
router.get("/casos/:casoId",     authJWT, casoController.getById);
router.patch("/casos/:casoId",   authJWT, validarRol("medico", "operador"), casoController.actualizar);

// ── Chat Requests ────────────────────────────────────────────────────────────
// Médico/operador crea solicitud; socio lista las pendientes y responde
router.post(
  "/chat-requests",
  authJWT,
  validarRol("medico", "operador"),
  chatRequestController.crear
);
router.get(
  "/chat-requests/pendientes",
  authJWT,
  chatRequestController.getPendientes
);
router.patch(
  "/chat-requests/:requestId",
  authJWT,
  chatRequestController.responder
);
router.get(
  "/casos/:casoId/chat-requests",
  authJWT,
  chatRequestController.getByCaso
);

// ── Cuestionarios ─────────────────────────────────────────────────────────────
router.post(
  "/casos/:casoId/cuestionario",
  authJWT,
  validarRol("medico", "operador"),
  cuestionarioController.iniciar
);
router.get(
  "/casos/:casoId/cuestionario",
  authJWT,
  cuestionarioController.getByCaso
);
router.get(
  "/cuestionarios/:cuestionarioId/turns",
  authJWT,
  cuestionarioController.getTurns
);
router.patch(
  "/cuestionarios/:cuestionarioId/turns/:turnId",
  authJWT,
  cuestionarioController.responderTurn
);
router.post(
  "/cuestionarios/:cuestionarioId/completar",
  authJWT,
  validarRol("medico", "operador"),
  cuestionarioController.completar
);

// ── Notificaciones ────────────────────────────────────────────────────────────
router.get("/notificaciones",              authJWT, notificacionController.getMias);
router.patch("/notificaciones/todas",      authJWT, notificacionController.marcarTodas);
router.patch("/notificaciones/:id",        authJWT, notificacionController.marcarLeida);

// ── Canales ─────────────────────────────────────────────────────────────────
router.get("/canales",                    authJWT, canalController.listar);
router.get("/canales/mios",               authJWT, canalController.getMios);
router.post("/canales",                   authJWT, canalController.crear);
router.get("/canales/:canalId/miembros",  authJWT, canalController.getMiembros);
router.post(
  "/canales/:canalId/miembros",
  authJWT,
  validarRol("medico", "operador"),
  canalController.agregarMiembro
);

// ── Mensajes ─────────────────────────────────────────────────────────────────
router.get("/canales/:canalId/mensajes",  authJWT, mensajeController.getHistorial);
router.post("/canales/:canalId/mensajes", authJWT, mensajeController.enviar);
router.post(
  "/canales/:canalId/mensajes/archivo",
  authJWT,
  upload.single("archivo"),
  mensajeController.subirArchivo
);

// ── Videollamadas ─────────────────────────────────────────────────────────────
router.post(
  "/canales/:canalId/videollamadas",
  authJWT,
  validarRol("medico", "socio"),
  videollamadaController.iniciar
);
router.patch(
  "/canales/:canalId/videollamadas/:llamadaId",
  authJWT,
  videollamadaController.finalizar
);
router.get(
  "/canales/:canalId/videollamadas",
  authJWT,
  videollamadaController.historial
);

export default router;
