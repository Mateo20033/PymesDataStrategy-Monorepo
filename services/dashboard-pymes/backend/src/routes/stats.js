const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/statsController');

const router = Router();
router.use(authMiddleware);
router.get('/dashboard', getDashboardStats);

module.exports = router;
