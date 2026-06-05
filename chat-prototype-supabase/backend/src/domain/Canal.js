/**
 * Dominio: Canal
 * Un canal es una sala de chat a la que se unen varios usuarios.
 */
export class Canal {
  constructor({ id, nombre, descripcion, creadoPor, creadoEn, miembros = [] }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.creadoPor = creadoPor;
    this.creadoEn = creadoEn;
    this.miembros = miembros; // array de usuario_id
  }

  tieneMiembro(usuarioId) {
    return this.miembros.includes(usuarioId);
  }
}
