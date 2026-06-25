const express = require('express');
const router = express.Router();
const { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, updateCustomerStatus, getCustomerHistory, exportCustomers } = require('../controllers/customer.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/export', exportCustomers);
router.get('/', getCustomers);
router.post('/', authorize('superAdmin', 'operationsManager', 'customerSupport'), createCustomer);
router.get('/:id', getCustomer);
router.put('/:id', authorize('superAdmin', 'operationsManager', 'customerSupport'), updateCustomer);
router.delete('/:id', authorize('superAdmin'), deleteCustomer);
router.patch('/:id/status', authorize('superAdmin', 'operationsManager', 'customerSupport'), updateCustomerStatus);
router.get('/:id/history', getCustomerHistory);

module.exports = router;
