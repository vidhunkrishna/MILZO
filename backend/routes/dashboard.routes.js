const express = require('express');
const router = express.Router();
const { getDashboardStats, getRevenueGraph, getOrderTrends, getDeliveryPerformance, getSubscriptionTrends, getCustomerDashboardStats } = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/customer', getCustomerDashboardStats);
router.get('/stats', authorize('superAdmin', 'operationsManager', 'financeManager', 'deliveryManager', 'customerSupport'), getDashboardStats);
router.get('/revenue-graph', getRevenueGraph);
router.get('/order-trends', getOrderTrends);
router.get('/delivery-performance', getDeliveryPerformance);
router.get('/subscription-trends', getSubscriptionTrends);

module.exports = router;
