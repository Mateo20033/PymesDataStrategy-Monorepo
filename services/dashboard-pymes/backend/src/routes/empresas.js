const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const { listarEmpresas, initEmpresa } = require('../controllers/empresaController');

const router = Router();

router.use(authMiddleware);
router.get('/',     listarEmpresas);
router.post('/init', initEmpresa);

module.exports = router;
