const Payment = require('../models/Payment');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const ApiResponse = require('../utils/apiResponse');
const { paginate } = require('../utils/pagination');
const supabase = require('../config/supabase');

const getPayments = async (req, res) => {
  const { status, type, customer, method, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  const filter = { deleted_at: null };
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (customer) filter.customer = customer;
  if (method) filter.method = method;
  const result = await paginate('payments', filter, { page, limit, sortBy, sortOrder });
  return ApiResponse.paginated(res, result.data, result.pagination);
};

const getPayment = async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return ApiResponse.notFound(res, 'Payment not found');
  return ApiResponse.success(res, payment);
};

// Create Razorpay order
const createRazorpayOrder = async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;
  const options = {
    amount: amount * 100,
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
  };
  const razorpayOrder = await razorpay.orders.create(options);
  return ApiResponse.success(res, razorpayOrder, 'Razorpay order created');
};

// Verify Razorpay payment
const verifyRazorpayPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;
  const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign).digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return ApiResponse.error(res, 'Payment verification failed', 400);
  }

  const payment = await Payment.update(paymentId, {
    status: 'captured',
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });

  return ApiResponse.success(res, payment, 'Payment verified successfully');
};

// Process refund
const processRefund = async (req, res) => {
  const { amount, reason } = req.body;
  const payment = await Payment.findById(req.params.id);
  if (!payment) return ApiResponse.notFound(res, 'Payment not found');
  if (payment.status !== 'captured') return ApiResponse.error(res, 'Cannot refund this payment', 400);

  try {
    const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
      amount: (amount || payment.amount) * 100,
      notes: { reason },
    });

    const refundStatus = amount < payment.amount ? 'partially_refunded' : 'refunded';
    await Payment.update(payment.id, {
      status: refundStatus,
      refund: {
        refundId: refund.id,
        amount: amount || payment.amount,
        reason,
        status: 'processed',
        processedAt: new Date().toISOString(),
        processedBy: req.user._id,
      },
    });

    const updated = await Payment.findById(payment.id);
    return ApiResponse.success(res, updated, 'Refund processed');
  } catch (err) {
    return ApiResponse.error(res, `Refund failed: ${err.message}`, 500);
  }
};

// Generate invoice number
const generateInvoice = async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return ApiResponse.notFound(res, 'Payment not found');
  const invoiceNumber = `INV-${Date.now()}`;
  await Payment.update(payment.id, {
    invoice: { invoiceNumber, generatedAt: new Date().toISOString() },
  });
  const updated = await Payment.findById(payment.id);
  return ApiResponse.success(res, { invoiceNumber, payment: updated }, 'Invoice generated');
};

// Revenue summary
const getRevenueSummary = async (req, res) => {
  const { startDate, endDate } = req.query;
  const { data, error } = await supabase.rpc('get_revenue_summary', {
    p_start_date: startDate || null,
    p_end_date: endDate || null,
  });
  if (error) throw new Error(error.message);
  return ApiResponse.success(res, data || []);
};

module.exports = { getPayments, getPayment, createRazorpayOrder, verifyRazorpayPayment, processRefund, generateInvoice, getRevenueSummary };
