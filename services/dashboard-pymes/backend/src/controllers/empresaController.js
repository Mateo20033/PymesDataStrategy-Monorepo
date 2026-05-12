const { query } = require('../config/database');

// ── GET /api/empresas ──────────────────────────────────────────────────────────
const listarEmpresas = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT id, nombre, nit, sector, descripcion, created_at
       FROM empresas WHERE user_id = $1 ORDER BY created_at ASC`,
      [req.user.id]
    );
    return res.json({ success: true, data: { empresas: resultado.rows } });
  } catch (err) {
    console.error('Error en listarEmpresas:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener empresas' });
  }
};

// ── POST /api/empresas/init ────────────────────────────────────────────────────
// Crea empresa por defecto si el usuario aún no tiene ninguna
const initEmpresa = async (req, res) => {
  try {
    // Verificar si ya tiene al menos una empresa
    const existente = await query(
      'SELECT id FROM empresas WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );

    if (existente.rows.length > 0) {
      return res.json({
        success: true,
        message: 'El usuario ya tiene empresa',
        data: { empresa: existente.rows[0], creada: false },
      });
    }

    // Crear la empresa por defecto
    const resultado = await query(
      `INSERT INTO empresas (nombre, sector, user_id)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, sector, created_at`,
      ['Mi Empresa', 'General', req.user.id]
    );

    return res.status(201).json({
      success: true,
      message: 'Empresa creada correctamente',
      data: { empresa: resultado.rows[0], creada: true },
    });
  } catch (err) {
    console.error('Error en initEmpresa:', err);
    return res.status(500).json({ success: false, message: 'Error al crear empresa' });
  }
};

module.exports = { listarEmpresas, initEmpresa };
