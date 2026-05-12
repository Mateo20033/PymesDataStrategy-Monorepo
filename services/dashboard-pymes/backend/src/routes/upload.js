const { Router } = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const { uploadCSV, uploadCleanedJSON, listarDatasets, obtenerRegistros, eliminarDataset, limpiarDatasets } = require('../controllers/uploadController');

// Almacenamiento en memoria (el buffer llega directo al controller)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB máximo
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.toLowerCase().endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV'), false);
    }
  },
});

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.post('/', upload.single('archivo'), uploadCSV);
router.post('/cleaned-json', uploadCleanedJSON);
router.get('/datasets', listarDatasets);
router.get('/datasets/:id/registros', obtenerRegistros);
router.delete('/datasets', limpiarDatasets);
router.delete('/datasets/:id', eliminarDataset);

// Manejo de errores de multer
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const mensajes = {
      LIMIT_FILE_SIZE: 'El archivo supera el tamaño máximo permitido (10 MB)',
      LIMIT_UNEXPECTED_FILE: 'Campo de archivo inesperado',
    };
    return res.status(400).json({
      success: false,
      message: mensajes[err.code] || err.message,
    });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
