const express = require('express');
const router = express.Router();
const { getPayments, getPayment, createRazorpayOrder, verifyRazorpayPayment, processRefund, generateInvoice, getRevenueSummary } = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/revenue-summary', getRevenueSummary);
router.get('/', getPayments);
router.get('/:id', getPayment);
router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);
router.post('/:id/refund', authorize('superAdmin', 'financeManager'), processRefund);
router.post('/:id/invoice', generateInvoice);

module.exports = router;
