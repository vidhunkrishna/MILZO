const express = require('express');
const router = express.Router();
const { getAuditLogs, getErrorLogs, resolveErrorLog } = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/audit', getAuditLogs);
router.get('/audit-logs', getAuditLogs);
router.get('/errors', getErrorLogs);
router.get('/error-logs', getErrorLogs);
router.patch('/errors/:id/resolve', authorize('superAdmin'), resolveErrorLog);
router.patch('/resolve-error/:id', authorize('superAdmin'), resolveErrorLog);

module.exports = router;
