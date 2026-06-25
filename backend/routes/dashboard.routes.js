const express = require('express');
const router = express.Router();
const { getDashboardStats, getRevenueGraph, getOrderTrends, getDeliveryPerformance, getSubscriptionTrends } = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/stats', getDashboardStats);
router.get('/revenue-graph', getRevenueGraph);
router.get('/order-trends', getOrderTrends);
router.get('/delivery-performance', getDeliveryPerformance);
router.get('/subscription-trends', getSubscriptionTrends);

module.exports = router;
