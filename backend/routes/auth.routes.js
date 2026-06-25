const express = require('express');
const router = express.Router();
const { login, logout, getMe, forgotPassword, resetPassword, changePassword, refreshToken } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', authLimiter, forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.put('/change-password', protect, changePassword);
router.post('/refresh-token', refreshToken);

module.exports = router;
