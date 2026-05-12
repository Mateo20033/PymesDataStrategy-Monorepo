const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const SALT_ROUNDS = 10;

/**
 * Genera un JWT firmado con los datos del usuario.
 */
const generarToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ── POST /api/auth/register ────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Validación básica
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'nombre, email y password son obligatorios',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    // Verificar si el email ya existe
    const existente = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existente.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado',
      });
    }

    // Hash de contraseña
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insertar usuario
    const resultado = await query(
      `INSERT INTO users (nombre, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, email, rol, created_at`,
      [nombre.trim(), email.toLowerCase(), password_hash]
    );

    const user = resultado.rows[0];

    // Crear empresa por defecto asociada al nuevo usuario
    const empresaRes = await query(
      `INSERT INTO empresas (nombre, sector, user_id)
       VALUES ($1, $2, $3)
       RETURNING id, nombre`,
      ['Mi Empresa', 'General', user.id]
    );
    const empresa = empresaRes.rows[0];

    const token = generarToken(user);

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      data: { user, token, empresa },
    });
  } catch (err) {
    console.error('Error en register:', err);
    return res.status(500).json({ success: false, message: 'Error al registrar usuario' });
  }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email y password son obligatorios',
      });
    }

    // Buscar usuario
    const resultado = await query(
      'SELECT id, nombre, email, password_hash, rol, activo FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const user = resultado.rows[0];

    if (!user.activo) {
      return res.status(403).json({ success: false, message: 'Cuenta desactivada' });
    }

    // Comparar contraseña
    const passwordValida = await bcrypt.compare(password, user.password_hash);

    if (!passwordValida) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const token = generarToken(user);

    // No devolver el hash en la respuesta
    const { password_hash: _omit, ...userSeguro } = user;

    return res.json({
      success: true,
      message: 'Login exitoso',
      data: { user: userSeguro, token },
    });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ success: false, message: 'Error al iniciar sesión' });
  }
};

// ── GET /api/auth/me ───────────────────────────────────────────────────────────
const me = async (req, res) => {
  try {
    const resultado = await query(
      'SELECT id, nombre, email, rol, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    return res.json({ success: true, data: { user: resultado.rows[0] } });
  } catch (err) {
    console.error('Error en me:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener perfil' });
  }
};

module.exports = { register, login, me };
