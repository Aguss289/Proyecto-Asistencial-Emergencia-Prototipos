/**
 * Dominio: Usuario
 * Representa un usuario del sistema con su rol asignado.
 * Esta clase sólo contiene lógica de negocio pura (sin dependencias externas).
 */
export class Usuario {
  static ROLES = ["socio", "medico", "operador"];

  constructor({ id, nombre, cedula, rol, creadoEn }) {
    this.id = id;
    this.nombre = nombre;
    this.cedula = cedula;
    this.rol = rol;
    this.creadoEn = creadoEn;
  }

  static validarRol(rol) {
    return Usuario.ROLES.includes(rol);
  }

  static validarCedula(cedula) {
    // Solo números, entre 6 y 10 dígitos
    return /^\d{6,10}$/.test(String(cedula));
  }

  toPublic() {
    return {
      id: this.id,
      nombre: this.nombre,
      cedula: this.cedula,
      rol: this.rol,
      creadoEn: this.creadoEn,
    };
  }
}
