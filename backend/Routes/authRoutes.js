const router = require('express').Router();
const { login, status, confirm, logout } = require('../controller/authController');
const { protect } = require('../middleware/authMiddleware');
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.post('/login', login);
router.get('/session', protect, status);
router.post('/session/continue', protect, confirm);
router.post('/logout', logout);
module.exports = router;
