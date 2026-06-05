/**
 * Dominio: Usuario
 * Representa un usuario del sistema con su rol asignado.
 * Esta clase sólo contiene lógica de negocio pura (sin dependencias externas).
 */
export class Usuario {
  static ROLES = ["socio", "medico", "operador"];

  constructor({ id, nombre, email, rol, creadoEn }) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.rol = rol;
    this.creadoEn = creadoEn;
  }

  static validarRol(rol) {
    return Usuario.ROLES.includes(rol);
  }

  static validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  toPublic() {
    // Retorna los campos seguros para enviar al cliente (sin password_hash)
    return {
      id: this.id,
      nombre: this.nombre,
      email: this.email,
      rol: this.rol,
      creadoEn: this.creadoEn,
    };
  }
}
