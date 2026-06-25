const express = require('express');
const router = express.Router();
const { getRoutes, createRoute, updateRoute, deleteRoute } = require('../controllers/delivery.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/routes', getRoutes);
router.post('/routes', authorize('superAdmin', 'operationsManager', 'deliveryManager'), createRoute);
router.put('/routes/:id', authorize('superAdmin', 'operationsManager', 'deliveryManager'), updateRoute);
router.delete('/routes/:id', authorize('superAdmin'), deleteRoute);

module.exports = router;
