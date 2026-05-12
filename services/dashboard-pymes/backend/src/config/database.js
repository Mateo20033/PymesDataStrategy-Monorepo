const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME     || 'pymes_ai',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 10,               // máximo de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Ejecuta una query parametrizada.
 * @param {string} text  Sentencia SQL con placeholders ($1, $2…)
 * @param {Array}  params Valores para los placeholders
 */
const query = (text, params) => pool.query(text, params);

/**
 * Verifica la conexión al arrancar el servidor.
 */
const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('PostgreSQL conectado:', result.rows[0].now);
  } catch (err) {
    console.error('Error al conectar con PostgreSQL:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, query, testConnection };
