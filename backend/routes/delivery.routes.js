const express = require('express');
const router = express.Router();
const { 
  getRoutes, 
  createRoute, 
  updateRoute, 
  deleteRoute,
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  updateAgentStatus,
  verifyAgent,
  assignRoute,
  updateLocation
} = require('../controllers/delivery.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

// Routes
router.get('/routes', getRoutes);
router.post('/routes', authorize('superAdmin', 'operationsManager', 'deliveryManager'), createRoute);
router.put('/routes/:id', authorize('superAdmin', 'operationsManager', 'deliveryManager'), updateRoute);
router.delete('/routes/:id', authorize('superAdmin'), deleteRoute);

// Agents
router.get('/agents', getAgents);
router.post('/agents', authorize('superAdmin', 'operationsManager', 'deliveryManager'), createAgent);
router.get('/agents/:id', getAgent);
router.put('/agents/:id', authorize('superAdmin', 'operationsManager', 'deliveryManager'), updateAgent);
router.delete('/agents/:id', authorize('superAdmin'), deleteAgent);
router.patch('/agents/:id/status', authorize('superAdmin', 'operationsManager', 'deliveryManager'), updateAgentStatus);
router.patch('/agents/:id/verify', authorize('superAdmin', 'operationsManager'), verifyAgent);
router.patch('/agents/:id/routes', authorize('superAdmin', 'operationsManager', 'deliveryManager'), assignRoute);
router.patch('/agents/:id/location', updateLocation);

module.exports = router;
