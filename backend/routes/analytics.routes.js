const express = require('express');
const router = express.Router();
const { getRevenueReport, getOrderAnalytics, getSubscriptionAnalytics, getDeliveryPerformance, getVendorReport, getCustomerAnalytics } = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/revenue', getRevenueReport);
router.get('/orders', getOrderAnalytics);
router.get('/subscriptions', getSubscriptionAnalytics);
router.get('/delivery', getDeliveryPerformance);
router.get('/vendors', getVendorReport);
router.get('/customers', getCustomerAnalytics);

module.exports = router;
