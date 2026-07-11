const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

const { processRefund } = require('../controllers/payment.controller');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const supabase = require('../config/supabase');

// Mock request and response helpers
const mockResponse = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

const runTests = async () => {
  console.log('--- STARTING REFUND ENGINE LOGIC VERIFICATION ---');

  // Test Case 1: COD payment rejection
  const reqCod = {
    params: { id: 'test-cod-id' },
    body: { amount: 100, reason: 'Test COD Reject' },
    user: { id: 'admin-id', role: 'admin' }
  };
  const resCod = mockResponse();

  // Mock Payment.findById for COD
  const originalFindById = Payment.findById;
  Payment.findById = async (id) => {
    if (id === 'test-cod-id') {
      return { id: 'test-cod-id', method: 'cod', status: 'captured', amount: 100 };
    }
    return null;
  };

  try {
    await processRefund(reqCod, resCod);
    console.log('Test COD Rejection result:', resCod.data);
    if (resCod.statusCode === 400 && resCod.data.message.includes('Cash on Delivery')) {
      console.log('✅ COD Rejection: PASSED');
    } else {
      console.log('❌ COD Rejection: FAILED');
    }
  } catch (err) {
    console.error('COD Rejection test crashed:', err);
  }

  // Test Case 2: Ineligible Status (pending/failed) Rejection
  const reqPending = {
    params: { id: 'test-pending-id' },
    body: { amount: 100 },
    user: { id: 'admin-id', role: 'admin' }
  };
  const resPending = mockResponse();

  Payment.findById = async (id) => {
    if (id === 'test-pending-id') {
      return { id: 'test-pending-id', method: 'online', status: 'pending', amount: 100 };
    }
    return null;
  };

  try {
    await processRefund(reqPending, resPending);
    if (resPending.statusCode === 400 && resPending.data.message.includes('must be captured')) {
      console.log('✅ Ineligible Status Rejection: PASSED');
    } else {
      console.log('❌ Ineligible Status Rejection: FAILED');
    }
  } catch (err) {
    console.error('Ineligible Status test crashed:', err);
  }

  // Test Case 3: Over-Refund Limit Rejection
  const reqOver = {
    params: { id: 'test-over-id' },
    body: { amount: 60 },
    user: { id: 'admin-id', role: 'admin' }
  };
  const resOver = mockResponse();

  Payment.findById = async (id) => {
    if (id === 'test-over-id') {
      return {
        id: 'test-over-id',
        method: 'online',
        status: 'partially_refunded',
        amount: 100,
        refund: { amount: 50 } // already refunded 50, trying to refund 60 (total 110 > 100)
      };
    }
    return null;
  };

  try {
    await processRefund(reqOver, resOver);
    if (resOver.statusCode === 400 && resOver.data.message.includes('exceeds')) {
      console.log('✅ Over-Refund Limit Rejection: PASSED');
    } else {
      console.log('❌ Over-Refund Limit Rejection: FAILED');
    }
  } catch (err) {
    console.error('Over-Refund test crashed:', err);
  }

  // Restore original Payment.findById
  Payment.findById = originalFindById;
  console.log('--- REFUND ENGINE LOGIC VERIFICATION COMPLETED ---');
};

runTests();
