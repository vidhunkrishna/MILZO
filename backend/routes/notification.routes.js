const express = require('express');
const router = express.Router();
const { getNotifications, createNotification, markNotificationRead, markAllRead } = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/', getNotifications);
router.post('/', authorize('superAdmin', 'operationsManager'), createNotification);
router.patch('/:id/read', markNotificationRead);
router.patch('/read-all', markAllRead);

module.exports = router;
