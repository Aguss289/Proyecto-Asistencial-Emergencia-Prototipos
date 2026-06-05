import jwt from "jsonwebtoken";

/**
 * Middleware: authJWT
 * Verifica el token Bearer del header Authorization.
 * Si es válido, inyecta req.usuario con { id, email, rol }.
 */
export function authJWT(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: payload.id, nombre: payload.nombre, email: payload.email, rol: payload.rol };
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
