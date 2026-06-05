/**
 * Middleware: validarRol
 * Uso: validarRol("operador")  →  sólo operadores
 *      validarRol("medico", "operador")  →  médicos u operadores
 */
export function validarRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: "No autenticado" });
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: `Acceso denegado. Rol requerido: ${rolesPermitidos.join(" | ")}`,
      });
    }
    next();
  };
}
