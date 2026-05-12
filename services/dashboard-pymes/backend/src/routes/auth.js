const { Router } = require('express');
const { register, login, me } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Ruta protegida — devuelve el usuario autenticado
router.get('/me', authMiddleware, me);

module.exports = router;
