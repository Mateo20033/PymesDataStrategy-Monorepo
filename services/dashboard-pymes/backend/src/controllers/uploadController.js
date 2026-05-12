const csv = require('csv-parser');
const { Readable } = require('stream');
const { query } = require('../config/database');

/**
 * Parsea el buffer de un CSV y devuelve un array de objetos.
 * @param {Buffer} buffer
 * @returns {Promise<Object[]>}
 */
const parsearCSV = (buffer) =>
  new Promise((resolve, reject) => {
    const filas = [];
    const stream = Readable.from(buffer);

    stream
      .pipe(csv())
      .on('data', (row) => filas.push(row))
      .on('end', () => resolve(filas))
      .on('error', (err) => reject(err));
  });

// ── POST /api/upload ──────────────────────────────────────────────────────────
const uploadCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se envió ningún archivo' });
    }

    const { empresa_id, nombre_dataset, descripcion, tipo_dataset } = req.body;

    if (!empresa_id) {
      return res.status(400).json({ success: false, message: 'empresa_id es obligatorio' });
    }

    // Verificar que la empresa pertenece al usuario autenticado
    const empresaRes = await query(
      'SELECT id FROM empresas WHERE id = $1 AND user_id = $2',
      [empresa_id, req.user.id]
    );

    if (empresaRes.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos sobre esta empresa',
      });
    }

    // Parsear CSV desde el buffer en memoria
    const filas = await parsearCSV(req.file.buffer);

    if (filas.length === 0) {
      return res.status(400).json({ success: false, message: 'El archivo CSV está vacío' });
    }

    const columnas = Object.keys(filas[0]);
    const nombreDataset = nombre_dataset || req.file.originalname.replace(/\.csv$/i, '');

    // Tipos permitidos de dataset
    const TIPOS_VALIDOS = ['general', 'financiero', 'inventario', 'rrhh', 'produccion', 'ventas', 'insumos'];
    const tipoDataset = TIPOS_VALIDOS.includes(tipo_dataset) ? tipo_dataset : 'general';

    // Crear registro en la tabla datasets
    const datasetRes = await query(
      `INSERT INTO datasets (nombre, descripcion, nombre_archivo, total_filas, columnas, tipo_dataset, empresa_id, user_id)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
       RETURNING id, nombre, total_filas, columnas, tipo_dataset, created_at`,
      [
        nombreDataset,
        descripcion || null,
        req.file.originalname,
        filas.length,
        JSON.stringify(columnas),
        tipoDataset,
        empresa_id,
        req.user.id,
      ]
    );

    const dataset = datasetRes.rows[0];

    // Insertar todas las filas en registros_datos usando una sola query parametrizada
    // Construimos VALUES dinámicos: ($1,$2,$3), ($4,$5,$6), ...
    const valores = [];
    const placeholders = filas.map((fila, i) => {
      const base = i * 3;
      valores.push(dataset.id, i + 1, JSON.stringify(fila));
      return `($${base + 1}, $${base + 2}, $${base + 3}::jsonb)`;
    });

    await query(
      `INSERT INTO registros_datos (dataset_id, fila_numero, datos) VALUES ${placeholders.join(', ')}`,
      valores
    );

    return res.status(201).json({
      success: true,
      message: `CSV cargado correctamente. ${filas.length} filas importadas.`,
      data: {
        dataset: {
          ...dataset,
          total_filas: filas.length,
          columnas,
        },
      },
    });
  } catch (err) {
    console.error('Error en uploadCSV:', err);
    return res.status(500).json({ success: false, message: 'Error al procesar el archivo' });
  }
};

// ── GET /api/upload/datasets ──────────────────────────────────────────────────
const listarDatasets = async (req, res) => {
  try {
    const { empresa_id } = req.query;

    let sql = `
      SELECT d.id, d.nombre, d.descripcion, d.nombre_archivo,
             d.total_filas, d.columnas, d.created_at,
             e.nombre AS empresa_nombre
      FROM datasets d
      JOIN empresas e ON e.id = d.empresa_id
      WHERE d.user_id = $1
    `;
    const params = [req.user.id];

    if (empresa_id) {
      sql += ' AND d.empresa_id = $2';
      params.push(empresa_id);
    }

    sql += ' ORDER BY d.created_at DESC';

    const resultado = await query(sql, params);

    return res.json({ success: true, data: { datasets: resultado.rows } });
  } catch (err) {
    console.error('Error en listarDatasets:', err);
    return res.status(500).json({ success: false, message: 'Error al listar datasets' });
  }
};

// ── GET /api/upload/datasets/:id/registros ────────────────────────────────────
const obtenerRegistros = async (req, res) => {
  try {
    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(500, parseInt(req.query.limit || '100', 10));
    const offset = (page - 1) * limit;

    // Verificar propiedad del dataset
    const datasetRes = await query(
      'SELECT id FROM datasets WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (datasetRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dataset no encontrado' });
    }

    const [registrosRes, totalRes] = await Promise.all([
      query(
        'SELECT fila_numero, datos FROM registros_datos WHERE dataset_id = $1 ORDER BY fila_numero LIMIT $2 OFFSET $3',
        [id, limit, offset]
      ),
      query('SELECT COUNT(*) FROM registros_datos WHERE dataset_id = $1', [id]),
    ]);

    const total = parseInt(totalRes.rows[0].count, 10);

    return res.json({
      success: true,
      data: {
        registros: registrosRes.rows,
        paginacion: { total, page, limit, paginas: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    console.error('Error en obtenerRegistros:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener registros' });
  }
};

// ── DELETE /api/upload/datasets/:id ──────────────────────────────────────────
const eliminarDataset = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await query(
      'SELECT id FROM datasets WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dataset no encontrado' });
    }
    await query('DELETE FROM registros_datos WHERE dataset_id = $1', [id]);
    await query('DELETE FROM datasets WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Dataset eliminado correctamente' });
  } catch (err) {
    console.error('Error en eliminarDataset:', err);
    return res.status(500).json({ success: false, message: 'Error al eliminar el dataset' });
  }
};

// ── DELETE /api/upload/datasets (limpiar todos) ───────────────────────────────
const limpiarDatasets = async (req, res) => {
  try {
    const dsRes = await query('SELECT id FROM datasets WHERE user_id = $1', [req.user.id]);
    const ids = dsRes.rows.map(r => r.id);
    if (ids.length > 0) {
      await query('DELETE FROM registros_datos WHERE dataset_id = ANY($1)', [ids]);
      await query('DELETE FROM datasets WHERE user_id = $1', [req.user.id]);
    }
    return res.json({ success: true, message: `${ids.length} dataset(s) eliminados` });
  } catch (err) {
    console.error('Error en limpiarDatasets:', err);
    return res.status(500).json({ success: false, message: 'Error al limpiar los datasets' });
  }
};

// ── POST /api/upload/cleaned-json ──────────────────────────────────────────
const uploadCleanedJSON = async (req, res) => {
  try {
    const { empresa_id, nombre_dataset, descripcion, tipo_dataset, filas } = req.body;

    if (!empresa_id) {
      return res.status(400).json({ success: false, message: 'empresa_id es obligatorio' });
    }

    if (!filas || !Array.isArray(filas) || filas.length === 0) {
      return res.status(400).json({ success: false, message: 'Se requiere un array de filas de datos' });
    }

    // Verificar que la empresa pertenece al usuario autenticado
    const empresaRes = await query(
      'SELECT id FROM empresas WHERE id = $1 AND user_id = $2',
      [empresa_id, req.user.id]
    );

    if (empresaRes.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos sobre esta empresa',
      });
    }

    const columnas = Object.keys(filas[0]);
    const nombreDataset = nombre_dataset || `Dataset Limpio ${new Date().toISOString()}`;

    // Tipos permitidos de dataset
    const TIPOS_VALIDOS = ['general', 'financiero', 'inventario', 'rrhh', 'produccion', 'ventas', 'insumos'];
    const tipoDataset = TIPOS_VALIDOS.includes(tipo_dataset) ? tipo_dataset : 'general';

    // Crear registro en la tabla datasets
    const datasetRes = await query(
      `INSERT INTO datasets (nombre, descripcion, nombre_archivo, total_filas, columnas, tipo_dataset, empresa_id, user_id)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
       RETURNING id, nombre, total_filas, columnas, tipo_dataset, created_at`,
      [
        nombreDataset,
        descripcion || null,
        'from_api.json',
        filas.length,
        JSON.stringify(columnas),
        tipoDataset,
        empresa_id,
        req.user.id,
      ]
    );

    const dataset = datasetRes.rows[0];

    // Insertar todas las filas en registros_datos usando una sola query parametrizada
    const valores = [];
    const placeholders = filas.map((fila, i) => {
      const base = i * 3;
      valores.push(dataset.id, i + 1, JSON.stringify(fila));
      return `($${base + 1}, $${base + 2}, $${base + 3}::jsonb)`;
    });

    await query(
      `INSERT INTO registros_datos (dataset_id, fila_numero, datos) VALUES ${placeholders.join(', ')}`,
      valores
    );

    return res.status(201).json({
      success: true,
      message: `JSON cargado correctamente. ${filas.length} filas importadas.`,
      data: {
        dataset: {
          ...dataset,
          total_filas: filas.length,
          columnas,
        },
      },
    });
  } catch (err) {
    console.error('Error en uploadCleanedJSON:', err);
    return res.status(500).json({ success: false, message: 'Error al procesar el JSON' });
  }
};

module.exports = { uploadCSV, uploadCleanedJSON, listarDatasets, obtenerRegistros, eliminarDataset, limpiarDatasets };
