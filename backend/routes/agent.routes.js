const express = require('express');
const router = express.Router();
const { getAgents, getAgent, createAgent, updateAgent, deleteAgent, updateAgentStatus, verifyAgent, assignRoute, updateLocation } = require('../controllers/delivery.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/', getAgents);
router.post('/', authorize('superAdmin', 'operationsManager', 'deliveryManager'), createAgent);
router.get('/:id', getAgent);
router.put('/:id', authorize('superAdmin', 'operationsManager', 'deliveryManager'), updateAgent);
router.delete('/:id', authorize('superAdmin'), deleteAgent);
router.patch('/:id/status', authorize('superAdmin', 'operationsManager', 'deliveryManager'), updateAgentStatus);
router.patch('/:id/verify', authorize('superAdmin', 'operationsManager'), verifyAgent);
router.patch('/:id/routes', authorize('superAdmin', 'operationsManager', 'deliveryManager'), assignRoute);
router.patch('/:id/location', updateLocation);

module.exports = router;
