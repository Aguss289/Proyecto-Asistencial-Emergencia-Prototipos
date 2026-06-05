/**
 * Dominio: Mensaje
 * Representa un mensaje dentro de un canal.
 * Puede ser texto, imagen, video o archivo.
 */
export class Mensaje {
  static TIPOS = ["texto", "imagen", "video", "archivo"];

  constructor({ id, canalId, autorId, autorNombre, autorRol, tipo, contenido, creadoEn }) {
    this.id = id;
    this.canalId = canalId;
    this.autorId = autorId;
    this.autorNombre = autorNombre;
    this.autorRol = autorRol;
    this.tipo = tipo;
    this.contenido = contenido;
    this.creadoEn = creadoEn;
  }

  static validarTipo(tipo) {
    return Mensaje.TIPOS.includes(tipo);
  }
}
