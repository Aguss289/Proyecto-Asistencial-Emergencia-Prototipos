import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";
import { Usuario } from "../domain/Usuario.js";

export class UsuarioService {
  // Registra un nuevo usuario
  async registrar({ nombre, cedula, password, rol }) {
    if (!Usuario.validarCedula(cedula)) {
      throw new Error("Cédula inválida. Debe contener entre 6 y 10 dígitos numéricos");
    }
    if (!Usuario.validarRol(rol)) {
      throw new Error(`Rol inválido. Opciones: ${Usuario.ROLES.join(", ")}`);
    }
    if (!password || password.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres");
    }

    // Verificar si la cédula ya existe
    const { data: existente } = await supabase
      .from("usuarios")
      .select("id")
      .eq("cedula", cedula)
      .maybeSingle();

    if (existente) throw new Error("La cédula ya está registrada");

    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("usuarios")
      .insert({ nombre, cedula: String(cedula), password_hash, rol })
      .select("id, nombre, cedula, rol, creado_en")
      .single();

    if (error) throw new Error(error.message);

    const usuario = new Usuario({
      id: data.id,
      nombre: data.nombre,
      cedula: data.cedula,
      rol: data.rol,
      creadoEn: data.creado_en,
    });

    return {
      usuario: usuario.toPublic(),
      token: this._generarToken(usuario),
    };
  }

  // Login
  async login({ cedula, password }) {
    if (!cedula || !password) throw new Error("Cédula y contraseña son requeridas");

    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nombre, cedula, rol, password_hash, creado_en")
      .eq("cedula", String(cedula))
      .maybeSingle();

    if (error || !data) throw new Error("Credenciales inválidas");

    const ok = await bcrypt.compare(password, data.password_hash);
    if (!ok) throw new Error("Credenciales inválidas");

    const usuario = new Usuario({
      id: data.id,
      nombre: data.nombre,
      cedula: data.cedula,
      rol: data.rol,
      creadoEn: data.creado_en,
    });

    return {
      usuario: usuario.toPublic(),
      token: this._generarToken(usuario),
    };
  }

  // Obtiene un usuario por ID
  async getById(id) {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nombre, cedula, rol, creado_en")
      .eq("id", id)
      .single();

    if (error || !data) throw new Error("Usuario no encontrado");

    return new Usuario({
      id: data.id,
      nombre: data.nombre,
      cedula: data.cedula,
      rol: data.rol,
      creadoEn: data.creado_en,
    }).toPublic();
  }

  // Lista usuarios, opcionalmente filtrado por rol
  async listar({ rol } = {}) {
    let query = supabase
      .from("usuarios")
      .select("id, nombre, cedula, rol, creado_en")
      .order("nombre");

    if (rol) query = query.eq("rol", rol);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  _generarToken(usuario) {
    return jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, cedula: usuario.cedula, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
  }
}
