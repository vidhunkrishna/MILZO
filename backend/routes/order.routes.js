const express = require('express');
const router = express.Router();
const { getOrders, getOrder, createOrder, updateOrder, updateOrderStatus, cancelOrder, deleteOrder, getOrderTimeline } = require('../controllers/order.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/', getOrders);
router.post('/', authorize('superAdmin', 'operationsManager', 'customerSupport'), createOrder);
router.get('/:id', getOrder);
router.put('/:id', authorize('superAdmin', 'operationsManager'), updateOrder);
router.delete('/:id', authorize('superAdmin'), deleteOrder);
router.patch('/:id/status', authorize('superAdmin', 'operationsManager', 'deliveryManager'), updateOrderStatus);
router.patch('/:id/cancel', authorize('superAdmin', 'operationsManager', 'customerSupport'), cancelOrder);
router.get('/:id/timeline', getOrderTimeline);

module.exports = router;
