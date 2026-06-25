const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/', getSettings);
router.put('/', authorize('superAdmin'), updateSettings);

module.exports = router;
