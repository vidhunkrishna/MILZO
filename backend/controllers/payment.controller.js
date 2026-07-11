const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const crypto = require('crypto');
const ApiResponse = require('../utils/apiResponse');
const { paginate } = require('../utils/pagination');
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

// Confirm dotenv.config() is executed before Razorpay initialization
require('dotenv').config();

// Log whether environment variables exist (never log the actual secret)
console.log('process.env.RAZORPAY_KEY_ID exists:', !!process.env.RAZORPAY_KEY_ID);
console.log('process.env.RAZORPAY_KEY_SECRET exists:', !!process.env.RAZORPAY_KEY_SECRET);

const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});


// @desc    Get all payments
// @route   GET /api/payments
const getPayments = async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

  try {
    // 1. Fetch wallet recharges / payments
    const paymentsQuery = supabase
      .from('payments')
      .select('*, customer_details:customers(name)')
      .is('deleted_at', null);

    // 2. Fetch order payments (exclude non-paid/draft COD orders)
    const ordersQuery = supabase
      .from('orders')
      .select('*, customer_details:customers(name)')
      .is('deleted_at', null);

    const [paymentsRes, ordersRes] = await Promise.all([paymentsQuery, ordersQuery]);
    
    if (paymentsRes.error) throw new Error(paymentsRes.error.message);
    if (ordersRes.error) throw new Error(ordersRes.error.message);

    // 3. Map wallet payments
    const mappedPayments = (paymentsRes.data || []).map(row => ({
      id: row.id,
      _id: row.id,
      customer: row.customer,
      customerName: row.customer_details?.name || 'Unknown',
      amount: Number(row.amount),
      method: row.method,
      status: row.status,
      type: row.type === 'subscription_payment' ? 'wallet_recharge' : row.type,
      created_at: row.created_at,
      razorpay_payment_id: row.razorpay_payment_id || 'N/A',
      refund: row.refund,
    }));

    // 4. Map order payments (filter out orders that don't have transaction_id or are plain unpaid COD)
    const mappedOrderPayments = (ordersRes.data || [])
      .filter(order => {
        const hasTx = order.transaction_id && order.transaction_id !== 'N/A';
        const isOnlineOrWallet = order.payment_method === 'online' || order.payment_method === 'wallet';
        const isPaidCod = order.payment_method === 'cod' && order.payment_status === 'captured';
        return hasTx || isOnlineOrWallet || isPaidCod;
      })
      .map(row => {
        let parsedPayment = {
          method: row.payment_method,
          status: row.payment_status,
          transactionId: row.transaction_id,
          paidAt: row.created_at,
          refund: null
        };
        const txId = row.transaction_id;
        if (txId && txId.trim().startsWith('{') && txId.trim().endsWith('}')) {
          try {
            const parsed = JSON.parse(txId);
            parsedPayment.method = parsed.method || row.payment_method;
            parsedPayment.status = parsed.status || row.payment_status;
            parsedPayment.transactionId = parsed.transactionId || row.transaction_id;
            parsedPayment.paidAt = parsed.paidAt || row.created_at;
            parsedPayment.refund = parsed.refund || null;
          } catch (e) {}
        }
        
        return {
          id: row.id,
          _id: row.id,
          customer: row.customer,
          customerName: row.customer_details?.name || 'Unknown',
          amount: Number(row.total),
          method: (parsedPayment.method === 'online' || parsedPayment.method === 'razorpay') ? 'online' : parsedPayment.method === 'wallet' ? 'wallet' : 'cod',
          status: parsedPayment.status === 'paid' ? 'captured' : parsedPayment.status,
          type: 'order_payment',
          created_at: row.created_at,
          razorpay_payment_id: parsedPayment.transactionId || 'N/A',
          refund: parsedPayment.refund,
        };
      });

    // 5. Merge lists
    const combined = [...mappedPayments, ...mappedOrderPayments];

    // 6. Sort
    combined.sort((a, b) => {
      const valA = new Date(a[sortBy] || a.created_at);
      const valB = new Date(b[sortBy] || b.created_at);
      return sortOrder.toLowerCase() === 'asc' ? valA - valB : valB - valA;
    });

    // 7. Paginate
    const totalItems = combined.length;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const totalPages = Math.ceil(totalItems / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = combined.slice(startIndex, startIndex + limitNum);

    const pagination = {
      page: pageNum,
      limit: limitNum,
      totalPages,
      totalItems,
    };

    return ApiResponse.paginated(res, paginatedItems, pagination);
  } catch (err) {
    logger.error(`Error fetching combined payments: ${err.message}`);
    return ApiResponse.error(res, `Failed to fetch payments: ${err.message}`, 500);
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
const getPayment = async (req, res) => {
  // Try finding in payments first
  const { data, error } = await supabase
    .from('payments')
    .select('*, customer_details:customers(name)')
    .eq('id', req.params.id)
    .is('deleted_at', null)
    .single();

  if (data) {
    const payment = {
      ...data,
      _id: data.id,
      customerName: data.customer_details?.name || 'Unknown'
    };

    if (req.user.role === 'customer' && payment.customer !== (req.user.id || req.user._id)) {
      return ApiResponse.forbidden(res, 'You are not authorized to view this payment');
    }
    return ApiResponse.success(res, payment);
  }

  // Not found in payments, try orders
  const { data: orderData, error: orderErr } = await supabase
    .from('orders')
    .select('*, customer_details:customers(name)')
    .eq('id', req.params.id)
    .is('deleted_at', null)
    .single();

  if (orderErr || !orderData) return ApiResponse.notFound(res, 'Payment not found');

  // Map order to payment structure
  let parsedPayment = {
    method: orderData.payment_method,
    status: orderData.payment_status,
    transactionId: orderData.transaction_id,
    paidAt: orderData.created_at,
    refund: null
  };
  const txId = orderData.transaction_id;
  if (txId && txId.trim().startsWith('{') && txId.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(txId);
      parsedPayment.method = parsed.method || orderData.payment_method;
      parsedPayment.status = parsed.status || orderData.payment_status;
      parsedPayment.transactionId = parsed.transactionId || orderData.transaction_id;
      parsedPayment.paidAt = parsed.paidAt || orderData.created_at;
      parsedPayment.refund = parsed.refund || null;
    } catch (e) {}
  }

  const payment = {
    id: orderData.id,
    _id: orderData.id,
    customer: orderData.customer,
    customerName: orderData.customer_details?.name || 'Unknown',
    amount: Number(orderData.total),
    method: (parsedPayment.method === 'online' || parsedPayment.method === 'razorpay') ? 'online' : parsedPayment.method === 'wallet' ? 'wallet' : 'cod',
    status: parsedPayment.status === 'paid' ? 'captured' : parsedPayment.status,
    type: 'order_payment',
    created_at: orderData.created_at,
    razorpay_payment_id: parsedPayment.transactionId || 'N/A',
    refund: parsedPayment.refund,
  };

  if (req.user.role === 'customer' && payment.customer !== (req.user.id || req.user._id)) {
    return ApiResponse.forbidden(res, 'You are not authorized to view this payment');
  }

  return ApiResponse.success(res, payment);
};

// @desc    Create Razorpay order & pending db payment
// @route   POST /api/payments/razorpay/create-order
const createRazorpayOrder = async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;
  const userId = req.user.id || req.user._id;

  // Validate:
  // - amount is a number
  // - amount > 0
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return ApiResponse.error(res, 'Invalid recharge amount', 400);
  }

  let razorpayOrder;
  try {
    const options = {
      amount: amount * 100, // converted into paise
      currency,
      receipt: receipt || `rcpt_wallet_${Date.now()}`,
    };
    
    // Create order in Razorpay
    razorpayOrder = await razorpay.orders.create(options);
  } catch (error) {
    if (error.statusCode === 401) {
      console.error("RAZORPAY 401 ERROR BODY:");
      console.error(error.error || error);
    } else if (process.env.NODE_ENV === 'development') {
      console.error("RAZORPAY ERROR");
      console.error(error);
    }
    
    const errMsg = error.statusCode === 401 
      ? JSON.stringify(error.error || error) 
      : error.message;

    return ApiResponse.error(
      res,
      errMsg,
      error.statusCode || 500,
      {
        stack: process.env.NODE_ENV === "development"
          ? error.stack
          : undefined
      }
    );
  }

  try {
    // Create pending payment log in DB
    const payment = await Payment.create({
      customer: userId,
      amount,
      currency,
      method: 'wallet', // recharging the wallet
      status: 'pending',
      type: 'wallet_recharge',
      razorpayOrderId: razorpayOrder.id,
    });

    return ApiResponse.success(res, { razorpayOrder, payment }, 'Razorpay order created');
  } catch (err) {
    logger.error(`Error creating Razorpay order in DB: ${err.message}`);
    return ApiResponse.error(res, `Razorpay order creation failed: ${err.message}`, 500);
  }
};

// @desc    Verify Razorpay signature & update wallet balance
// @route   POST /api/payments/razorpay/verify
const verifyRazorpayPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;
  
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !paymentId) {
    return ApiResponse.error(res, 'Missing verification parameters', 400);
  }

  const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign).digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return ApiResponse.error(res, 'Payment verification failed', 400);
  }

  let paymentCaptured = false;
  let walletBalanceUpdated = false;

  try {
    // 1. Perform atomic update: only update if status is 'pending'
    const { data: updatedPayments, error: updateErr } = await supabase
      .from('payments')
      .update({
        status: 'captured',
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
      })
      .eq('id', paymentId)
      .eq('status', 'pending')
      .select();

    if (updateErr) {
      throw new Error(`Atomic update query failed: ${updateErr.message}`);
    }

    // If no row was updated, it means another request already processed it
    if (!updatedPayments || updatedPayments.length === 0) {
      return ApiResponse.error(res, 'Payment has already been processed or is not pending', 400);
    }

    paymentCaptured = true;
    const payment = { ...updatedPayments[0], _id: updatedPayments[0].id };
    if (payment.method === 'wallet' && payment.type === 'subscription_payment') {
      payment.type = 'wallet_recharge';
    }

    // 2. Update customer wallet balance if recharge
    if (payment.type === 'wallet_recharge') {
      const customer = await Customer.findById(payment.customer);
      if (!customer) {
        throw new Error('Customer profile not found');
      }

      const currentBalance = Number(customer.wallet_balance || 0);
      const newBalance = currentBalance + Number(payment.amount);
      
      await Customer.update(payment.customer, { wallet_balance: newBalance });
      walletBalanceUpdated = true;

      // 3. Log transaction in wallet_transactions table
      try {
        const txRes = await supabase.from('wallet_transactions').insert({
          customer_id: payment.customer,
          amount: payment.amount,
          type: 'credit',
          description: `Wallet recharge via Razorpay (Ref: ${razorpay_payment_id})`,
        });
        if (txRes.error) {
          throw new Error(txRes.error.message);
        }
      } catch (txErr) {
        // Log transaction error but do not fail the request since the wallet was credited
        logger.error(`Failed to log wallet transaction but wallet balance was credited: ${txErr.message}`);
      }
    }

    return ApiResponse.success(res, payment, 'Payment verified and wallet credited successfully');
  } catch (err) {
    logger.error(`Error verifying Razorpay payment: ${err.message}`);

    // Recovery Rollback: Revert payment status to pending if captured but wallet was NOT updated
    if (paymentCaptured && !walletBalanceUpdated) {
      try {
        await supabase
          .from('payments')
          .update({
            status: 'pending',
            razorpay_payment_id: null,
            razorpay_signature: null,
          })
          .eq('id', paymentId);
        logger.info(`Recovery Rollback: Reverted payment status to pending for paymentId: ${paymentId}`);
      } catch (rollbackErr) {
        logger.error(`Recovery Rollback Failed: ${rollbackErr.message}`);
      }
    }

    return ApiResponse.error(res, `Failed to verify payment: ${err.message}`, 500);
  }
};

// @desc    Process refund
// @route   POST /api/payments/:id/refund
const processRefund = async (req, res) => {
  const { amount, reason } = req.body;
  
  // Try to find in payments table
  let payment = await Payment.findById(req.params.id);
  let isOrderPayment = false;
  let order = null;

  if (!payment) {
    // If not found, check orders table
    order = await Order.findById(req.params.id);
    if (!order) return ApiResponse.notFound(res, 'Transaction not found');
    
    payment = {
      id: order.id,
      amount: order.total,
      customer: order.customer,
      method: order.payment?.method || order.payment_method,
      status: order.payment?.status || order.payment_status,
      razorpay_payment_id: order.payment?.transactionId || order.transaction_id,
      refund: order.payment?.refund,
    };
    isOrderPayment = true;
  }

  // COD payments cannot be refunded online/automatically
  if (payment.method === 'cod') {
    return ApiResponse.error(res, 'Cannot refund Cash on Delivery payments via online gateway.', 400);
  }

  // Payments must be captured to be refunded
  if (payment.status !== 'captured' && payment.status !== 'partially_refunded' && payment.status !== 'paid') {
    return ApiResponse.error(res, 'Payment status must be captured or partially_refunded to be refunded.', 400);
  }

  // Parse custom amount (default to total amount)
  const refundAmount = amount !== undefined ? Number(amount) : payment.amount;
  if (isNaN(refundAmount) || refundAmount <= 0) {
    return ApiResponse.error(res, 'Invalid refund amount.', 400);
  }

  // Calculate cumulative refunded amount
  const currentRefund = payment.refund || {};
  const previousRefundedAmount = Number(currentRefund.amount || 0);
  const newRefundedAmount = previousRefundedAmount + refundAmount;

  // Double check refund limits
  if (newRefundedAmount > payment.amount) {
    return ApiResponse.error(res, 'Refund amount exceeds remaining charged amount.', 400);
  }

  try {
    let refundId = '';
    
    if (payment.method === 'wallet') {
      // 1. Credit wallet balance
      const customer = await Customer.findById(payment.customer);
      if (!customer) {
        return ApiResponse.notFound(res, 'Customer profile not found');
      }

      const currentBalance = Number(customer.wallet_balance || 0);
      const newBalance = currentBalance + refundAmount;
      await Customer.update(payment.customer, { wallet_balance: newBalance });

      // 2. Log credit wallet transaction
      refundId = `wref_${Date.now()}`;
      await supabase.from('wallet_transactions').insert({
        customer_id: payment.customer,
        amount: refundAmount,
        type: 'credit',
        description: `Wallet refund for payment reference ${payment.id} (${reason || 'Admin Initiated'})`,
      });
    } else {
      // Razorpay / Online Payment Refund
      if (!payment.razorpay_payment_id || payment.razorpay_payment_id === 'N/A') {
        return ApiResponse.error(res, 'Razorpay Payment ID is missing for this transaction.', 400);
      }

      // Call Razorpay API to process refund
      const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
        amount: Math.round(refundAmount * 100), // convert to paise
        notes: { reason: reason || 'Admin Initiated' },
      });
      refundId = refund.id;
    }

    // Determine final status
    const refundStatus = newRefundedAmount < payment.amount ? 'partially_refunded' : 'refunded';
    
    // Append to refund history list
    const refundHistory = currentRefund.history || [];
    refundHistory.push({
      refundId,
      amount: refundAmount,
      reason: reason || 'Admin Initiated',
      processedAt: new Date().toISOString(),
      processedBy: req.user._id || req.user.id,
    });

    const refundPayload = {
      refundId,
      amount: newRefundedAmount,
      reason: reason || 'Admin Initiated',
      status: 'processed',
      processedAt: new Date().toISOString(),
      processedBy: req.user._id || req.user.id,
      history: refundHistory,
    };

    if (isOrderPayment) {
      // Update order status, payment status, and serialized payment details inside transaction_id
      const updatedPaymentObj = {
        method: payment.method,
        status: refundStatus,
        transactionId: payment.razorpay_payment_id,
        paidAt: order?.payment?.paidAt || order?.created_at,
        refund: refundPayload,
      };

      const orderUpdates = { 
        payment_status: refundStatus,
        transaction_id: JSON.stringify(updatedPaymentObj),
      };

      // Loophole Fix: If the payment is fully refunded, cancel the order status!
      if (refundStatus === 'refunded') {
        orderUpdates.status = 'cancelled';
        orderUpdates.cancel_reason = reason || 'Admin Initiated Full Refund';
      }

      await Order.update(order.id, orderUpdates);

      await Order.addTimelineEntry(order.id, {
        status: refundStatus === 'refunded' ? 'cancelled' : order.status,
        timestamp: new Date().toISOString(),
        note: `Refund of ₹${refundAmount} processed (${payment.method === 'wallet' ? 'Wallet Credit' : 'Razorpay Gateway'}). Reason: ${reason || 'Admin Initiated'}${refundStatus === 'refunded' ? ' - Order cancelled.' : ''}`,
        updatedBy: req.user._id || req.user.id,
      });

      const updatedOrder = await Order.findById(order.id);
      
      const mappedUpdated = {
        id: updatedOrder.id,
        _id: updatedOrder.id,
        customer: updatedOrder.customer,
        customerName: payment.customerName || 'Unknown',
        amount: Number(updatedOrder.total),
        method: updatedOrder.payment?.method,
        status: updatedOrder.payment?.status === 'paid' ? 'captured' : updatedOrder.payment?.status,
        type: 'order_payment',
        created_at: updatedOrder.created_at,
        razorpay_payment_id: updatedOrder.payment?.transactionId || 'N/A',
        refund: updatedOrder.payment?.refund,
      };
      return ApiResponse.success(res, mappedUpdated, 'Refund processed successfully');
    } else {
      // Update payment record in database
      await Payment.update(payment.id, {
        status: refundStatus,
        refund: refundPayload,
      });

      const updated = await Payment.findById(payment.id);
      return ApiResponse.success(res, updated, 'Refund processed successfully');
    }
  } catch (err) {
    logger.error(`Refund failed: ${err.message}`);
    return ApiResponse.error(res, `Refund failed: ${err.message}`, 500);
  }
};

// @desc    Generate invoice number
// @route   POST /api/payments/:id/invoice
const generateInvoice = async (req, res) => {
  // Try to find in payments table
  let payment = await Payment.findById(req.params.id);
  let isOrderPayment = false;
  let order = null;

  if (!payment) {
    // Check if it is an order
    order = await Order.findById(req.params.id);
    if (!order) return ApiResponse.notFound(res, 'Payment not found');
    
    // Map order to payment structure
    let parsedPayment = {
      method: order.payment_method,
      status: order.payment_status,
      transactionId: order.transaction_id,
      paidAt: order.created_at,
      refund: null,
      invoice: null
    };
    const txId = order.transaction_id;
    if (txId && txId.trim().startsWith('{') && txId.trim().endsWith('}')) {
      try {
        const parsed = JSON.parse(txId);
        parsedPayment.method = parsed.method || order.payment_method;
        parsedPayment.status = parsed.status || order.payment_status;
        parsedPayment.transactionId = parsed.transactionId || order.transaction_id;
        parsedPayment.paidAt = parsed.paidAt || order.created_at;
        parsedPayment.refund = parsed.refund || null;
        parsedPayment.invoice = parsed.invoice || null;
      } catch (e) {}
    }

    payment = {
      id: order.id,
      _id: order.id,
      customer: order.customer,
      amount: order.total,
      method: (parsedPayment.method === 'online' || parsedPayment.method === 'razorpay') ? 'online' : parsedPayment.method === 'wallet' ? 'wallet' : 'cod',
      status: parsedPayment.status === 'paid' ? 'captured' : parsedPayment.status,
      razorpay_payment_id: parsedPayment.transactionId || 'N/A',
      refund: parsedPayment.refund,
      invoice: parsedPayment.invoice,
    };
    isOrderPayment = true;
  }

  // Enforce customer isolation
  if (req.user.role === 'customer' && payment.customer !== (req.user.id || req.user._id)) {
    return ApiResponse.forbidden(res, 'You are not authorized to generate this invoice');
  }

  // Generate invoice number if not already present
  if (!payment.invoice?.invoiceNumber) {
    const invoiceNumber = `INV-${Date.now()}`;
    const invoiceData = { invoiceNumber, generatedAt: new Date().toISOString() };

    if (isOrderPayment) {
      const txId = order.transaction_id;
      let updatedPaymentObj = {
        method: payment.method,
        status: payment.status,
        transactionId: payment.razorpay_payment_id,
        paidAt: order.payment?.paidAt || order.created_at,
        refund: payment.refund,
        invoice: invoiceData,
      };

      if (txId && txId.trim().startsWith('{') && txId.trim().endsWith('}')) {
        try {
          const parsed = JSON.parse(txId);
          updatedPaymentObj = {
            ...parsed,
            invoice: invoiceData
          };
        } catch (e) {}
      }

      await Order.update(order.id, { 
        transaction_id: JSON.stringify(updatedPaymentObj),
      });

      const updatedOrder = await Order.findById(order.id);
      
      const mappedUpdated = {
        id: updatedOrder.id,
        _id: updatedOrder.id,
        customer: updatedOrder.customer,
        customerName: payment.customerName || 'Unknown',
        amount: Number(updatedOrder.total),
        method: updatedOrder.payment?.method,
        status: updatedOrder.payment?.status === 'paid' ? 'captured' : updatedOrder.payment?.status,
        type: 'order_payment',
        created_at: updatedOrder.created_at,
        razorpay_payment_id: updatedOrder.payment?.transactionId || 'N/A',
        refund: updatedOrder.payment?.refund,
        invoice: updatedOrder.payment?.invoice,
      };
      
      return ApiResponse.success(res, { invoiceNumber, payment: mappedUpdated }, 'Invoice generated');
    } else {
      await Payment.update(payment.id, {
        invoice: invoiceData,
      });
      const updated = await Payment.findById(payment.id);
      return ApiResponse.success(res, { invoiceNumber, payment: updated }, 'Invoice generated');
    }
  }

  return ApiResponse.success(res, { invoiceNumber: payment.invoice.invoiceNumber, payment }, 'Invoice already generated');
};

// @desc    Get wallet transaction history
// @route   GET /api/payments/wallet/transactions
const getWalletTransactions = async (req, res) => {
  const userId = req.user.id || req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const filter = { customer_id: userId };

  try {
    const result = await paginate('wallet_transactions', filter, {
      page,
      limit,
      sortBy: 'date',
      sortOrder: 'desc'
    });
    return ApiResponse.paginated(res, result.data, result.pagination);
  } catch (err) {
    logger.error(`Error loading wallet transactions: ${err.message}`);
    return ApiResponse.error(res, `Failed to load transactions: ${err.message}`, 500);
  }
};

// @desc    Revenue summary (Admin-only)
// @route   GET /api/payments/revenue-summary
const getRevenueSummary = async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const { data, error } = await supabase.rpc('get_revenue_summary', {
      p_start_date: startDate || null,
      p_end_date: endDate || null,
    });
    if (error) throw new Error(error.message);
    return ApiResponse.success(res, data || []);
  } catch (err) {
    logger.error(`Error loading revenue summary: ${err.message}`);
    return ApiResponse.error(res, `Failed to load revenue summary: ${err.message}`, 500);
  }
};

module.exports = { 
  getPayments, 
  getPayment, 
  createRazorpayOrder, 
  verifyRazorpayPayment, 
  processRefund, 
  generateInvoice, 
  getRevenueSummary,
  getWalletTransactions
};
