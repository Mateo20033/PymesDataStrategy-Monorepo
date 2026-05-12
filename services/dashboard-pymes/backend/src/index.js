require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
const authRoutes    = require('./routes/auth');
const uploadRoutes  = require('./routes/upload');
const empresaRoutes = require('./routes/empresas');
const statsRoutes   = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware global ──────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Rutas ──────────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/upload',  uploadRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/stats',   statsRoutes);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API corriendo', timestamp: new Date().toISOString() });
});

// ── Manejo de rutas no encontradas ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// ── Manejo global de errores ───────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

// ── Inicio del servidor ────────────────────────────────────────────────────────
(async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
})();
